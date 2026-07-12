import type { CollaborationPost, CommunityEvent, FeedUpdate, Profile, Project } from '../types'

export const demoUser: Profile = {
  id: 'demo-user',
  username: 'kalelcreates',
  display_name: 'Kalel Gomez',
  headline: 'Filmmaker, musician, and creator building ambitious independent work.',
  bio: 'California-based multi-disciplinary creator focused on film, music, games, and community-driven projects.',
  location: 'Lodi, California',
  disciplines: ['Film & Video', 'Music & Audio', 'Games & Software'],
  skills: ['Directing', 'Writing', 'Editing', 'Songwriting', 'Creative Direction'],
  availability: 'Available',
  collaboration_preference: 'Both',
  remote_preference: 'Both',
  links: { website: 'https://example.com' },
  onboarding_complete: true,
  followers_count: 128,
  projects_count: 4,
}

export const demoProfiles: Profile[] = [
  demoUser,
  {
    id: 'p2', username: 'mayatorres', display_name: 'Maya Torres', avatar_url: null,
    headline: 'Documentary camera operator and visual storyteller.',
    bio: 'Camera operator working across short films, live sessions, and branded stories.',
    location: 'Lodi, California', disciplines: ['Film & Video', 'Photography'],
    skills: ['Camera Operation', 'Lighting', 'Color'], availability: 'Available',
    collaboration_preference: 'Both', remote_preference: 'Local', followers_count: 342, projects_count: 12,
  },
  {
    id: 'p3', username: 'devinmixes', display_name: 'Devin Brooks', avatar_url: null,
    headline: 'Audio engineer for independent artists and filmmakers.',
    bio: 'Recording, cleanup, sound design, and mixes with a practical indie workflow.',
    location: 'Stockton, California', disciplines: ['Music & Audio', 'Film & Video'],
    skills: ['Mixing', 'Sound Design', 'Location Audio'], availability: 'Limited',
    collaboration_preference: 'Paid', remote_preference: 'Both', followers_count: 211, projects_count: 9,
  },
  {
    id: 'p4', username: 'arikim', display_name: 'Ari Kim', avatar_url: null,
    headline: 'Editor and motion designer making stories move.',
    bio: 'Remote editor for creator-led documentaries, music campaigns, and short-form series.',
    location: 'Remote', disciplines: ['Film & Video', 'Design & Art', 'Content Creation'],
    skills: ['Editing', 'Motion Graphics', 'Short-form'], availability: 'Available',
    collaboration_preference: 'Both', remote_preference: 'Remote', followers_count: 484, projects_count: 18,
  },
  {
    id: 'p5', username: 'sofiawrites', display_name: 'Sofia Reyes', avatar_url: null,
    headline: 'Writer, production assistant, and project organizer.',
    bio: 'I help small teams turn promising ideas into scheduled, shootable projects.',
    location: 'Galt, California', disciplines: ['Writing & Podcasting', 'Film & Video'],
    skills: ['Writing', 'Production', 'Scheduling'], availability: 'Available',
    collaboration_preference: 'Both', remote_preference: 'Both', followers_count: 176, projects_count: 7,
  },
  {
    id: 'p6', username: 'joshuabuilds', display_name: 'Joshua Lane', avatar_url: null,
    headline: 'Indie game developer and pixel artist.',
    bio: 'Building small games with strong worlds, tactile interfaces, and expressive pixel art.',
    location: 'Sacramento, California', disciplines: ['Games & Software', 'Design & Art'],
    skills: ['Godot', 'TypeScript', 'Pixel Art'], availability: 'Limited',
    collaboration_preference: 'Collaboration', remote_preference: 'Remote', followers_count: 298, projects_count: 11,
  },
]

