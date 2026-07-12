import { supabase } from './supabase'

export type IntegrationProvider = 'youtube' | 'instagram' | 'tiktok' | 'x'

export type IntegrationStatus = {
  provider: IntegrationProvider
  label: string
  configured: boolean
  connected: boolean
  approved: boolean
  account_name?: string | null
  account_id?: string | null
  expires_at?: string | null
  detail: string
}

async function accessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken()
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(path, { ...init, headers })
  const body = await response.json().catch(() => ({ error: `Request failed with ${response.status}` }))
  if (!response.ok) throw new Error(body.error || body.message || `Request failed with ${response.status}`)
  return body as T
}

export function getIntegrationStatus() {
  return apiRequest<{ integrations: IntegrationStatus[]; services: Record<string, boolean> }>('/api/integrations/status')
}

export async function startIntegration(provider: IntegrationProvider) {
  const result = await apiRequest<{ authorization_url: string }>(`/api/social/${provider}/start`, { method: 'POST' })
  window.location.href = result.authorization_url
}

export function disconnectIntegration(provider: IntegrationProvider) {
  return apiRequest<{ ok: true }>(`/api/social/${provider}/disconnect`, { method: 'POST' })
}

export type PublishPayload = {
  providers: IntegrationProvider[]
  title: string
  caption: string
  media_url?: string
  media_type?: 'image' | 'video'
  privacy?: 'public' | 'unlisted' | 'private'
  scheduled_for?: string | null
  tiktok_mode?: 'direct' | 'draft'
}


export async function uploadPublishingMedia(file: File, onProgress?: (value: number) => void) {
  const token = await accessToken()
  const form = new FormData()
  form.set('file', file)
  onProgress?.(15)
  const response = await fetch('/api/media/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form })
  onProgress?.(85)
  const body = await response.json().catch(() => ({ error: `Upload failed with ${response.status}` }))
  if (!response.ok) throw new Error(body.error || 'Media upload failed.')
  onProgress?.(100)
  return body as { url: string; key: string; content_type: string; size: number }
}

export function publishContent(payload: PublishPayload) {
  return apiRequest<{ publication_id: string; results: Array<{ provider: string; ok: boolean; status: string; external_id?: string; error?: string }> }>('/api/publish', {
    method: 'POST', body: JSON.stringify(payload),
  })
}

export function createCheckout(plan: 'pro_monthly' | 'pro_annual') {
  return apiRequest<{ url: string }>('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
}

export function createBillingPortal() {
  return apiRequest<{ url: string }>('/api/billing/portal', { method: 'POST' })
}

export function requestDataExport() {
  return apiRequest<{ download_url?: string; message: string }>('/api/account/export', { method: 'POST' })
}

export function requestAccountDeletion(confirm: string) {
  return apiRequest<{ ok: true; message: string }>('/api/account/delete', { method: 'POST', body: JSON.stringify({ confirm }) })
}

export function reportContent(input: { target_type: string; target_id: string; reason: string; details?: string }) {
  return apiRequest<{ ok: true; report_id: string }>('/api/moderation/report', { method: 'POST', body: JSON.stringify(input) })
}
