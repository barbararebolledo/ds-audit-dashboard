import { Link, useLocation } from 'react-router-dom'
import type { AuditSystem } from '../data/types'

const NAV_ITEMS = [
  { label: 'Overview', path: '/' },
  { label: 'Roadmap', path: '/remediation' },
  { label: 'Impact', path: '/impact' },
  { label: 'Benchmark', path: '/benchmark' },
  { label: 'Findings', path: '/findings' },
]

export function Header({ systems, selectedSystemId, onSystemChange }: {
  systems: AuditSystem[]
  selectedSystemId: string
  onSystemChange: (id: string) => void
}) {
  const location = useLocation()

  return (
    <header className="flex justify-between items-center pb-6" style={{ borderBottom: '1px solid rgba(245, 233, 200, 0.1)' }}>
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ opacity: 1 }}>
          AI Readiness Audit
        </span>
        <select
          value={selectedSystemId}
          onChange={e => onSystemChange(e.target.value)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-full cursor-pointer"
          style={{
            backgroundColor: 'rgba(245, 233, 200, 0.1)',
            color: '#F5E9C8',
            border: '1px solid rgba(245, 233, 200, 0.2)',
            appearance: 'auto',
          }}
        >
          {systems.map(s => (
            <option key={s.id} value={s.id} style={{ backgroundColor: '#161616', color: '#F5E9C8' }}>
              {s.name} {s.version}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex gap-10">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path === '/' && location.pathname === '/')
          return (
            <Link
              key={item.label}
              to={item.path}
              className="text-[14px] uppercase tracking-[0.05em] font-medium no-underline"
              style={{ color: '#F5E9C8', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.2s ease' }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

    </header>
  )
}
