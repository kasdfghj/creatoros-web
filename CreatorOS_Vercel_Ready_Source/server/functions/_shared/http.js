export const securityHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...securityHeaders, ...extra } })
}

export function failure(message, status = 400, detail) {
  return json({ error: message, ...(detail ? { detail } : {}) }, status)
}

export async function readJson(request) {
  const type = request.headers.get('content-type') || ''
  if (!type.includes('application/json')) throw new Error('Expected application/json request body.')
  return request.json()
}

export function redirect(url, status = 302) {
  return new Response(null, { status, headers: { Location: url, 'Cache-Control': 'no-store' } })
}
