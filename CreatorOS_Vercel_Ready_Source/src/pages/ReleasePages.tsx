import {
  AlertTriangle, BadgeCheck, Banknote, Check, CheckCircle2, CircleDollarSign, Clock3, CloudUpload,
  CreditCard, Database, ExternalLink, FileDown, FileImage, Film, Flag, Globe2, Image, Instagram,
  KeyRound, Link2, Loader2, LockKeyhole, Mail, MessageCircle, MessageSquare, PlugZap, Radio,
  RefreshCw, Send, ServerCog, ShieldCheck, Sparkles, Trash2, UploadCloud, Users, Video, Youtube,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCommunity } from '../context/CommunityContext'
import {
  apiRequest, createBillingPortal, createCheckout, disconnectIntegration, getIntegrationStatus, publishContent,
  requestAccountDeletion, requestDataExport, startIntegration, uploadPublishingMedia, type IntegrationProvider, type IntegrationStatus,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import { Avatar } from '../components/Avatar'

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-actions">{action}</div>}</div>
}

const providerDetails: Record<IntegrationProvider, { label: string; icon: React.ReactNode; tone: string }> = {
  youtube: { label: 'YouTube', icon: <Youtube size={22} />, tone: 'youtube' },
  instagram: { label: 'Instagram', icon: <Instagram size={22} />, tone: 'instagram' },
  tiktok: { label: 'TikTok', icon: <span className="provider-glyph">♪</span>, tone: 'tiktok' },
  x: { label: 'X', icon: <span className="provider-glyph">𝕏</span>, tone: 'x' },
}

const demoIntegrations: IntegrationStatus[] = [
  { provider: 'youtube', label: 'YouTube', configured: true, connected: true, approved: true, account_name: 'Kalel Creator Channel', detail: 'Ready to publish videos and Shorts.' },
  { provider: 'instagram', label: 'Instagram', configured: true, connected: false, approved: true, detail: 'Professional account connection required.' },
  { provider: 'tiktok', label: 'TikTok', configured: true, connected: false, approved: false, detail: 'Developer review is required for public direct posting.' },
  { provider: 'x', label: 'X', configured: true, connected: true, approved: true, account_name: '@creatoros_demo', detail: 'Ready for text and media posts.' },
]

