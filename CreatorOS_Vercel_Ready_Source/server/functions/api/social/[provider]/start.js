import { requireUser } from '../../../_shared/auth.js'
import { insert } from '../../../_shared/db.js'
import { pkceChallenge, randomToken } from '../../../_shared/crypto.js'
import { failure, json } from '../../../_shared/http.js'
import { configured, providerConfig } from '../../../_shared/providers.js'

export async function onRequestPost({ request, env, params }) {
  const auth = await requireUser(request, env)
  if (auth.response) return auth.response
  const provider = String(params.provider || '')
  if (!['youtube','instagram','tiktok','x'].includes(provider)) return failure('Unsupported provider.', 404)
  if (!configured(provider, env)) return failure(`${provider} application credentials are not configured.`, 503)
  const config = providerConfig(provider, env)
  const state = randomToken(24)
  const verifier = provider === 'x' ? randomToken(48) : null
  const challenge = verifier ? await pkceChallenge(verifier) : null
  await insert(env, 'oauth_states', {
    state, user_id: auth.user.id, provider, code_verifier: verifier, redirect_path: '/app/integrations', expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })
  const url = new URL(config.authorize)
  if (provider === 'tiktok') {
    url.searchParams.set('client_key', config.clientId)
    url.searchParams.set('scope', config.scopes.join(','))
  } else {
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('scope', config.scopes.join(' '))
  }
  url.searchParams.set('redirect_uri', config.callback)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  if (provider === 'youtube') {
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('include_granted_scopes', 'true')
  }
  if (provider === 'x' && challenge) {
    url.searchParams.set('code_challenge', challenge)
    url.searchParams.set('code_challenge_method', 'S256')
  }
  return json({ authorization_url: url.toString() })
}