export const demoProjects: Project[] = [
  {
    id: 'project-1', owner_id: 'demo-user', owner: demoUser, title: 'Nothing Much', slug: 'nothing-much',
    type: 'Film', stage: 'Development', summary: 'A character-driven California coming-of-age film about memory, love, and loss.',
    goal: 'Finish the production-ready screenplay and assemble the founding crew.', progress: 62,
    visibility: 'public', collaboration_type: 'Collaboration', location_mode: 'Local', location: 'Lodi, California',
    target_date: '2026-10-01', roles_needed: ['Cinematographer', 'Sound Recordist', 'Production Assistant'], created_at: '2026-07-10T18:30:00Z',
  },
  {
    id: 'project-2', owner_id: 'p2', owner: demoProfiles[1], title: 'Valley After Dark', slug: 'valley-after-dark',
    type: 'Documentary Series', stage: 'Pre-production', summary: 'Short documentaries about independent artists creating in California’s Central Valley.',
    goal: 'Film three creator profiles for the pilot collection.', progress: 38, visibility: 'public',
    collaboration_type: 'Both', location_mode: 'Local', location: 'Central Valley, California', target_date: '2026-09-15',
    roles_needed: ['Editor', 'Production Sound'], created_at: '2026-07-09T14:15:00Z',
  },
  {
    id: 'project-3', owner_id: 'p3', owner: demoProfiles[2], title: 'Room Tone Sessions', slug: 'room-tone-sessions',
    type: 'Music Series', stage: 'Production', summary: 'Live one-room performances spotlighting emerging independent musicians.',
    goal: 'Release the first six performance videos.', progress: 71, visibility: 'public', collaboration_type: 'Paid',
    location_mode: 'Both', location: 'Stockton / Remote', target_date: '2026-08-30', roles_needed: ['Camera Operator', 'Thumbnail Designer'], created_at: '2026-07-08T17:45:00Z',
  },
  {
    id: 'project-4', owner_id: 'p6', owner: demoProfiles[5], title: 'Case Cabinet', slug: 'case-cabinet',
    type: 'Game', stage: 'Prototype', summary: 'A detective RPG where the investigation keeps moving whether the player succeeds or fails.',
    goal: 'Complete the playable investigation loop and recruit one environment artist.', progress: 46, visibility: 'public',
    collaboration_type: 'Collaboration', location_mode: 'Remote', location: 'Remote', target_date: '2026-11-01',
    roles_needed: ['Environment Artist', 'Narrative Designer'], created_at: '2026-07-07T10:20:00Z',
  },
]

export const demoUpdates: FeedUpdate[] = [
  {
    id: 'u1', author_id: 'p2', author: demoProfiles[1], project_id: 'project-2', project: demoProjects[1],
    body: 'Finished the first location scout for Valley After Dark. The old warehouse light is better than expected, but we still need a sound plan.',
    created_at: '2026-07-11T22:20:00Z', likes_count: 24, comments_count: 6,
  },
  {
    id: 'u2', author_id: 'demo-user', author: demoUser, project_id: 'project-1', project: demoProjects[0],
    body: 'The latest screenplay structure is locked. Next step is turning it into a shootable production plan without losing the intimate feeling.',
    created_at: '2026-07-11T19:05:00Z', likes_count: 31, comments_count: 9,
  },
  {
    id: 'u3', author_id: 'p6', author: demoProfiles[5], project_id: 'project-4', project: demoProjects[3],
    body: 'The first-person room inspection loop is playable. Looking for feedback on how evidence should be surfaced without making the room feel like a hidden-object game.',
    created_at: '2026-07-11T16:40:00Z', likes_count: 18, comments_count: 11,
  },
]

export const demoCollaborations: CollaborationPost[] = [
  {
    id: 'c1', creator_id: 'demo-user', creator: demoUser, project_id: 'project-1', project: demoProjects[0],
    title: 'Cinematographer for intimate coming-of-age short', role_needed: 'Cinematographer',
    description: 'Looking for someone comfortable with natural light, symmetrical framing, and a small collaborative crew.',
    compensation: 'Collaboration', location_mode: 'Local', location: 'Lodi, California', status: 'open', created_at: '2026-07-11T18:00:00Z',
  },
  {
    id: 'c2', creator_id: 'p3', creator: demoProfiles[2], project_id: 'project-3', project: demoProjects[2],
    title: 'Camera operator for live performance series', role_needed: 'Camera Operator',
    description: 'Paid half-day sessions. Need clean handheld work and comfort shooting musicians in a small room.',
    compensation: 'Paid', location_mode: 'Local', location: 'Stockton, California', status: 'open', created_at: '2026-07-10T20:00:00Z',
  },
  {
    id: 'c3', creator_id: 'p6', creator: demoProfiles[5], project_id: 'project-4', project: demoProjects[3],
    title: 'Pixel environment artist for detective game', role_needed: 'Environment Artist',
    description: 'Remote collaboration on rooms, props, and clue details for a 24-bit-inspired visual direction.',
    compensation: 'Negotiable', location_mode: 'Remote', location: 'Remote', status: 'open', created_at: '2026-07-10T13:10:00Z',
  },
]

export const demoEvents: CommunityEvent[] = [
  { id: 'e1', title: 'CreatorOS Founding Creator Call', description: 'Meet the community, introduce your work, and help shape the first public release.', start_at: '2026-07-17T18:30:00-07:00', location: 'CreatorOS Live Room', is_virtual: true, host_name: 'CreatorOS' },
  { id: 'e2', title: 'Feedback Friday: Film & Video', description: 'Bring one scene, cut, storyboard, or production question for focused feedback.', start_at: '2026-07-24T17:00:00-07:00', location: 'Online', is_virtual: true, host_name: 'Maya Torres' },
  { id: 'e3', title: 'Central Valley Creator Meetup', description: 'Informal meetup for filmmakers, musicians, photographers, and game creators.', start_at: '2026-08-01T14:00:00-07:00', location: 'Lodi, California', is_virtual: false, host_name: 'CreatorOS Community' },
]
