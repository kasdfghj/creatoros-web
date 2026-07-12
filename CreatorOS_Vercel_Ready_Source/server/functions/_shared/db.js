export async function db(env, path, init = {}) {
  const headers = new Headers(init.headers)
  headers.set('apikey', env.SUPABASE_SERVICE_ROLE_KEY)
  headers.set('Authorization', `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Database request failed (${response.status}): ${text.slice(0, 300)}`)
  }
  if (response.status === 204) return null
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export async function insert(env, table, value, select = '*') {
  const result = await db(env, `${table}?select=${encodeURIComponent(select)}`, {
    method: 'POST', body: JSON.stringify(value), headers: { Prefer: 'return=representation' },
  })
  return Array.isArray(result) ? result[0] : result
}

export async function update(env, table, query, value, select = '*') {
  const result = await db(env, `${table}?${query}&select=${encodeURIComponent(select)}`, {
    method: 'PATCH', body: JSON.stringify(value), headers: { Prefer: 'return=representation' },
  })
  return Array.isArray(result) ? result[0] : result
}
