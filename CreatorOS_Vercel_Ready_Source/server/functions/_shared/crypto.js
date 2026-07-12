function bytesToBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
function base64ToBytes(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}
async function keyFromSecret(secret) {
  if (!secret || secret.length < 24) throw new Error('TOKEN_ENCRYPTION_KEY must be at least 24 characters.')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}
export async function encryptJson(value, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await keyFromSecret(secret)
  const encoded = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded))
  return `${bytesToBase64(iv)}.${bytesToBase64(ciphertext)}`
}
export async function decryptJson(value, secret) {
  const [ivRaw, cipherRaw] = String(value || '').split('.')
  if (!ivRaw || !cipherRaw) throw new Error('Encrypted token payload is invalid.')
  const key = await keyFromSecret(secret)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(ivRaw) }, key, base64ToBytes(cipherRaw))
  return JSON.parse(new TextDecoder().decode(plaintext))
}
export function randomToken(length = 32) {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(length))).replace(/[+/=]/g, '').slice(0, length * 2)
}
export async function pkceChallenge(verifier) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  return bytesToBase64(digest).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
