import { requireUser } from '../../_shared/auth.js'
import { failure, json } from '../../_shared/http.js'

function safeName(name) {
  return String(name || 'media').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120)
}

function publicObjectUrl(env, bucket, key) {
  const encoded = key.split('/').map(encodeURIComponent).join('/')
  return `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encoded}`
}

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env)
  if (auth.response) return auth.response
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return failure('Supabase Storage is not configured.', 503)
  const form = await request.formData()
  const file = form.get('file')
  if (!file || typeof file.arrayBuffer !== 'function') return failure('Choose a media file.')
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
  if (!allowed.includes(file.type)) return failure('Unsupported publishing media type.')
  const max = Number(env.MAX_MEDIA_UPLOAD_BYTES || '524288000')
  if (file.size > max) return failure(`File exceeds the ${Math.round(max / 1024 / 1024)} MB upload limit.`, 413)
  const bucket = env.PUBLISHING_MEDIA_BUCKET || 'publishing-media'
  const key = `${auth.user.id}/${crypto.randomUUID()}-${safeName(file.name)}`
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': file.type,
      'Cache-Control': 'public, max-age=604800',
      'x-upsert': 'false',
    },
    body: await file.arrayBuffer(),
  })
  if (!response.ok) return failure('Unable to store publishing media.', response.status, await response.text())
  return json({ url: publicObjectUrl(env, bucket, key), key, content_type: file.type, size: file.size })
}
