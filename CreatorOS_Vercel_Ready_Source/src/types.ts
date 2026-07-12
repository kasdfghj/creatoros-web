export type CreatorDiscipline =
  | 'Film & Video'
  | 'Music & Audio'
  | 'Content Creation'
  | 'Photography'
  | 'Design & Art'
  | 'Writing & Podcasting'
  | 'Games & Software'
  | 'Creative Business'

export type Profile = {
  id: string
  username: string
  display_name: string
  avatar_url?: string | null
  headline: string
  bio: string
  location: string
  disciplines: string[]
  skills: string[]
  availability: 'Available' | 'Limited' | 'Not available'
  collaboration_preference: 'Paid' | 'Collaboration' | 'Both'
  remote_preference: 'Local' | 'Remote' | 'Both'
  links?: Record<string, string>
  onboarding_complete?: boolean
  followers_count?: number
  projects_count?: number
}

export type Project = {
  id: string
  owner_id: string
  owner?: Profile
  title: string
  slug: string
  type: string
  stage: string
  summary: string
  goal: string
  progress: number
  cover_url?: string | null
  visibility: 'public' | 'private'
  collaboration_type: 'Paid' | 'Collaboration' | 'Both'
  location_mode: 'Local' | 'Remote' | 'Both'
  location: string
  target_date?: string | null
  roles_needed: string[]
  created_at: string
}

export type FeedUpdate = {
  id: string
  author_id: string
  author?: Profile
  project_id?: string | null
  project?: Project | null
  body: string
  media_url?: string | null
  created_at: string
  likes_count: number
  comments_count: number
}

export type CollaborationPost = {
  id: string
  creator_id: string
  creator?: Profile
  project_id?: string | null
  project?: Project | null
  title: string
  role_needed: string
  description: string
  compensation: 'Paid' | 'Collaboration' | 'Negotiable'
  location_mode: 'Local' | 'Remote' | 'Both'
  location: string
  status: 'open' | 'filled' | 'closed'
  created_at: string
}

export type CommunityEvent = {
  id: string
  title: string
  description: string
  start_at: string
  location: string
  is_virtual: boolean
  host_name: string
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  created_at: string
  read: boolean
}
