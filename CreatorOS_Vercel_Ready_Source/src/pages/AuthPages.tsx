import { Github, Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

const socialProviders = [
  { id: 'google' as const, label: 'Continue with Google', mark: 'G' },
  { id: 'discord' as const, label: 'Continue with Discord', mark: 'D' },
  { id: 'github' as const, label: 'Continue with GitHub', icon: Github },
  { id: 'facebook' as const, label: 'Continue with Facebook', mark: 'f' },
  { id: 'twitter' as const, label: 'Continue with X', mark: '𝕏' },
]

export function LoginPage() {
  const { authenticated, configured, signInWithOAuth, sendMagicLink, enterDemo, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('demo') === '1' && !authenticated) {
      enterDemo()
      navigate('/app', { replace: true })
    }
  }, [authenticated, enterDemo, navigate, searchParams])

  if (authenticated) return <Navigate to={profile?.onboarding_complete === false ? '/onboarding' : '/app'} replace />

  async function social(provider: typeof socialProviders[number]['id']) {
    setBusy(provider); setError(''); setMessage('')
    try { await signInWithOAuth(provider) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to start social sign-in.'); setBusy(null) }
  }

  async function magicLink(event: FormEvent) {
    event.preventDefault(); setBusy('email'); setError(''); setMessage('')
    try { await sendMagicLink(email); setMessage('Check your email for a secure CreatorOS sign-in link.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send sign-in link.') }
    finally { setBusy(null) }
  }

  return <div className="auth-page">
    <section className="auth-story"><Brand /><div><span className="eyebrow">CREATOROS FOUNDING BETA</span><h1>Your creative work deserves a real home.</h1><p>Build projects, find collaborators, share progress, and grow inside a professional community made for independent creators.</p><div className="auth-benefits"><span><ShieldCheck /> Professional community standards</span><span><MessageCircle /> Project-first conversations</span><span><Mail /> No download required</span></div></div><small>By joining, you agree to the CreatorOS Terms and Community Guidelines.</small></section>
    <section className="auth-panel"><div className="auth-card"><div className="mobile-auth-brand"><Brand /></div><h2>Join CreatorOS</h2><p>Choose a social account or use a secure email link.</p>
      {!configured && <div className="configuration-notice"><strong>Release setup needed</strong><span>Social buttons are fully wired but need your Supabase project and OAuth provider credentials. Demo mode works now.</span></div>}
      <div className="social-login-grid">{socialProviders.map(provider => {
        const Icon = provider.icon
        return <button key={provider.id} className="social-login-button" onClick={() => social(provider.id)} disabled={busy !== null}><span className={`provider-mark provider-${provider.id}`}>{Icon ? <Icon size={19} /> : provider.mark}</span>{busy === provider.id ? 'Connecting…' : provider.label}</button>
      })}</div>
      <div className="auth-divider"><span>or</span></div>
      <form className="magic-form" onSubmit={magicLink}><label>Email address<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="button full" disabled={busy !== null}>{busy === 'email' ? 'Sending…' : 'Email me a sign-in link'}</button></form>
      {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}
      <button className="demo-login" onClick={() => { enterDemo(); navigate('/app') }}>Explore the full demo workspace</button>
      <p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link>, <Link to="/privacy">Privacy Policy</Link>, and <Link to="/community-guidelines">Community Guidelines</Link>.</p>
    </div></section>
  </div>
}

export function AuthCallbackPage() {
  const { authenticated, loading, profile } = useAuth()
  if (loading) return <div className="center-screen"><div className="loading-mark">C</div><p>Finishing secure sign-in…</p></div>
  if (authenticated) return <Navigate to={profile?.onboarding_complete === false ? '/onboarding' : '/app'} replace />
  return <div className="center-screen"><div className="loading-mark">!</div><h2>Sign-in was not completed</h2><p>Return to the login page and try again.</p><Link className="button" to="/login">Back to sign in</Link></div>
}
