import { requireUser } from '../../_shared/auth.js'
import { db } from '../../_shared/db.js'
import { json } from '../../_shared/http.js'
import { configured, providerLabels } from '../../_shared/providers.js'

export async function onRequestGet({ request, env }) {
  const auth = await requireUser(request, env)
  if (auth.response) return auth.response
  let connections = []
  try { connections = await db(env, `social_connections?user_id=eq.${auth.user.id}&select=provider,account_id,account_name,expires_at,status`) || [] } catch {}
  const byProvider = Object.fromEntries(connections.map(item => [item.provider, item]))
  const providers = ['youtube','instagram','tiktok','x']
  const approvals = {
    youtube: env.YOUTUBE_APPROVED === 'true', instagram: env.INSTAGRAM_APPROVED === 'true',
    tiktok: env.TIKTOK_APPROVED === 'true', x: env.X_APPROVED === 'true',
  }
  const details = {
    youtube: 'Uploads videos and Shorts with channel-controlled visibility.',
    instagram: 'Publishes images and Reels to eligible professional accounts.',
    tiktok: 'Supports approved Direct Post and inbox-draft delivery.',
    x: 'Creates text and media posts using user-context authorization.',
  }
  return json({ integrations: providers.map(provider => ({
    provider, label: providerLabels[provider], configured: configured(provider, env), connected: Boolean(byProvider[provider] && byProvider[provider].status === 'active'),
    approved: approvals[provider], account_name: byProvider[provider]?.account_name || null, account_id: byProvider[provider]?.account_id || null,
    expires_at: byProvider[provider]?.expires_at || null, detail: details[provider],
  })), services: {
    supabase: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY), stripe: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    resend: Boolean(env.RESEND_API_KEY), turnstile: Boolean(env.TURNSTILE_SECRET_KEY), publishing_media: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  } })
}
