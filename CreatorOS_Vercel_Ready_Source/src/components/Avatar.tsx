import type { Profile } from '../types'

export function Avatar({ profile, size = 'md' }: { profile?: Profile | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = profile?.display_name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'CO'
  return profile?.avatar_url ? (
    <img className={`avatar avatar-${size}`} src={profile.avatar_url} alt={profile.display_name} />
  ) : (
    <span className={`avatar avatar-${size}`} aria-label={profile?.display_name || 'CreatorOS user'}>{initials}</span>
  )
}
