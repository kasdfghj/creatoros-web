import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import { Modal } from './Modal'

const projectTypes = ['Film', 'Music', 'Content', 'Podcast', 'Photography', 'Design', 'Game', 'Live Event', 'Other']

export function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const { createProject } = useCommunity()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const project = await createProject({
        title: String(form.get('title') || ''), type: String(form.get('type') || 'Other'), stage: 'Idea',
        summary: String(form.get('summary') || ''), goal: String(form.get('goal') || ''),
        collaboration_type: String(form.get('collaboration_type') || 'Collaboration') as 'Paid' | 'Collaboration' | 'Both',
        location_mode: String(form.get('location_mode') || 'Both') as 'Local' | 'Remote' | 'Both',
        location: String(form.get('location') || 'Remote'), roles_needed: String(form.get('roles') || '').split(',').map(item => item.trim()).filter(Boolean),
      })
      onClose()
      navigate(`/app/project/${project.id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create project.')
    } finally { setBusy(false) }
  }

  return <Modal title="Create a project" subtitle="Start with a clear outcome and invite collaborators when you are ready." onClose={onClose} footer={<><button className="button button-outline" onClick={onClose}>Cancel</button><button className="button" form="create-project-form" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</button></>}>
    <form id="create-project-form" className="form-stack" onSubmit={submit}>
      <label>Project name<input name="title" required placeholder="What are you building?" /></label>
      <div className="form-grid"><label>Project type<select name="type">{projectTypes.map(type => <option key={type}>{type}</option>)}</select></label><label>Work style<select name="location_mode"><option>Both</option><option>Local</option><option>Remote</option></select></label></div>
      <label>Summary<textarea name="summary" required placeholder="Explain the project in two or three sentences." /></label>
      <label>Current goal<input name="goal" required placeholder="What does success look like next?" /></label>
      <div className="form-grid"><label>Location<input name="location" placeholder="City, region, or Remote" /></label><label>Compensation<select name="collaboration_type"><option>Collaboration</option><option>Paid</option><option>Both</option></select></label></div>
      <label>Roles needed<input name="roles" placeholder="Editor, camera operator, designer" /></label>
      {error && <p className="form-error">{error}</p>}
    </form>
  </Modal>
}

export function CreateUpdateModal({ onClose }: { onClose: () => void }) {
  const { projects, createUpdate } = useCommunity()
  const { profile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ownProjects = projects.filter(project => project.owner_id === profile?.id)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    try { await createUpdate(String(form.get('body') || ''), String(form.get('project_id') || '') || undefined); onClose() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to post update.') }
    finally { setBusy(false) }
  }

  return <Modal title="Share a progress update" subtitle="Small, honest progress is more useful than polished self-promotion." onClose={onClose} footer={<><button className="button button-outline" onClick={onClose}>Cancel</button><button className="button" form="create-update-form" disabled={busy}>{busy ? 'Posting…' : 'Post update'}</button></>}>
    <form id="create-update-form" className="form-stack" onSubmit={submit}>
      <label>Project<select name="project_id"><option value="">General update</option>{ownProjects.map(project => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label>
      <label>What changed?<textarea name="body" required placeholder="Share progress, a blocker, a question, or a useful lesson." /></label>
      {error && <p className="form-error">{error}</p>}
    </form>
  </Modal>
}

export function CreateCollaborationModal({ onClose }: { onClose: () => void }) {
  const { projects, createCollaboration } = useCommunity()
  const { profile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ownProjects = projects.filter(project => project.owner_id === profile?.id)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      await createCollaboration({
        project_id: String(form.get('project_id') || '') || undefined, title: String(form.get('title') || ''),
        role_needed: String(form.get('role_needed') || ''), description: String(form.get('description') || ''),
        compensation: String(form.get('compensation') || 'Collaboration') as 'Paid' | 'Collaboration' | 'Negotiable',
        location_mode: String(form.get('location_mode') || 'Both') as 'Local' | 'Remote' | 'Both', location: String(form.get('location') || 'Remote'),
      })
      onClose()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to post opportunity.') }
    finally { setBusy(false) }
  }

  return <Modal title="Find a collaborator" subtitle="Be specific about the work, compensation, and expected commitment." onClose={onClose} footer={<><button className="button button-outline" onClick={onClose}>Cancel</button><button className="button" form="create-collab-form" disabled={busy}>{busy ? 'Posting…' : 'Post opportunity'}</button></>}>
    <form id="create-collab-form" className="form-stack" onSubmit={submit}>
      <label>Project<select name="project_id"><option value="">Independent opportunity</option>{ownProjects.map(project => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label>
      <label>Listing title<input name="title" required placeholder="Cinematographer for a two-day short film" /></label>
      <div className="form-grid"><label>Role needed<input name="role_needed" required placeholder="Cinematographer" /></label><label>Compensation<select name="compensation"><option>Collaboration</option><option>Paid</option><option>Negotiable</option></select></label></div>
      <label>Details<textarea name="description" required placeholder="Scope, expectations, schedule, and the kind of collaborator who would fit." /></label>
      <div className="form-grid"><label>Work style<select name="location_mode"><option>Both</option><option>Local</option><option>Remote</option></select></label><label>Location<input name="location" placeholder="Lodi, California or Remote" /></label></div>
      {error && <p className="form-error">{error}</p>}
    </form>
  </Modal>
}
