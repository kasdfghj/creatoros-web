import * as health from '../server/functions/api/health.js'
import * as integrationStatus from '../server/functions/api/integrations/status.js'
import * as mediaUpload from '../server/functions/api/media/upload.js'
import * as publish from '../server/functions/api/publish.js'
import * as cronPublish from '../server/functions/api/cron/publish.js'
import * as accountExport from '../server/functions/api/account/export.js'
import * as accountDelete from '../server/functions/api/account/delete.js'
import * as adminReports from '../server/functions/api/admin/reports.js'
import * as billingCheckout from '../server/functions/api/billing/checkout.js'
import * as billingPortal from '../server/functions/api/billing/portal.js'
import * as emailSend from '../server/functions/api/email/send.js'
import * as messageSend from '../server/functions/api/messages/send.js'
import * as messageStart from '../server/functions/api/messages/start.js'
import * as messageThreads from '../server/functions/api/messages/threads.js'
import * as moderationReport from '../server/functions/api/moderation/report.js'
import * as stripeWebhook from '../server/functions/api/stripe/webhook.js'
import * as socialStart from '../server/functions/api/social/[provider]/start.js'
import * as socialCallback from '../server/functions/api/social/[provider]/callback.js'
import * as socialDisconnect from '../server/functions/api/social/[provider]/disconnect.js'

export const config = { api: { bodyParser: false } }

const exactRoutes = new Map([
  ['health', { GET: health.onRequestGet }],
  ['integrations/status', { GET: integrationStatus.onRequestGet }],
  ['media/upload', { POST: mediaUpload.onRequestPost }],
  ['publish', { POST: publish.onRequestPost }],
  ['cron/publish', { GET: cronPublish.onRequestPost, POST: cronPublish.onRequestPost }],
  ['account/export', { POST: accountExport.onRequestPost }],
  ['account/delete', { POST: accountDelete.onRequestPost }],
  ['admin/reports', { GET: adminReports.onRequestGet, PATCH: adminReports.onRequestPatch }],
  ['billing/checkout', { POST: billingCheckout.onRequestPost }],
  ['billing/portal', { POST: billingPortal.onRequestPost }],
  ['email/send', { POST: emailSend.onRequestPost }],
  ['messages/send', { POST: messageSend.onRequestPost }],
  ['messages/start', { POST: messageStart.onRequestPost }],
  ['messages/threads', { GET: messageThreads.onRequestGet }],
  ['moderation/report', { POST: moderationReport.onRequestPost }],
  ['stripe/webhook', { POST: stripeWebhook.onRequestPost }],
])

async function rawBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return chunks.length ? Buffer.concat(chunks) : undefined
}

function requestUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  return `${protocol}://${host}${req.url || '/'}`
}

async function toWebRequest(req) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) value.forEach(item => headers.append(key, item))
    else if (value !== undefined) headers.set(key, String(value))
  }
  const body = await rawBody(req)
  return new Request(requestUrl(req), {
    method: req.method,
    headers,
    ...(body ? { body } : {}),
  })
}

async function sendWebResponse(response, res) {
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.statusCode = response.status
  const body = Buffer.from(await response.arrayBuffer())
  res.end(body)
}

function resolveRoute(pathname, method) {
  const normalized = pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')
  const exact = exactRoutes.get(normalized)
  if (exact?.[method]) return { handler: exact[method], params: {} }
  const social = normalized.match(/^social\/([^/]+)\/(start|callback|disconnect)$/)
  if (social) {
    const action = social[2]
    const module = action === 'start' ? socialStart : action === 'callback' ? socialCallback : socialDisconnect
    const handler = method === 'GET' ? module.onRequestGet : method === 'POST' ? module.onRequestPost : undefined
    if (handler) return { handler, params: { provider: social[1] } }
  }
  return null
}

export default async function handler(req, res) {
  try {
    const url = new URL(requestUrl(req))
    if (url.pathname === '/api/config.js' && (req.method || 'GET') === 'GET') {
      const config = {
        supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
        siteUrl: process.env.SITE_URL || process.env.VITE_SITE_URL || `${url.protocol}//${url.host}`,
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      return res.end(`window.__CREATOROS_CONFIG__=${JSON.stringify(config)};`)
    }
    const route = resolveRoute(url.pathname, req.method || 'GET')
    if (!route) {
      res.statusCode = 404
      return res.end(JSON.stringify({ error: 'API route not found.' }))
    }
    const request = await toWebRequest(req)
    const response = await route.handler({ request, env: process.env, params: route.params })
    return sendWebResponse(response, res)
  } catch (error) {
    console.error('CreatorOS API error', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'Unexpected server error.' }))
  }
}
