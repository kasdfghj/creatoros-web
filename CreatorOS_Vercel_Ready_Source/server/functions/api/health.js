import { json } from '../_shared/http.js'
export function onRequestGet({ env }) {
  return json({ ok: true, app: 'CreatorOS', version: '1.0.0-vercel-rc1', services: {
    supabase: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
    stripe: Boolean(env.STRIPE_SECRET_KEY),
    resend: Boolean(env.RESEND_API_KEY),
    turnstile: Boolean(env.TURNSTILE_SECRET_KEY),
    publishing_media: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  } })
}
