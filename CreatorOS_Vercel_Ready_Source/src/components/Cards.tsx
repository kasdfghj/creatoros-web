import { Bookmark, BriefcaseBusiness, CalendarDays, MapPin, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { Avatar } from './Avatar'
import type { CollaborationPost, FeedUpdate, Profile, Project } from '../types'

export function CreatorCard({ profile, following, onFollow }: { profile: Profile; following?: boolean; onFollow?: () => void }) {
  return (
    <article className="creator-card card">
      <div className="creator-card-top">
        <Avatar profile={profile} size="lg" />
        <button className={following ? 'button button-soft small' : 'button button-outline small'} onClick={onFollow}>{following ? 'Following' : 'Follow'}</button>
      </div>
      <h3>{profile.display_name}</h3>
      <p className="creator-handle">@{profile.username}</p>
      <p className="creator-headline">{profile.headline}</p>
      <div className="meta-line"><MapPin size={14} /> {profile.location}</div>
      <div className="tag-row">{profile.disciplines.slice(0, 3).map(item => <span className="tag" key={item}>{item}</span>)}</div>
      <footer className="creator-card-footer"><span>{profile.followers_count ?? 0} followers</span><Link to={`/app/creator/${profile.username}`}>View profile</Link></footer>
    </article>
  )
}

export function ProjectCard({ project, saved, onSave }: { project: Project; saved?: boolean; onSave?: () => void }) {
  return (
    <article className="project-card card">
      <div className="project-cover" style={project.cover_url ? { backgroundImage: `url(${project.cover_url})` } : undefined}>
        <span className="project-type">{project.type}</span>
        <button className={`save-button ${saved ? 'active' : ''}`} onClick={onSave} aria-label={saved ? 'Remove saved project' : 'Save project'}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="project-card-body">
        <div className="project-owner"><Avatar profile={project.owner} size="sm" /><span>{project.owner?.display_name || 'CreatorOS member'}</span></div>
        <Link className="project-title-link" to={`/app/project/${project.id}`}><h3>{project.title}</h3></Link>
        <p>{project.summary}</p>
        <div className="progress-label"><span>{project.stage}</span><strong>{project.progress}%</strong></div>
        <div className="progress"><span style={{ width: `${project.progress}%` }} /></div>
        <div className="tag-row">{project.roles_needed.slice(0, 2).map(role => <span className="tag tag-accent" key={role}>Needs {role}</span>)}</div>
        <footer><span><MapPin size={14} /> {project.location_mode}</span><span><Users size={14} /> {project.collaboration_type}</span></footer>
      </div>
    </article>
  )
}

export function FeedCard({ update }: { update: FeedUpdate }) {
  return (
    <article className="feed-card card">
      <header>
        <Avatar profile={update.author} />
        <div><strong>{update.author?.display_name || 'CreatorOS member'}</strong><span>@{update.author?.username || 'creator'} · {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}</span></div>
      </header>
      {update.project && <Link className="feed-project-link" to={`/app/project/${update.project.id}`}>Working on <strong>{update.project.title}</strong></Link>}
      <p className="feed-body">{update.body}</p>
      {update.media_url && <img className="feed-media" src={update.media_url} alt="Project update" />}
      <footer><button>♡ {update.likes_count}</button><button>◯ {update.comments_count} comments</button><button>↗ Share</button></footer>
    </article>
  )
}

export function CollaborationCard({ post, onApply }: { post: CollaborationPost; onApply?: () => void }) {
  return (
    <article className="collaboration-card card">
      <div className="collaboration-top"><span className={`status-pill ${post.compensation.toLowerCase()}`}>{post.compensation}</span><span>{post.location_mode}</span></div>
      <h3>{post.title}</h3>
      <p>{post.description}</p>
      <div className="collaboration-detail"><BriefcaseBusiness size={16} /><span><strong>{post.role_needed}</strong>{post.project ? ` · ${post.project.title}` : ''}</span></div>
      <div className="collaboration-detail"><MapPin size={16} /><span>{post.location}</span></div>
      <div className="collaboration-detail"><CalendarDays size={16} /><span>Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span></div>
      <footer><div className="project-owner"><Avatar profile={post.creator} size="sm" /><span>{post.creator?.display_name || 'CreatorOS member'}</span></div><button className="button small" onClick={onApply}>Apply</button></footer>
    </article>
  )
}
