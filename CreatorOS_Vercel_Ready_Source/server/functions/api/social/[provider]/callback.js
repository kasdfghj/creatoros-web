import { db } from '../../../_shared/db.js'
import { encryptJson } from '../../../_shared/crypto.js'
import { failure, redirect } from '../../../_shared/http.js'
import { providerConfig } from '../../../_shared/providers.js'

async function tokenExchange(provider, config, code, verifier) {
  if (provider === 'instagram') {
    const url = new URL(config.token)
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('client_secret', config.clientSecret)
    url.searchParams.set('redirect_uri', config.callback)
    url.searchParams.set('code', code)
    const response = await fetch(url)
    if (!response.ok) throw new Error(await response.text())
    const shortToken = await response.json()
    const longUrl = new URL('https://graph.facebook.com/v25.0/oauth/access_token')
    longUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longUrl.searchParams.set('client_id', config.clientId)
    longUrl.searchParams.set('client_secret', config.clientSecret)
    longUrl.searchParams.set('fb_exchange_token', shortToken.access_token)
    const longResponse = await fetch(longUrl)
    return longResponse.ok ? longResponse.json() : shortToken
  }
  const body = new URLSearchParams()
  body.set('code', code)
  body.set('grant_type', 'authorization_code')
  body.set('redirect_uri', config.callback)
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (provider === 'tiktok') {
    body.set('client_key', config.clientId); body.set('client_secret', config.clientSecret)
  } else if (provider === 'x') {
    body.set('client_id', config.clientId); body.set('code_verifier', verifier || '')
    headers.Authorization = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`
  } else {
    body.set('client_id', config.clientId); body.set('client_secret', config.clientSecret)
  }
  const response = await fetch(config.token, { method: 'POST', headers, body })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function accountInfo(provider, token) {
  const access = token.access_token
  if (provider === 'youtube') {
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: `Bearer ${access}` } })
    const data = response.ok ? await response.json() : null
    const channel = data?.items?.[0]
    return { account_id: channel?.id || null, account_name: channel?.snippet?.title || 'YouTube channel', metadata: data || {} }
  }
  if (provider === 'x') {
    const response = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,username,name', { headers: { Authorization: `Bearer ${access}` } })
    const data = response.ok ? await response.json() : null
    return { account_id: data?.data?.id || null, account_name: data?.data?.username ? `@${data.data.username}` : 'X account', metadata: data || {} }
  }
  if (provider === 'tiktok') {
    const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', { headers: { Authorization: `Bearer ${access}` } })
    const data = response.ok ? await response.json() : null
    const user = data?.data?.user
    return { account_id: user?.open_id || token.open_id || null, account_name: user?.display_name || user?.username || 'TikTok account', metadata: data || {} }
  }
  if (provider === 'instagram') {
    const pages = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(access)}`)
    const data = pages.ok ? await pages.json() : null
    const page = data?.data?.find(item => item.instagram_business_account)
    const ig = page?.instagram_business_account
    return { account_id: ig?.id || null, account_name: ig?.username ? `@${ig.username}` : ig?.name || 'Instagram professional account', metadata: data || {} }
  }
  return { account_id: null, account_name: null, metadata: {} }
}

export async function onRequestGet({ request, env, params }) {
  const provider = String(params.provider || '')
  const site = env.SITE_URL.replace(/\/$/, '')
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const providerError = url.searchParams.get('error_description') || url.searchParams.get('error')
  if (providerError) return redirect(`${site}/app/integrations?integration_error=${encodeURIComponent(providerError)}`)
  if (!code || !state) return redirect(`${site}/app/integrations?integration_error=${encodeURIComponent('Missing OAuth callback parameters.')}`)
  try {
    const rows = await db(env, `oauth_states?state=eq.${encodeURIComponent(state)}&provider=eq.${provider}&select=*`)
    const saved = rows?.[0]
    if (!saved || new Date(saved.expires_at).getTime() < Date.now()) throw new Error('The connection request expired. Start again from CreatorOS.')
    const config = providerConfig(provider, env)
    const token = await tokenExchange(provider, config, code, saved.code_verifier)
    const account = await accountInfo(provider, token)
    const encrypted = await encryptJson(token, env.TOKEN_ENCRYPTION_KEY)
    const expiresAt = token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null
    await db(env, 'social_connections?on_conflict=user_id,provider', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({
        user_id: saved.user_id, provider, account_id: account.account_id, account_name: account.account_name,
        encrypted_tokens: encrypted, token_scopes: String(token.scope || '').split(/[ ,]+/).filter(Boolean), expires_at: expiresAt,
        metadata: account.metadata, status: 'active', updated_at: new Date().toISOString(),
      }),
    })
    await db(env, `oauth_states?state=eq.${encodeURIComponent(state)}`, { method: 'DELETE' })
    return redirect(`${site}/app/integrations?connected=${provider}`)
  } catch (error) {
    return redirect(`${site}/app/integrations?integration_error=${encodeURIComponent(error instanceof Error ? error.message : 'Connection failed.')}`)
  }
}
