import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoCollaborations, demoEvents, demoProfiles, demoProjects, demoUpdates } from '../lib/mock'
import { supabase } from '../lib/supabase'
import type { CollaborationPost, CommunityEvent, FeedUpdate, Profile, Project } from '../types'
import { useAuth } from './AuthContext'

type NewProjectInput = Pick<Project, 'title' | 'type' | 'stage' | 'summary' | 'goal' | 'collaboration_type' | 'location_mode' | 'location' | 'roles_needed'>
type NewCollaborationInput = Pick<CollaborationPost, 'title' | 'role_needed' | 'description' | 'compensation' | 'location_mode' | 'location'> & { project_id?: string }

type CommunityContextValue = {
  loading: boolean
  profiles: Profile[]
  projects: Project[]
  updates: FeedUpdate[]
  collaborations: CollaborationPost[]
  events: CommunityEvent[]
  savedProjectIds: string[]
  followingIds: string[]
  createProject: (input: NewProjectInput) => Promise<Project>
  createUpdate: (body: string, projectId?: string) => Promise<void>
  createCollaboration: (input: NewCollaborationInput) => Promise<void>
  saveProject: (projectId: string) => Promise<void>
  followCreator: (creatorId: string) => Promise<void>
  updateProfile: (profile: Profile) => Promise<void>
  refresh: () => Promise<void>
}

const CommunityContext = createContext<CommunityContextValue | undefined>(undefined)
const LOCAL_KEY = 'creatoros-community-demo-state-v1'

type LocalState = {
  profiles: Profile[]
  projects: Project[]
  updates: FeedUpdate[]
  collaborations: CollaborationPost[]
  savedProjectIds: string[]
  followingIds: string[]
}

function defaultLocalState(): LocalState {
  return {
    profiles: demoProfiles,
    projects: demoProjects,
    updates: demoUpdates,
    collaborations: demoCollaborations,
    savedProjectIds: ['project-3'],
    followingIds: ['p2'],
  }
}

