import { requireUser } from '../_shared/auth.js'
import { decryptJson, encryptJson } from '../_shared/crypto.js'
import { db, insert, update } from '../_shared/db.js'
import { failure, json, readJson } from '../_shared/http.js'
import { providerConfig } from '../_shared/providers.js'

const allowedProviders = ['youtube','instagram','tiktok','x']

async function connection(env, userId, provider) {
  const rows = await db(env, `social_connections?user_id=eq.${userId}&provider=eq.${provider}&status=eq.active&select=*`)
  const row = rows?.[0]
  if (!row) throw new Error(`${provider} is not connected.`)
  let tokens = await decryptJson(row.encrypted_tokens, env.TOKEN_ENCRYPTION_KEY)
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now() + 60_000 && tokens.refresh_token) {
    tokens = await refreshToken(provider, tokens, env)
    const encrypted = await encryptJson(tokens, env.TOKEN_ENCRYPTION_KEY)
    const expiresAt = tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : row.expires_at
    await update(env, 'social_connections', `id=eq.${row.id}`, { encrypted_tokens: encrypted, expires_at: expiresAt, updated_at: new Date().toISOString() })
  }
  return { row, tokens }
}

async function refreshToken(provider, tokens, env) {
  const config = providerConfig(provider, env)
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token })
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (provider === 'youtube') { body.set('client_id', config.clientId); body.set('client_secret', config.clientSecret) }
  if (provider === 'tiktok') { body.set('client_key', config.clientId); body.set('client_secret', config.clientSecret) }
  if (provider === 'x') { body.set('client_id', config.clientId); headers.Authorization = `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}` }
  const response = await fetch(config.token, { method: 'POST', headers, body })
  if (!response.ok) throw new Error(`${provider} token refresh failed: ${await response.text()}`)
  const fresh = await response.json()
  return { ...tokens, ...fresh, refresh_token: fresh.refresh_token || tokens.refresh_token }
}

async function fetchMedia(url) {
  if (!url || !/^https:\/\//i.test(url)) throw new Error('A public HTTPS media URL is required for this platform.')
  const response = await fetch(url)
  if (!response.ok || !response.body) throw new Error(`Unable to download media (${response.status}).`)
  return response
}

async function publishYouTube(tokens, payload) {
  if (!payload.media_url || payload.media_type !== 'video') throw new Error('YouTube publishing requires a video URL.')
  const media = await fetchMedia(payload.media_url)
  const contentType = media.headers.get('content-type') || 'video/mp4'
  const length = media.headers.get('content-length')
  const initiate = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST', headers: {
      Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': contentType, ...(length ? { 'X-Upload-Content-Length': length } : {}),
    }, body: JSON.stringify({ snippet: { title: payload.title, description: payload.caption, categoryId: '22' }, status: { privacyStatus: payload.privacy || 'public', selfDeclaredMadeForKids: false } }),
  })
  if (!initiate.ok) throw new Error(`YouTube upload initialization failed: ${await initiate.text()}`)
  const uploadUrl = initiate.headers.get('location')
  if (!uploadUrl) throw new Error('YouTube did not return an upload location.')
  const uploaded = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType, ...(length ? { 'Content-Length': length } : {}) }, body: media.body })
  if (!uploaded.ok) throw new Error(`YouTube upload failed: ${await uploaded.text()}`)
  const data = await uploaded.json()
  return { status: 'published', external_id: data.id }
}

