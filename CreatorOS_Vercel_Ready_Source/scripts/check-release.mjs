import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const required = [
  'dist/index.html', 'vercel.json', 'api/[...path].js',
  'supabase/schema.sql', 'server/functions/api/health.js', 'server/functions/api/publish.js',
  'server/functions/api/stripe/webhook.js', 'server/functions/api/account/delete.js',
  'CUSTOMER_RELEASE_SETUP.md', 'VERCEL_DEPLOYMENT.md', 'GO_LIVE_CHECKLIST.md',
]
const missing = required.filter(path => !existsSync(join(root, path)))
if (missing.length) {
  console.error('Missing required release files:\n' + missing.map(item => `- ${item}`).join('\n'))
  process.exit(1)
}

const ignored = new Set(['node_modules', 'dist', '.vercel', '.git'])
const files = []
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue
    const full = join(dir, entry)
    const info = statSync(full)
    if (info.isDirectory()) walk(full)
    else files.push(full)
  }
}
walk(root)

const secretPatterns = [
  /sk_live_[A-Za-z0-9]+/g,
  /whsec_[A-Za-z0-9]+/g,
  /eyJ[A-Za-z0-9_-]{60,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
]
const hits = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) hits.push(relative(root, file))
    pattern.lastIndex = 0
  }
}
if (hits.length) {
  console.error('Possible production secret detected in:\n' + [...new Set(hits)].map(item => `- ${item}`).join('\n'))
  process.exit(1)
}

console.log(`Release structure OK: ${required.length} required files found; ${files.length} source/config files scanned; no obvious production secrets detected.`)
