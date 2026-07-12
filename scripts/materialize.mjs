import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const encoded = readFileSync('creatoros-dist.tar.gz.b64', 'utf8').trim()
const archive = '/tmp/creatoros-dist.tar.gz'
writeFileSync(archive, Buffer.from(encoded, 'base64'))
rmSync('dist', { recursive: true, force: true })
const result = spawnSync('tar', ['-xzf', archive, '-C', '.'], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status || 1)
console.log('CreatorOS production website prepared for Vercel.')