async function publishInstagram(connectionRow, tokens, payload) {
  if (!connectionRow.account_id) throw new Error('Instagram professional account ID was not discovered. Reconnect the account after Meta permissions are approved.')
  if (!payload.media_url) throw new Error('Instagram publishing requires a public media URL.')
  const params = new URLSearchParams({ access_token: tokens.access_token, caption: payload.caption || '' })
  if (payload.media_type === 'video') { params.set('media_type', 'REELS'); params.set('video_url', payload.media_url); params.set('share_to_feed', 'true') }
  else params.set('image_url', payload.media_url)
  const containerResponse = await fetch(`https://graph.facebook.com/v25.0/${connectionRow.account_id}/media`, { method: 'POST', body: params })
  if (!containerResponse.ok) throw new Error(`Instagram container failed: ${await containerResponse.text()}`)
  const container = await containerResponse.json()
  if (payload.media_type === 'video') {
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2500))
      const status = await fetch(`https://graph.facebook.com/v25.0/${container.id}?fields=status_code,status&access_token=${encodeURIComponent(tokens.access_token)}`)
      const data = await status.json()
      if (data.status_code === 'FINISHED') break
      if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') throw new Error(`Instagram media processing failed: ${data.status || data.status_code}`)
      if (attempt === 19) throw new Error('Instagram media processing timed out.')
    }
  }
  const publishParams = new URLSearchParams({ creation_id: container.id, access_token: tokens.access_token })
  const published = await fetch(`https://graph.facebook.com/v25.0/${connectionRow.account_id}/media_publish`, { method: 'POST', body: publishParams })
  if (!published.ok) throw new Error(`Instagram publish failed: ${await published.text()}`)
  const data = await published.json()
  return { status: 'published', external_id: data.id }
}

async function publishTikTok(tokens, payload, env) {
  if (!payload.media_url) throw new Error('TikTok publishing requires a verified-domain media URL.')
  if (payload.media_type === 'image') {
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST', headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_info: { title: payload.title, description: payload.caption, privacy_level: payload.tiktok_mode === 'direct' ? 'PUBLIC_TO_EVERYONE' : undefined, disable_comment: false, auto_add_music: true },
        source_info: { source: 'PULL_FROM_URL', photo_cover_index: 1, photo_images: [payload.media_url] },
        post_mode: payload.tiktok_mode === 'direct' ? 'DIRECT_POST' : 'MEDIA_UPLOAD', media_type: 'PHOTO',
      }),
    })
    if (!response.ok) throw new Error(`TikTok photo initialization failed: ${await response.text()}`)
    const data = await response.json()
    if (data.error?.code && data.error.code !== 'ok') throw new Error(data.error.message || data.error.code)
    return { status: payload.tiktok_mode === 'direct' ? 'processing' : 'sent_to_inbox', external_id: data.data?.publish_id }
  }
  const direct = payload.tiktok_mode === 'direct'
  if (direct && env.TIKTOK_APPROVED !== 'true') throw new Error('TikTok Direct Post is disabled until the production app is approved. Use inbox draft mode.')
  if (direct) {
    const creatorInfo = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', { method: 'POST', headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json; charset=UTF-8' } })
    if (!creatorInfo.ok) throw new Error(`TikTok creator info failed: ${await creatorInfo.text()}`)
  }
  const endpoint = direct ? 'https://open.tiktokapis.com/v2/post/publish/video/init/' : 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/'
  const body = direct ? {
    post_info: { title: payload.caption, privacy_level: 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false, disable_stitch: false },
    source_info: { source: 'PULL_FROM_URL', video_url: payload.media_url },
  } : { source_info: { source: 'PULL_FROM_URL', video_url: payload.media_url } }
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`TikTok initialization failed: ${await response.text()}`)
  const data = await response.json()
  if (data.error?.code && data.error.code !== 'ok') throw new Error(data.error.message || data.error.code)
  return { status: direct ? 'processing' : 'sent_to_inbox', external_id: data.data?.publish_id }
}

