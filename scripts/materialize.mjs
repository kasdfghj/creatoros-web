import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const parts = readdirSync('release').filter(name => name.endsWith('.b64')).sort()
if (!parts.length) throw new Error('CreatorOS production bundle is missing.')
const encoded = parts.map(name => readFileSync(`release/${name}`, 'utf8').trim()).join('')
const archive = '/tmp/creatoros-dist.tar.gz'
writeFileSync(archive, Buffer.from(encoded, 'base64'))
rmSync('dist', { recursive: true, force: true })
const result = spawnSync('tar', ['-xzf', archive, '-C', '.'], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status || 1)
console.log('CreatorOS production website prepared for Vercel.')
