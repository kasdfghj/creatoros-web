import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, siteUrl, supabase } from '../lib/supabase'
import { demoUser } from '../lib/mock'
import type { Profile } from '../types'

type OAuthProvider = 'google' | 'discord' | 'github' | 'facebook' | 'twitter'

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  demoMode: boolean
  authenticated: boolean
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  enterDemo: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateLocalProfile: (profile: Profile) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function localProfileKey(id: string) {
  return `creatoros-profile-${id}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(localStorage.getItem('creatoros-demo') === 'true')

  const loadProfile = useCallback(async (userId?: string) => {
    if (demoMode) {
      const stored = localStorage.getItem(localProfileKey('demo-user'))
      setProfile(stored ? JSON.parse(stored) : demoUser)
      return
    }

    if (!userId || !supabase) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.error('Unable to load CreatorOS profile', error)
      setProfile(null)
      return
    }
    setProfile((data as Profile | null) ?? null)
  }, [demoMode])

  useEffect(() => {
    let mounted = true
    async function boot() {
      if (!supabase) {
        if (demoMode) await loadProfile('demo-user')
        if (mounted) setLoading(false)
        return
      }
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      await loadProfile(data.session?.user.id)
      setLoading(false)
    }
    void boot()

    const subscription = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void loadProfile(nextSession?.user.id)
      setLoading(false)
    }).data.subscription

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [demoMode, loadProfile])

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    if (!supabase) throw new Error('Supabase is not configured yet. Add your project URL and anon key to .env.')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl.replace(/\/$/, '')}/auth/callback` },
    })
    if (error) throw error
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured yet. Add your project URL and anon key to .env.')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl.replace(/\/$/, '')}/auth/callback` },
    })
    if (error) throw error
  }, [])

  const enterDemo = useCallback(() => {
    localStorage.setItem('creatoros-demo', 'true')
    setDemoMode(true)
    setProfile(demoUser)
  }, [])

  const signOut = useCallback(async () => {
    if (demoMode) {
      localStorage.removeItem('creatoros-demo')
      setDemoMode(false)
      setProfile(null)
      return
    }
    await supabase?.auth.signOut()
  }, [demoMode])

  const refreshProfile = useCallback(async () => {
    await loadProfile(demoMode ? 'demo-user' : session?.user.id)
  }, [demoMode, loadProfile, session?.user.id])

  const updateLocalProfile = useCallback((nextProfile: Profile) => {
    localStorage.setItem(localProfileKey(nextProfile.id), JSON.stringify(nextProfile))
    setProfile(nextProfile)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    profile,
    demoMode,
    authenticated: Boolean(session || demoMode),
    signInWithOAuth,
    sendMagicLink,
    enterDemo,
    signOut,
    refreshProfile,
    updateLocalProfile,
  }), [demoMode, enterDemo, loading, profile, refreshProfile, sendMagicLink, session, signInWithOAuth, signOut, updateLocalProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