async function publishX(tokens, payload) {
  let mediaId = null
  if (payload.media_url) {
    const media = await fetchMedia(payload.media_url)
    const bytes = await media.arrayBuffer()
    const type = media.headers.get('content-type') || (payload.media_type === 'video' ? 'video/mp4' : 'image/jpeg')
    const initForm = new FormData(); initForm.set('command','INIT'); initForm.set('media_type',type); initForm.set('total_bytes',String(bytes.byteLength)); initForm.set('media_category',payload.media_type === 'video' ? 'tweet_video' : 'tweet_image')
    const initialized = await fetch('https://api.x.com/2/media/upload', { method:'POST', headers:{Authorization:`Bearer ${tokens.access_token}`}, body:initForm })
    if(!initialized.ok) throw new Error(`X media initialization failed: ${await initialized.text()}`)
    mediaId = (await initialized.json()).data?.id
    const appendForm = new FormData(); appendForm.set('command','APPEND'); appendForm.set('media_id',mediaId); appendForm.set('segment_index','0'); appendForm.set('media',new Blob([bytes],{type}), 'media')
    const appended = await fetch('https://api.x.com/2/media/upload', { method:'POST', headers:{Authorization:`Bearer ${tokens.access_token}`}, body:appendForm })
    if(!appended.ok) throw new Error(`X media upload failed: ${await appended.text()}`)
    const finalizeForm = new FormData(); finalizeForm.set('command','FINALIZE'); finalizeForm.set('media_id',mediaId)
    const finalized = await fetch('https://api.x.com/2/media/upload', { method:'POST', headers:{Authorization:`Bearer ${tokens.access_token}`}, body:finalizeForm })
    if(!finalized.ok) throw new Error(`X media finalization failed: ${await finalized.text()}`)
  }
  const response = await fetch('https://api.x.com/2/tweets', { method:'POST', headers:{Authorization:`Bearer ${tokens.access_token}`,'Content-Type':'application/json'}, body:JSON.stringify({text:payload.caption || payload.title, ...(mediaId?{media:{media_ids:[mediaId]}}:{})}) })
  if(!response.ok) throw new Error(`X post failed: ${await response.text()}`)
  const data=await response.json(); return {status:'published',external_id:data.data?.id}
}

async function execute(env, userId, provider, payload) {
  const { row, tokens } = await connection(env, userId, provider)
  if (provider === 'youtube') return publishYouTube(tokens, payload)
  if (provider === 'instagram') return publishInstagram(row, tokens, payload)
  if (provider === 'tiktok') return publishTikTok(tokens, payload, env)
  if (provider === 'x') return publishX(tokens, payload)
  throw new Error('Unsupported provider.')
}

export async function onRequestPost({ request, env }) {
  const internal = request.headers.get('x-creatoros-cron') === env.CRON_SECRET
  let userId
  if (internal) userId = request.headers.get('x-creatoros-user')
  else {
    const auth = await requireUser(request, env)
    if (auth.response) return auth.response
    userId = auth.user.id
  }
  if (!userId) return failure('Publishing user is missing.', 401)
  let payload
  try { payload = await readJson(request) } catch (error) { return failure(error.message, 400) }
  const providers = Array.isArray(payload.providers) ? [...new Set(payload.providers)].filter(item => allowedProviders.includes(item)) : []
  if (!providers.length) return failure('Choose at least one publishing platform.')
  if (!payload.title || !payload.caption) return failure('Title and caption are required.')
  const scheduledAt = payload.scheduled_for ? new Date(payload.scheduled_for) : null
  if (scheduledAt && scheduledAt.getTime() > Date.now() + 30_000) {
    const job = await insert(env, 'publication_jobs', { user_id: userId, payload, scheduled_for: scheduledAt.toISOString(), status: 'queued' })
    return json({ publication_id: job.id, results: providers.map(provider => ({ provider, ok: true, status: 'scheduled' })) })
  }
  const publication = await insert(env, 'publications', { user_id: userId, title: payload.title, caption: payload.caption, media_url: payload.media_url || null, providers, status: 'processing' })
  const results = []
  for (const provider of providers) {
    try {
      const result = await execute(env, userId, provider, payload)
      results.push({ provider, ok: true, ...result })
    } catch (error) { results.push({ provider, ok: false, status: 'failed', error: error instanceof Error ? error.message : 'Publishing failed.' }) }
  }
  const overall = results.every(item => item.ok) ? 'published' : results.some(item => item.ok) ? 'partial' : 'failed'
  await update(env, 'publications', `id=eq.${publication.id}`, { status: overall, results, published_at: overall === 'failed' ? null : new Date().toISOString() })
  return json({ publication_id: publication.id, results }, overall === 'failed' ? 502 : 200)
}
