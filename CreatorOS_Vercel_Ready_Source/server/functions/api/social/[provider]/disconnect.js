import { requireUser } from '../../../_shared/auth.js'
import { db } from '../../../_shared/db.js'
import { failure, json } from '../../../_shared/http.js'

export async function onRequestPost({ request, env, params }) {
  const auth = await requireUser(request, env)
  if (auth.response) return auth.response
  const provider = String(params.provider || '')
  if (!['youtube','instagram','tiktok','x'].includes(provider)) return failure('Unsupported provider.', 404)
  await db(env, `social_connections?user_id=eq.${auth.user.id}&provider=eq.${provider}`, { method: 'DELETE' })
  return json({ ok: true })
}