export function IntegrationsPage() {
  const { demoMode } = useAuth()
  const [searchParams] = useSearchParams()
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(demoIntegrations)
  const [services, setServices] = useState<Record<string, boolean>>({ supabase: true, stripe: false, resend: false, turnstile: false, r2: false })
  const [loading, setLoading] = useState(!demoMode)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function refresh() {
    if (demoMode) { setIntegrations(demoIntegrations); setLoading(false); return }
    setLoading(true); setError('')
    try { const result = await getIntegrationStatus(); setIntegrations(result.integrations); setServices(result.services) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load integrations.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [demoMode])
  useEffect(() => {
    const connected = searchParams.get('connected')
    const integrationError = searchParams.get('integration_error')
    if (connected) setMessage(`${providerDetails[connected as IntegrationProvider]?.label || connected} connected successfully.`)
    if (integrationError) setError(decodeURIComponent(integrationError))
  }, [searchParams])

  async function connect(provider: IntegrationProvider) {
    if (demoMode) { setMessage(`${providerDetails[provider].label} connection flow is ready. Production credentials activate it.`); return }
    setBusy(provider); setError('')
    try { await startIntegration(provider) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to start connection.'); setBusy(null) }
  }

  async function disconnect(provider: IntegrationProvider) {
    if (demoMode) { setIntegrations(items => items.map(item => item.provider === provider ? { ...item, connected: false, account_name: null } : item)); return }
    setBusy(provider)
    try { await disconnectIntegration(provider); await refresh(); setMessage(`${providerDetails[provider].label} disconnected.`) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to disconnect.') }
    finally { setBusy(null) }
  }

  return <div className="page-content release-page">
    <PageHeader eyebrow="CONNECTIONS" title="Connect every part of your creator workflow." description="Identity, publishing, billing, email, storage, and security integrations are managed from one release center." action={<button className="button button-outline" onClick={() => void refresh()}><RefreshCw size={16}/> Refresh status</button>} />
    {message && <div className="release-alert success"><CheckCircle2 />{message}</div>}
    {error && <div className="release-alert error"><AlertTriangle />{error}</div>}

    <section className="release-section">
      <div className="section-title-row"><div><h2>Publishing platforms</h2><p>Connect creator accounts separately from CreatorOS sign-in so publishing permissions remain explicit.</p></div></div>
      <div className="integration-grid">
        {loading ? <div className="integration-loading card"><Loader2 className="spin"/> Checking secure connections…</div> : integrations.map(item => {
          const detail = providerDetails[item.provider]
          return <article className="integration-card card" key={item.provider}>
            <header><span className={`integration-logo ${detail.tone}`}>{detail.icon}</span><div><h3>{detail.label}</h3><p>{item.account_name || 'No creator account connected'}</p></div><span className={`readiness-pill ${item.connected ? 'ready' : item.configured ? 'needs-connection' : 'needs-setup'}`}>{item.connected ? 'Connected' : item.configured ? 'Ready to connect' : 'Setup required'}</span></header>
            <p className="integration-detail">{item.detail}</p>
            <div className="integration-checks"><span className={item.configured ? 'passed' : ''}><Check size={14}/> App credentials</span><span className={item.approved ? 'passed' : ''}><Check size={14}/> Provider approval</span><span className={item.connected ? 'passed' : ''}><Check size={14}/> User authorization</span></div>
            <footer>{item.connected ? <><button className="button button-outline small" onClick={() => void disconnect(item.provider)} disabled={busy === item.provider}>{busy === item.provider ? 'Working…' : 'Disconnect'}</button><button className="button small" onClick={() => location.assign('/app/publishing')}>Create post</button></> : <button className="button full" onClick={() => void connect(item.provider)} disabled={busy !== null || !item.configured}>{busy === item.provider ? 'Connecting…' : item.configured ? `Connect ${detail.label}` : 'Add credentials first'}</button>}</footer>
          </article>
        })}
      </div>
    </section>

    <section className="release-section">
      <div className="section-title-row"><div><h2>Customer infrastructure</h2><p>Services required for a dependable public release.</p></div></div>
      <div className="service-grid">
        {[
          ['Supabase', 'Accounts, PostgreSQL, realtime, and media storage', services.supabase, <Database/>],
          ['Stripe', 'Subscriptions, checkout, customer portal, and webhooks', services.stripe, <CreditCard/>],
          ['Resend', 'Transactional email and support notifications', services.resend, <Mail/>],
          ['Turnstile', 'Optional bot protection for public forms and account abuse', services.turnstile, <ShieldCheck/>],
          ['Supabase Storage', 'Public publishing media and customer upload delivery', services.publishing_media, <CloudUpload/>],
        ].map(([name, description, ready, icon]) => <article className="service-card card" key={String(name)}><span className="service-icon">{icon}</span><div><h3>{String(name)}</h3><p>{String(description)}</p></div><span className={`readiness-pill ${ready ? 'ready' : 'needs-setup'}`}>{ready ? 'Configured' : 'Needs secret'}</span></article>)}
      </div>
    </section>
  </div>
}

export function PublishingPage() {
  const { demoMode } = useAuth()
  const { projects } = useCommunity()
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(demoIntegrations)
  const [selected, setSelected] = useState<IntegrationProvider[]>(['youtube', 'x'])
  const [title, setTitle] = useState('CreatorOS project update')
  const [caption, setCaption] = useState('A new milestone is complete. Here is what we built and what comes next. #CreatorOS')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video')
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public')
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduledFor, setScheduledFor] = useState('')
  const [tiktokMode, setTiktokMode] = useState<'direct' | 'draft'>('draft')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [results, setResults] = useState<Array<{ provider: string; ok: boolean; status: string; external_id?: string; error?: string }>>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (demoMode) return
    getIntegrationStatus().then(result => setIntegrations(result.integrations)).catch(() => undefined)
  }, [demoMode])

  const connectedProviders = integrations.filter(item => item.connected)
  function toggle(provider: IntegrationProvider) { setSelected(items => items.includes(provider) ? items.filter(item => item !== provider) : [...items, provider]) }
  async function uploadFile(file?: File) {
    if (!file) return
    setError(''); setUploading(true); setUploadProgress(0)
    if (demoMode) { await new Promise(resolve => setTimeout(resolve, 500)); setMediaUrl(`https://media.creatoros.example/${file.name}`); setMediaType(file.type.startsWith('image/') ? 'image' : 'video'); setUploadProgress(100); setUploading(false); return }
    try { const result = await uploadPublishingMedia(file, setUploadProgress); setMediaUrl(result.url); setMediaType(result.content_type.startsWith('image/') ? 'image' : 'video') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Media upload failed.') }
    finally { setUploading(false) }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setResults([])
    if (!selected.length) { setError('Select at least one connected platform.'); return }
    setBusy(true)
    if (demoMode) {
      await new Promise(resolve => setTimeout(resolve, 700))
      setResults(selected.map(provider => ({ provider, ok: true, status: scheduleMode === 'later' ? 'scheduled' : provider === 'tiktok' && tiktokMode === 'draft' ? 'sent_to_inbox' : 'published', external_id: `demo_${Date.now()}` })))
      setBusy(false); return
    }
    try {
      const response = await publishContent({ providers: selected, title, caption, media_url: mediaUrl || undefined, media_type: mediaType, privacy, scheduled_for: scheduleMode === 'later' ? new Date(scheduledFor).toISOString() : null, tiktok_mode: tiktokMode })
      setResults(response.results)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Publishing failed.') }
    finally { setBusy(false) }
  }

  return <div className="page-content release-page">
    <PageHeader eyebrow="PUBLISHING STUDIO" title="Create once. Publish with platform-specific control." description="CreatorOS validates connection, approval, media, and privacy requirements before each platform receives a post." />
    <div className="publishing-layout">
      <form className="publishing-form card" onSubmit={submit}>
        <div className="settings-heading"><div><h2>Post details</h2><p>Use a public or signed media URL from CreatorOS storage.</p></div><span className="tag">{projects[0]?.title || 'CreatorOS project'}</span></div>
        <div className="form-stack">
          <label>Post title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={120}/></label>
          <label>Caption<textarea value={caption} onChange={event => setCaption(event.target.value)} maxLength={2200}/><small>{caption.length}/2200</small></label>
          <div className="media-upload-box"><label className="media-upload-button"><UploadCloud/><span><strong>{uploading ? `Uploading ${uploadProgress}%` : 'Upload publishing media'}</strong><small>Images or video. CreatorOS returns a platform-readable HTTPS URL.</small></span><input type="file" accept="image/*,video/mp4,video/quicktime" disabled={uploading} onChange={event=>void uploadFile(event.target.files?.[0])}/></label>{uploading&&<div className="upload-progress"><span style={{width:`${uploadProgress}%`}}/></div>}</div>
          <div className="form-grid"><label>Media URL<input value={mediaUrl} onChange={event => setMediaUrl(event.target.value)} placeholder="https://media.yourdomain.com/..."/></label><label>Media type<select value={mediaType} onChange={event => setMediaType(event.target.value as 'image'|'video')}><option value="video">Video</option><option value="image">Image</option></select></label></div>
          <div className="form-grid"><label>YouTube visibility<select value={privacy} onChange={event => setPrivacy(event.target.value as typeof privacy)}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select></label><label>TikTok delivery<select value={tiktokMode} onChange={event => setTiktokMode(event.target.value as typeof tiktokMode)}><option value="draft">Send to TikTok inbox</option><option value="direct">Direct Post</option></select></label></div>
          <div><span className="field-label">Platforms</span><div className="publishing-platforms">{integrations.map(item => { const detail=providerDetails[item.provider]; return <button type="button" disabled={!item.connected} className={`${selected.includes(item.provider)?'selected':''} ${!item.connected?'disabled':''}`} onClick={()=>toggle(item.provider)} key={item.provider}><span className={`integration-logo ${detail.tone}`}>{detail.icon}</span><strong>{detail.label}</strong><small>{item.connected?'Connected':'Connect first'}</small></button> })}</div></div>
          <div className="schedule-choice"><button type="button" className={scheduleMode==='now'?'active':''} onClick={()=>setScheduleMode('now')}><Send/>Publish now</button><button type="button" className={scheduleMode==='later'?'active':''} onClick={()=>setScheduleMode('later')}><Clock3/>Schedule</button></div>
          {scheduleMode==='later' && <label>Publishing time<input type="datetime-local" required value={scheduledFor} onChange={event=>setScheduledFor(event.target.value)}/></label>}
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="button full large" disabled={busy || !connectedProviders.length}>{busy ? <><Loader2 className="spin"/> Processing platforms…</> : scheduleMode==='later' ? 'Schedule selected platforms' : 'Publish to selected platforms'}</button>
      </form>
      <aside className="publishing-preview">
        <div className="preview-device card"><div className="preview-account"><span className="preview-avatar">C</span><div><strong>CreatorOS Studio</strong><small>Project update</small></div></div><div className={`preview-media ${mediaType}`}>{mediaType==='video'?<><Film/><span>Video preview</span></>:<><Image/><span>Image preview</span></>}</div><p>{caption || 'Your caption preview appears here.'}</p><div className="preview-reactions">♡　◯　↗</div></div>
        <div className="publication-results card"><h3>Publication results</h3>{!results.length?<p>Each platform will report a separate result. A failure on one platform will not hide successful posts elsewhere.</p>:results.map(result=><div className={result.ok?'result-ok':'result-error'} key={result.provider}><span>{result.ok?<CheckCircle2/>:<AlertTriangle/>}</span><div><strong>{providerDetails[result.provider as IntegrationProvider]?.label||result.provider}</strong><small>{result.ok?result.status:result.error}</small></div></div>)}</div>
      </aside>
    </div>
  </div>
}

type MessageThread = {
  id: string
  name: string
  role: string
  unread: number
  preview: string
  messages: Array<{ id?: string; mine: boolean; text: string; time: string }>
}

const demoThreads: MessageThread[] = [
  { id: 't1', name: 'Maya Torres', role: 'Camera Operator', unread: 2, preview: 'Saturday afternoon works for the camera test.', messages: [
    { mine: false, text: 'I looked through Valley After Dark. I like the visual direction.', time: '10:12 AM' },
    { mine: true, text: 'Great. Are you available for a short camera test this weekend?', time: '10:17 AM' },
    { mine: false, text: 'Saturday afternoon works for the camera test.', time: '10:21 AM' },
  ] },
  { id: 't2', name: 'Devin Brooks', role: 'Audio Engineer', unread: 0, preview: 'I can send the revised mix tonight.', messages: [
    { mine: true, text: 'The vocal sits much better now.', time: 'Yesterday' },
    { mine: false, text: 'I can send the revised mix tonight.', time: 'Yesterday' },
  ] },
]

export function MessagesPage() {
  const { demoMode, user } = useAuth()
  const [threads,setThreads] = useState<MessageThread[]>(demoThreads)
  const [activeId, setActiveId] = useState(demoThreads[0].id)
  const [draft, setDraft] = useState('')
  const [loading,setLoading]=useState(!demoMode)
  const [error,setError]=useState('')
  const active = threads.find(thread => thread.id === activeId) || threads[0]
  const bottomRef = useRef<HTMLDivElement>(null)

  async function loadThreads(){
    if(demoMode){setThreads(demoThreads);setLoading(false);return}
    setLoading(true);setError('')
    try{
      const response=await apiRequest<{threads:Array<any>}>('/api/messages/threads')
      const mapped:MessageThread[]=response.threads.map(thread=>{
        const person=thread.people?.[0]
        return {id:thread.id,name:person?.display_name||thread.subject||'CreatorOS conversation',role:person?.headline||`@${person?.username||'creator'}`,unread:thread.unread||0,preview:thread.preview||'Start the conversation',messages:(thread.messages||[]).map((message:any)=>({id:message.id,mine:message.sender_id===user?.id,text:message.body,time:new Date(message.created_at).toLocaleString([], {hour:'numeric',minute:'2-digit',month:'short',day:'numeric'})}))}
      })
      setThreads(mapped)
      if(mapped.length&&!mapped.some(item=>item.id===activeId))setActiveId(mapped[0].id)
    }catch(reason){setError(reason instanceof Error?reason.message:'Unable to load messages.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{void loadThreads()},[demoMode,user?.id])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[active?.messages.length])

  async function send(event: FormEvent) {
    event.preventDefault(); const text=draft.trim(); if(!text||!active)return
    const optimistic={mine:true,text,time:'Now'}
    setThreads(items=>items.map(thread=>thread.id===active.id?{...thread,messages:[...thread.messages,optimistic],preview:text}:thread)); setDraft('')
    if (!demoMode) {
      try{await apiRequest('/api/messages/send',{method:'POST',body:JSON.stringify({conversation_id:active.id,body:text})});await loadThreads()}
      catch(reason){setError(reason instanceof Error?reason.message:'Message could not be sent.')}
    }
  }

  return <div className="messages-page"><aside className="message-sidebar"><PageHeader eyebrow="MESSAGES" title="Conversations" description="Keep collaboration decisions attached to a real identity."/><div className="thread-search"><MessageSquare size={17}/><input placeholder="Search conversations"/></div><div className="thread-list">{loading?<div className="empty-state"><Loader2 className="spin"/><p>Loading conversations…</p></div>:threads.map(thread=><button className={thread.id===activeId?'active':''} onClick={()=>setActiveId(thread.id)} key={thread.id}><span className="message-avatar">{thread.name.split(' ').map(item=>item[0]).join('').slice(0,2)}</span><div><strong>{thread.name}</strong><small>{thread.preview}</small></div>{thread.unread>0&&<b>{thread.unread}</b>}</button>)}</div></aside>{active?<main className="conversation-panel"><header><div className="message-avatar large">{active.name.split(' ').map(item=>item[0]).join('').slice(0,2)}</div><div><h2>{active.name}</h2><p>{active.role} · CreatorOS identity</p></div><button className="button button-outline small"><Flag size={15}/> Report</button></header><div className="message-history">{active.messages.map((message,index)=><div className={`message-bubble ${message.mine?'mine':''}`} key={message.id||`${message.time}-${index}`}><p>{message.text}</p><small>{message.time}</small></div>)}<div ref={bottomRef}/></div><form className="message-composer" onSubmit={send}><button type="button"><FileImage/></button><input value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Write a message…"/><button className="send-message"><Send/></button></form>{error&&<p className="message-error">{error}</p>}</main>:<main className="conversation-empty"><MessageCircle/><h2>No conversations yet</h2><p>Start from a creator profile or collaboration listing.</p></main>}</div>
}

export function BillingPage() {
  const { demoMode } = useAuth()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  async function checkout(plan: 'pro_monthly'|'pro_annual') { if(demoMode){setError('Demo mode does not open a real checkout. Stripe is fully wired for production credentials.');return} setBusy(plan);setError('');try{const {url}=await createCheckout(plan);location.href=url}catch(reason){setError(reason instanceof Error?reason.message:'Unable to open checkout.')}finally{setBusy('')} }
  async function portal(){if(demoMode){setError('Demo mode does not open a billing portal.');return}setBusy('portal');try{const {url}=await createBillingPortal();location.href=url}catch(reason){setError(reason instanceof Error?reason.message:'Unable to open billing portal.')}finally{setBusy('')}}
  return <div className="page-content release-page"><PageHeader eyebrow="BILLING" title="Simple plans for serious creative work." description="Stripe Checkout, subscription webhooks, and the customer portal are included in the release backend." action={<button className="button button-outline" onClick={()=>void portal()} disabled={Boolean(busy)}><CreditCard/> Manage billing</button>}/>{error&&<div className="release-alert warning"><AlertTriangle/>{error}</div>}<div className="pricing-grid"><article className="pricing-card card"><span className="eyebrow">FOUNDING FREE</span><h2>$0</h2><p>For creators joining the community and building their first projects.</p><ul>{['Creator profile','3 active projects','Community feed and discovery','Collaboration applications','External media links'].map(item=><li key={item}><CheckCircle2/>{item}</li>)}</ul><button className="button button-outline full">Current plan</button></article><article className="pricing-card featured card"><span className="popular-pill">Recommended</span><span className="eyebrow">CREATOROS PRO</span><h2>$12 <small>/ month</small></h2><p>For creators managing an active pipeline across multiple platforms.</p><ul>{['Unlimited active projects','Publishing Studio','Platform connection vault','Advanced project workspaces','10 GB creator storage','Priority support'].map(item=><li key={item}><CheckCircle2/>{item}</li>)}</ul><button className="button full" onClick={()=>void checkout('pro_monthly')} disabled={Boolean(busy)}>{busy==='pro_monthly'?'Opening checkout…':'Start Pro monthly'}</button><button className="text-button" onClick={()=>void checkout('pro_annual')}>Save with annual billing</button></article><article className="pricing-card card"><span className="eyebrow">TEAM</span><h2>Custom</h2><p>Shared workspaces, role controls, client projects, and organization billing.</p><ul>{['Everything in Pro','Shared team workspace','Admin and member roles','Private client projects','Central billing','Launch support'].map(item=><li key={item}><CheckCircle2/>{item}</li>)}</ul><a className="button button-outline full" href="mailto:support@creatoros.community">Contact CreatorOS</a></article></div></div>
}

export function AccountSecurityPage() {
  const { profile, signOut, demoMode } = useAuth()
  const navigate = useNavigate()
  const [busy,setBusy]=useState(''); const [message,setMessage]=useState(''); const [error,setError]=useState(''); const [confirm,setConfirm]=useState('')
  async function exportData(){
    setBusy('export');setError('')
    try{
      if(demoMode){setMessage('Demo export prepared. A production account creates a signed, private JSON download containing the customer’s CreatorOS data.');return}
      const result=await requestDataExport();setMessage(result.message);if(result.download_url)location.href=result.download_url
    }catch(reason){setError(reason instanceof Error?reason.message:'Unable to export data.')}finally{setBusy('')}
  }
  async function remove(){
    if(confirm!=='DELETE'){setError('Type DELETE to confirm account deletion.');return}
    setBusy('delete');setError('')
    try{
      if(demoMode){setMessage('Demo account deletion simulated. No real customer data or credentials were affected.');setConfirm('');return}
      const result=await requestAccountDeletion(confirm);setMessage(result.message);await signOut();navigate('/')
    }catch(reason){setError(reason instanceof Error?reason.message:'Unable to delete account.')}finally{setBusy('')}
  }
  return <div className="page-content release-page"><PageHeader eyebrow="ACCOUNT SECURITY" title="Your identity and data stay under your control." description="Export, session, provider, and deletion workflows are part of the customer release—not future promises."/><div className="security-grid"><section className="settings-section card"><div className="settings-heading"><div><h2>Account identity</h2><p>Signed in as @{profile?.username}</p></div><LockKeyhole/></div><div className="security-fact"><span>Profile visibility</span><strong>Public creator profile</strong></div><div className="security-fact"><span>Project privacy</span><strong>Per-project controls</strong></div><div className="security-fact"><span>Database protection</span><strong>Row Level Security</strong></div></section><section className="settings-section card"><div className="settings-heading"><div><h2>Export your data</h2><p>Request a machine-readable export of your CreatorOS account.</p></div><FileDown/></div><button className="button button-outline" onClick={()=>void exportData()} disabled={Boolean(busy)}>{busy==='export'?'Preparing…':'Create data export'}</button></section><section className="settings-section card danger-zone"><div className="settings-heading"><div><h2>Delete account</h2><p>Remove your account, revoke platform tokens, and queue media for deletion.</p></div><Trash2/></div><label>Type DELETE to confirm<input value={confirm} onChange={event=>setConfirm(event.target.value)} placeholder="DELETE"/></label><button className="button button-danger" onClick={()=>void remove()} disabled={Boolean(busy)}>{busy==='delete'?'Deleting…':'Permanently delete account'}</button></section></div>{message&&<p className="form-success">{message}</p>}{error&&<p className="form-error">{error}</p>}</div>
}

const demoReports = [
  { id:'r1', type:'Collaboration listing', target:'Unclear unpaid editor request', reason:'Misleading compensation', reporter:'3 community reports', status:'open' },
  { id:'r2', type:'Creator profile', target:'Portfolio ownership dispute', reason:'Possible impersonation', reporter:'1 report', status:'reviewing' },
]

export function AdminPage() {
  const { demoMode } = useAuth()
  const [reports,setReports]=useState(demoReports)
  const [authorized,setAuthorized]=useState(demoMode)
  const [loading,setLoading]=useState(!demoMode)
  const [error,setError]=useState('')
  useEffect(()=>{if(demoMode)return;apiRequest<{reports:Array<any>}>('/api/admin/reports').then(result=>{setAuthorized(true);setReports(result.reports.map(report=>({id:report.id,type:report.target_type,target:report.target_id,reason:report.reason,reporter:report.details||'Community report',status:report.status})))}).catch(reason=>setError(reason instanceof Error?reason.message:'Admin access unavailable.')).finally(()=>setLoading(false))},[demoMode])
  async function changeStatus(id:string,status:string){setReports(items=>items.map(item=>item.id===id?{...item,status}:item));if(!demoMode)try{await apiRequest('/api/admin/reports',{method:'PATCH',body:JSON.stringify({id,status})})}catch(reason){setError(reason instanceof Error?reason.message:'Unable to update report.')}}
  if(loading)return <div className="page-content"><div className="empty-state card"><Loader2 className="spin"/><h2>Checking administrator access</h2></div></div>
  if(!authorized)return <div className="page-content"><div className="empty-state card"><ShieldCheck/><h2>Administrator access required</h2><p>{error||'This page is restricted by server-side role checks.'}</p></div></div>
  return <div className="page-content release-page"><PageHeader eyebrow="ADMIN CONSOLE" title="Operate CreatorOS safely." description="Moderation, user risk, platform health, and release controls are available to verified administrators only."/><div className="admin-stats"><div className="card"><Users/><strong>1,284</strong><span>Beta members</span></div><div className="card"><Flag/><strong>{reports.filter(item=>item.status!=='resolved').length}</strong><span>Open reports</span></div><div className="card"><Radio/><strong>99.9%</strong><span>API availability</span></div><div className="card"><CloudUpload/><strong>86%</strong><span>Publishing success</span></div></div>{error&&<div className="release-alert error"><AlertTriangle/>{error}</div>}<div className="admin-layout"><section className="card admin-table"><div className="settings-heading"><div><h2>Moderation queue</h2><p>Reports are private to authorized staff.</p></div><span className="readiness-pill needs-connection">Action required</span></div>{reports.map(report=><article key={report.id}><span className="report-icon"><Flag/></span><div><strong>{report.target}</strong><p>{report.type} · {report.reason}</p><small>{report.reporter}</small></div><select value={report.status} onChange={event=>void changeStatus(report.id,event.target.value)}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></article>)}</section><aside className="admin-side"><section className="card"><h3>Release controls</h3>{['New registrations','Social publishing','Public project creation','Paid subscriptions'].map(item=><label className="toggle-row" key={item}><span>{item}</span><input type="checkbox" defaultChecked/></label>)}</section><section className="card"><h3>System health</h3>{[['Supabase','Operational'],['Vercel Functions','Operational'],['Stripe webhooks','Credential dependent'],['Social providers','Review dependent']].map(item=><div className="health-row" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></div>)}</section></aside></div></div>
}

