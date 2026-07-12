import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import type { Profile } from '../types'

const disciplines = ['Film & Video','Music & Audio','Content Creation','Photography','Design & Art','Writing & Podcasting','Games & Software','Creative Business']
const commonSkills = ['Directing','Writing','Editing','Camera','Photography','Design','Production','Songwriting','Audio','Marketing','Development','Animation']

export function OnboardingPage() {
  const { authenticated, profile, user, demoMode } = useAuth()
  const { updateProfile, createProject } = useCommunity()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Profile>(() => profile || {
    id: demoMode ? 'demo-user' : user?.id || '', username: '', display_name: '', headline: '', bio: '', location: '', disciplines: [], skills: [],
    availability: 'Available', collaboration_preference: 'Both', remote_preference: 'Both', onboarding_complete: false,
  })
  const [projectTitle, setProjectTitle] = useState('')
  const [projectType, setProjectType] = useState('Film')
  const totalSteps = 4

  const canContinue = useMemo(() => {
    if (step === 1) return draft.display_name.trim() && draft.username.trim() && draft.location.trim()
    if (step === 2) return draft.disciplines.length > 0 && draft.skills.length > 0
    if (step === 3) return draft.headline.trim() && draft.bio.trim()
    return true
  }, [draft, step])

  if (!authenticated) return <Navigate to="/login" replace />

  function toggleList(key: 'disciplines' | 'skills', value: string) {
    setDraft(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(item => item !== value) : [...current[key], value] }))
  }

  async function finish() {
    setBusy(true); setError('')
    try {
      await updateProfile({ ...draft, username: draft.username.toLowerCase().replace(/[^a-z0-9_]/g, ''), onboarding_complete: true })
      if (projectTitle.trim()) {
        await createProject({ title: projectTitle.trim(), type: projectType, stage: 'Idea', summary: `A new ${projectType.toLowerCase()} project by ${draft.display_name}.`, goal: 'Define the first milestone and assemble what is needed to begin.', collaboration_type: draft.collaboration_preference, location_mode: draft.remote_preference, location: draft.location, roles_needed: [] })
      }
      navigate('/app', { replace: true })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to complete onboarding.') }
    finally { setBusy(false) }
  }

  return <div className="onboarding-page"><header><Brand /><span>Step {step} of {totalSteps}</span></header><main><div className="onboarding-progress"><span style={{ width: `${step/totalSteps*100}%` }} /></div>
    {step === 1 && <section className="onboarding-card"><span className="eyebrow"><Sparkles size={15} /> WELCOME TO CREATOROS</span><h1>Build your creator identity.</h1><p>This is how collaborators will understand who you are and where you work.</p><div className="form-stack"><div className="form-grid"><label>Display name<input value={draft.display_name} onChange={e=>setDraft({...draft,display_name:e.target.value})} placeholder="Your name or creator name" /></label><label>Username<input value={draft.username} onChange={e=>setDraft({...draft,username:e.target.value})} placeholder="creatorname" /></label></div><label>Location<input value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="City, region, or Remote" /></label></div></section>}
    {step === 2 && <section className="onboarding-card"><span className="eyebrow">YOUR CREATIVE WORK</span><h1>What do you create?</h1><p>Select every discipline and skill that accurately represents your work.</p><h3>Disciplines</h3><div className="choice-grid">{disciplines.map(item=><button className={draft.disciplines.includes(item)?'selected':''} onClick={()=>toggleList('disciplines',item)} key={item}>{draft.disciplines.includes(item)&&<Check size={16}/>} {item}</button>)}</div><h3>Skills</h3><div className="choice-grid compact">{commonSkills.map(item=><button className={draft.skills.includes(item)?'selected':''} onClick={()=>toggleList('skills',item)} key={item}>{draft.skills.includes(item)&&<Check size={16}/>} {item}</button>)}</div></section>}
    {step === 3 && <section className="onboarding-card"><span className="eyebrow">HOW YOU COLLABORATE</span><h1>Set clear expectations.</h1><p>Good collaborations begin with honest availability and a useful introduction.</p><div className="form-stack"><label>Professional headline<input value={draft.headline} onChange={e=>setDraft({...draft,headline:e.target.value})} placeholder="Filmmaker and editor building character-driven stories" /></label><label>About you<textarea value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})} placeholder="Describe your work, perspective, and the kinds of projects you want to build." /></label><div className="form-grid"><label>Availability<select value={draft.availability} onChange={e=>setDraft({...draft,availability:e.target.value as Profile['availability']})}><option>Available</option><option>Limited</option><option>Not available</option></select></label><label>Compensation preference<select value={draft.collaboration_preference} onChange={e=>setDraft({...draft,collaboration_preference:e.target.value as Profile['collaboration_preference']})}><option>Both</option><option>Paid</option><option>Collaboration</option></select></label></div><label>Work preference<select value={draft.remote_preference} onChange={e=>setDraft({...draft,remote_preference:e.target.value as Profile['remote_preference']})}><option>Both</option><option>Local</option><option>Remote</option></select></label></div></section>}
    {step === 4 && <section className="onboarding-card"><span className="eyebrow">FIRST PROJECT</span><h1>Give CreatorOS something to organize.</h1><p>You can create a first project now or enter the community and do it later.</p><div className="form-stack"><label>Project name <span className="optional">Optional</span><input value={projectTitle} onChange={e=>setProjectTitle(e.target.value)} placeholder="The project you are actively building" /></label><label>Project type<select value={projectType} onChange={e=>setProjectType(e.target.value)}><option>Film</option><option>Music</option><option>Content</option><option>Podcast</option><option>Photography</option><option>Design</option><option>Game</option><option>Other</option></select></label><div className="onboarding-summary"><strong>Your CreatorOS starting setup</strong><span>{draft.disciplines.join(' · ')}</span><span>{draft.availability} for {draft.collaboration_preference.toLowerCase()} work</span><span>{draft.remote_preference} collaboration</span></div></div></section>}
    {error && <p className="form-error onboarding-error">{error}</p>}
    <footer className="onboarding-footer"><button className="button button-outline" disabled={step===1||busy} onClick={()=>setStep(value=>value-1)}><ArrowLeft size={17}/> Back</button>{step<totalSteps?<button className="button" disabled={!canContinue||busy} onClick={()=>setStep(value=>value+1)}>Continue <ArrowRight size={17}/></button>:<button className="button" disabled={busy} onClick={finish}>{busy?'Setting up CreatorOS…':'Enter CreatorOS'} <ArrowRight size={17}/></button>}</footer>
  </main></div>
}
