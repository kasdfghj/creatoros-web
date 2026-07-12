import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const runtime = (window as Window & { __CREATOROS_CONFIG__?: { supabaseUrl?: string; supabaseAnonKey?: string; siteUrl?: string } }).__CREATOROS_CONFIG__
const url = (runtime?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL)?.trim()
const anonKey = (runtime?.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim()

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes('YOUR_PROJECT_REF') && !anonKey.includes('YOUR_SUPABASE_ANON_KEY'),
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const siteUrl = runtime?.siteUrl || import.meta.env.VITE_SITE_URL || window.location.origin
