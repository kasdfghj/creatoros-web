import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="CreatorOS home">
      <span className="brand-mark">C</span>
      {!compact && <span><strong>CreatorOS</strong><small>Build more. Create together.</small></span>}
    </Link>
  )
}
