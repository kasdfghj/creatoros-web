import {
  Bell, BriefcaseBusiness, CalendarDays, ChevronDown, Compass, CreditCard, FolderKanban, Home, LogOut,
  Menu, MessageSquareText, PlugZap, Plus, Search, Send, Settings, ShieldCheck, Sparkles, UserRound, Users, X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { Avatar } from './Avatar'
import { Brand } from './Brand'
import { CreateProjectModal, CreateUpdateModal, CreateCollaborationModal } from './CreateModals'

const navigation = [
  { group: 'HOME', items: [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/feed', label: 'Community Feed', icon: MessageSquareText },
    { to: '/app/notifications', label: 'Notifications', icon: Bell },
  ] },
  { group: 'CREATE', items: [
    { to: '/app/projects', label: 'My Projects', icon: FolderKanban },
    { to: '/app/publishing', label: 'Publishing Studio', icon: Send },
    { to: '/app/events', label: 'Events', icon: CalendarDays },
  ] },
  { group: 'COMMUNITY', items: [
    { to: '/app/discover', label: 'Discover Creators', icon: Compass },
    { to: '/app/projects/explore', label: 'Browse Projects', icon: Sparkles },
    { to: '/app/collaborate', label: 'Collaboration Board', icon: Users },
  ] },
  { group: 'COMMUNICATE', items: [
    { to: '/app/messages', label: 'Messages', icon: MessageSquareText },
  ] },
  { group: 'ACCOUNT', items: [
    { to: '/app/profile', label: 'My Profile', icon: UserRound },
    { to: '/app/integrations', label: 'Connections', icon: PlugZap },
    { to: '/app/billing', label: 'Billing', icon: CreditCard },
    { to: '/app/security', label: 'Security & Data', icon: ShieldCheck },
    { to: '/app/settings', label: 'Settings', icon: Settings },
  ] },
]

type ModalName = 'project' | 'update' | 'collaboration' | null

export function AppShell() {
  const { profile, demoMode, signOut } = useAuth()
  const { projects } = useCommunity()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [modal, setModal] = useState<ModalName>(null)
  const [search, setSearch] = useState('')

  const ownedProjects = projects.filter(project => project.owner_id === profile?.id)
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    const pages = navigation.flatMap(group => group.items).filter(item => item.label.toLowerCase().includes(query)).map(item => ({ type: 'Page', label: item.label, to: item.to }))
    const projectResults = projects.filter(project => `${project.title} ${project.summary}`.toLowerCase().includes(query)).map(project => ({ type: 'Project', label: project.title, to: `/app/project/${project.id}` }))
    return [...pages, ...projectResults].slice(0, 8)
  }, [projects, search])

  async function logout() {
    await signOut()
    navigate('/')
  }

  function openModal(name: Exclude<ModalName, null>) {
    setCreateOpen(false)
    setModal(name)
  }

  return (
    <div className="app-layout">
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand-row"><Brand /><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
        <nav className="sidebar-nav">
          {navigation.map(group => (
            <div className="nav-group" key={group.group}>
              <span className="nav-heading">{group.group}</span>
              {group.items.map(item => {
                const Icon = item.icon
                return <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{item.label}</span></NavLink>
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="sidebar-section-title"><span>YOUR PROJECTS</span><button onClick={() => openModal('project')}><Plus size={15} /></button></div>
          {ownedProjects.slice(0, 3).map(project => <Link to={`/app/project/${project.id}`} key={project.id}><span className="project-dot" />{project.title}</Link>)}
          {!ownedProjects.length && <button className="empty-project-button" onClick={() => openModal('project')}>Create your first project</button>}
        </div>
        <div className="sidebar-user">
          <Avatar profile={profile} />
          <div><strong>{profile?.display_name || 'Creator'}</strong><span>{demoMode ? 'Demo workspace' : `@${profile?.username || 'creator'}`}</span></div>
          <button className="icon-button dark" onClick={logout} title="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <main className="app-main">
        <header className="app-topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <button className="global-search" onClick={() => setSearchOpen(true)}><Search size={18} /><span>Search creators, projects, opportunities...</span><kbd>⌘ K</kbd></button>
          <div className="topbar-actions">
            {demoMode && <span className="demo-pill">Demo mode</span>}
            <div className="create-menu-wrap">
              <button className="button" onClick={() => setCreateOpen(value => !value)}><Plus size={17} /> Create <ChevronDown size={15} /></button>
              {createOpen && <div className="create-menu">
                <button onClick={() => openModal('project')}><FolderKanban size={17} /><span><strong>New project</strong><small>Start and share creative work</small></span></button>
                <button onClick={() => openModal('update')}><MessageSquareText size={17} /><span><strong>Post update</strong><small>Share progress with the community</small></span></button>
                <button onClick={() => openModal('collaboration')}><BriefcaseBusiness size={17} /><span><strong>Find a collaborator</strong><small>Post a role or opportunity</small></span></button>
              </div>}
            </div>
            <NavLink className={({ isActive }) => `icon-button topbar-icon ${isActive ? 'active' : ''}`} to="/app/notifications"><Bell size={19} /><span className="notification-dot" /></NavLink>
            <Link to="/app/profile"><Avatar profile={profile} /></Link>
          </div>
        </header>
        <div className="app-route" key={location.pathname}><Outlet /></div>
      </main>

      {searchOpen && <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false) }}>
        <div className="command-panel">
          <div className="command-input"><Search size={20} /><input autoFocus value={search} onChange={event => setSearch(event.target.value)} placeholder="Search CreatorOS" /><button onClick={() => setSearchOpen(false)}><X size={17} /></button></div>
          <div className="command-results">
            {!search.trim() && <div className="command-hint">Search pages, creators, projects, and opportunities.</div>}
            {searchResults.map(result => <Link key={`${result.type}-${result.to}`} to={result.to} onClick={() => { setSearchOpen(false); setSearch('') }}><span>{result.type}</span><strong>{result.label}</strong></Link>)}
            {search.trim() && !searchResults.length && <div className="command-hint">No results found.</div>}
          </div>
        </div>
      </div>}

      {modal === 'project' && <CreateProjectModal onClose={() => setModal(null)} />}
      {modal === 'update' && <CreateUpdateModal onClose={() => setModal(null)} />}
      {modal === 'collaboration' && <CreateCollaborationModal onClose={() => setModal(null)} />}
    </div>
  )
}