function loadLocalState(): LocalState {
  try {
    const saved = localStorage.getItem(LOCAL_KEY)
    return saved ? { ...defaultLocalState(), ...JSON.parse(saved) } : defaultLocalState()
  } catch {
    return defaultLocalState()
  }
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { demoMode, user, profile, updateLocalProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>(demoProfiles)
  const [projects, setProjects] = useState<Project[]>(demoProjects)
  const [updates, setUpdates] = useState<FeedUpdate[]>(demoUpdates)
  const [collaborations, setCollaborations] = useState<CollaborationPost[]>(demoCollaborations)
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([])
  const [followingIds, setFollowingIds] = useState<string[]>([])

  const persistLocal = useCallback((next: LocalState) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
  }, [])

  const hydrateLocal = useCallback(() => {
    const local = loadLocalState()
    setProfiles(local.profiles)
    setProjects(local.projects)
    setUpdates(local.updates)
    setCollaborations(local.collaborations)
    setSavedProjectIds(local.savedProjectIds)
    setFollowingIds(local.followingIds)
    setLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    if (demoMode || !supabase) {
      hydrateLocal()
      return
    }
    setLoading(true)
    const client = supabase
    const publicQueries = [
      client.from('profiles').select('*').order('created_at', { ascending: false }).limit(60),
      client.from('projects').select('*, owner:profiles!projects_owner_id_fkey(*)').eq('visibility', 'public').order('created_at', { ascending: false }).limit(60),
      client.from('updates').select('*, author:profiles!updates_author_id_fkey(*), project:projects(*)').order('created_at', { ascending: false }).limit(80),
      client.from('collaboration_posts').select('*, creator:profiles!collaboration_posts_creator_id_fkey(*), project:projects(*)').eq('status', 'open').order('created_at', { ascending: false }).limit(60),
    ] as const
    const accountQueries = user ? [
      client.from('saved_projects').select('project_id').eq('user_id', user.id),
      client.from('follows').select('following_id').eq('follower_id', user.id),
    ] : [Promise.resolve({ data: [] }), Promise.resolve({ data: [] })]
    const [profilesResult, projectsResult, updatesResult, collabsResult, savedResult, followsResult] = await Promise.all([...publicQueries, ...accountQueries])

    if (profilesResult.data) setProfiles((profilesResult.data as Profile[]).map(item => ({ ...item, followers_count: item.followers_count ?? 0, projects_count: item.projects_count ?? 0 })))
    if (projectsResult.data) setProjects(projectsResult.data as unknown as Project[])
    if (updatesResult.data) setUpdates((updatesResult.data as unknown as FeedUpdate[]).map(item => ({ ...item, likes_count: item.likes_count ?? 0, comments_count: item.comments_count ?? 0 })))
    if (collabsResult.data) setCollaborations(collabsResult.data as unknown as CollaborationPost[])
    if (savedResult.data) setSavedProjectIds((savedResult.data as Array<{ project_id: string }>).map(row => row.project_id))
    if (followsResult.data) setFollowingIds((followsResult.data as Array<{ following_id: string }>).map(row => row.following_id))
    setLoading(false)
  }, [demoMode, hydrateLocal, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!supabase || demoMode || !user) return
    const client = supabase
    const channel = client
      .channel('creatoros-community-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'updates' }, () => void refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'collaboration_posts' }, () => void refresh())
      .subscribe()
    return () => { void client.removeChannel(channel) }
  }, [demoMode, refresh, user])

  const createProject = useCallback(async (input: NewProjectInput) => {
    const ownerId = demoMode ? 'demo-user' : user?.id
    if (!ownerId) throw new Error('Sign in to create a project.')
    const created: Project = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      owner: profile ?? undefined,
      title: input.title,
      slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      type: input.type,
      stage: input.stage,
      summary: input.summary,
      goal: input.goal,
      progress: 5,
      visibility: 'public',
      collaboration_type: input.collaboration_type,
      location_mode: input.location_mode,
      location: input.location,
      target_date: null,
      roles_needed: input.roles_needed,
      created_at: new Date().toISOString(),
    }

    if (demoMode || !supabase) {
      const nextProjects = [created, ...projects]
      setProjects(nextProjects)
      persistLocal({ profiles, projects: nextProjects, updates, collaborations, savedProjectIds, followingIds })
      return created
    }

    const { data, error } = await supabase.from('projects').insert({
      owner_id: ownerId,
      title: created.title,
      slug: `${created.slug}-${Date.now().toString().slice(-5)}`,
      type: created.type,
      stage: created.stage,
      summary: created.summary,
      goal: created.goal,
      progress: created.progress,
      visibility: created.visibility,
      collaboration_type: created.collaboration_type,
      location_mode: created.location_mode,
      location: created.location,
      roles_needed: created.roles_needed,
    }).select().single()
    if (error) throw error
    await refresh()
    return data as Project
  }, [collaborations, demoMode, followingIds, persistLocal, profile, profiles, projects, refresh, savedProjectIds, updates, user?.id])

  const createUpdate = useCallback(async (body: string, projectId?: string) => {
    const authorId = demoMode ? 'demo-user' : user?.id
    if (!authorId) throw new Error('Sign in to post an update.')
    if (demoMode || !supabase) {
      const project = projects.find(item => item.id === projectId)
      const created: FeedUpdate = {
        id: crypto.randomUUID(), author_id: authorId, author: profile ?? undefined,
        project_id: projectId ?? null, project, body, created_at: new Date().toISOString(), likes_count: 0, comments_count: 0,
      }
      const nextUpdates = [created, ...updates]
      setUpdates(nextUpdates)
      persistLocal({ profiles, projects, updates: nextUpdates, collaborations, savedProjectIds, followingIds })
      return
    }
    const { error } = await supabase.from('updates').insert({ author_id: authorId, project_id: projectId || null, body })
    if (error) throw error
    await refresh()
  }, [collaborations, demoMode, followingIds, persistLocal, profile, profiles, projects, refresh, savedProjectIds, updates, user?.id])

  const createCollaboration = useCallback(async (input: NewCollaborationInput) => {
    const creatorId = demoMode ? 'demo-user' : user?.id
    if (!creatorId) throw new Error('Sign in to post an opportunity.')
    if (demoMode || !supabase) {
      const project = projects.find(item => item.id === input.project_id)
      const created: CollaborationPost = {
        id: crypto.randomUUID(), creator_id: creatorId, creator: profile ?? undefined,
        project_id: input.project_id ?? null, project, title: input.title, role_needed: input.role_needed,
        description: input.description, compensation: input.compensation, location_mode: input.location_mode,
        location: input.location, status: 'open', created_at: new Date().toISOString(),
      }
      const next = [created, ...collaborations]
      setCollaborations(next)
      persistLocal({ profiles, projects, updates, collaborations: next, savedProjectIds, followingIds })
      return
    }
    const { error } = await supabase.from('collaboration_posts').insert({
      creator_id: creatorId,
      project_id: input.project_id || null,
      title: input.title,
      role_needed: input.role_needed,
      description: input.description,
      compensation: input.compensation,
      location_mode: input.location_mode,
      location: input.location,
    })
    if (error) throw error
    await refresh()
  }, [collaborations, demoMode, followingIds, persistLocal, profile, profiles, projects, refresh, savedProjectIds, updates, user?.id])

  const saveProject = useCallback(async (projectId: string) => {
    const uid = demoMode ? 'demo-user' : user?.id
    if (!uid) throw new Error('Sign in to save projects.')
    const exists = savedProjectIds.includes(projectId)
    const next = exists ? savedProjectIds.filter(id => id !== projectId) : [...savedProjectIds, projectId]
    setSavedProjectIds(next)
    if (demoMode || !supabase) {
      persistLocal({ profiles, projects, updates, collaborations, savedProjectIds: next, followingIds })
      return
    }
    if (exists) await supabase.from('saved_projects').delete().eq('user_id', uid).eq('project_id', projectId)
    else await supabase.from('saved_projects').insert({ user_id: uid, project_id: projectId })
  }, [collaborations, demoMode, followingIds, persistLocal, profiles, projects, savedProjectIds, updates, user?.id])

  const followCreator = useCallback(async (creatorId: string) => {
    const uid = demoMode ? 'demo-user' : user?.id
    if (!uid || uid === creatorId) return
    const exists = followingIds.includes(creatorId)
    const next = exists ? followingIds.filter(id => id !== creatorId) : [...followingIds, creatorId]
    setFollowingIds(next)
    if (demoMode || !supabase) {
      persistLocal({ profiles, projects, updates, collaborations, savedProjectIds, followingIds: next })
      return
    }
    if (exists) await supabase.from('follows').delete().eq('follower_id', uid).eq('following_id', creatorId)
    else await supabase.from('follows').insert({ follower_id: uid, following_id: creatorId })
  }, [collaborations, demoMode, followingIds, persistLocal, profiles, projects, savedProjectIds, updates, user?.id])

  const updateProfile = useCallback(async (nextProfile: Profile) => {
    if (demoMode || !supabase) {
      updateLocalProfile(nextProfile)
      const nextProfiles = profiles.map(item => item.id === nextProfile.id ? nextProfile : item)
      setProfiles(nextProfiles)
      persistLocal({ profiles: nextProfiles, projects, updates, collaborations, savedProjectIds, followingIds })
      return
    }
    const { error } = await supabase.from('profiles').update({
      username: nextProfile.username,
      display_name: nextProfile.display_name,
      headline: nextProfile.headline,
      bio: nextProfile.bio,
      location: nextProfile.location,
      disciplines: nextProfile.disciplines,
      skills: nextProfile.skills,
      availability: nextProfile.availability,
      collaboration_preference: nextProfile.collaboration_preference,
      remote_preference: nextProfile.remote_preference,
      onboarding_complete: nextProfile.onboarding_complete,
    }).eq('id', nextProfile.id)
    if (error) throw error
  }, [collaborations, demoMode, followingIds, persistLocal, profiles, projects, savedProjectIds, updateLocalProfile, updates])

  const value = useMemo<CommunityContextValue>(() => ({
    loading, profiles, projects, updates, collaborations, events: demoEvents, savedProjectIds, followingIds,
    createProject, createUpdate, createCollaboration, saveProject, followCreator, updateProfile, refresh,
  }), [collaborations, createCollaboration, createProject, createUpdate, followingIds, followCreator, loading, profiles, projects, refresh, saveProject, savedProjectIds, updateProfile, updates])

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>
}

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('useCommunity must be used inside CommunityProvider')
  return context
}
