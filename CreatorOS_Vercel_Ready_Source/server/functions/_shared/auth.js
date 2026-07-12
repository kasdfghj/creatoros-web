import { failure } from './http.js'

export function bearerToken(request) {
  const header = request.headers.get('authorization') || ''
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null
}

export async function getUser(request, env) {
  const token = bearerToken(request)
  if (!token) return null
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return null
  return response.json()
}

export async function requireUser(request, env) {
  const user = await getUser(request, env)
  if (!user) return { response: failure('Authentication required.', 401) }
  return { user, token: bearerToken(request) }
}

export async function requireAdmin(request, env) {
  const auth = await requireUser(request, env)
  if (auth.response) return auth
  const allowed = (env.ADMIN_USER_IDS || '').split(',').map(v => v.trim()).filter(Boolean)
  if (!allowed.includes(auth.user.id)) return { response: failure('Administrator access required.', 403) }
  return auth
}
