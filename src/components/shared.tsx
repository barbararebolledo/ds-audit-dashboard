import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { AuditSystem, Severity } from '../data/types'
import { severityColor } from '../data/loader'

// ── LabelCaps ──

export function LabelCaps({ children, className = '', style }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <p
      className={`text-[11px] uppercase tracking-[0.08em] opacity-60 font-medium m-0 ${className}`}
      style={style}
    >
      {children}
    </p>
  )
}

// ── ProgressBar ──

export function ProgressBar({ width, color }: { width: number; color: string }) {
  return (
    <div className="w-full h-1 rounded-sm overflow-hidden" style={{ backgroundColor: 'rgba(245, 233, 200, 0.1)' }}>
      <div
        className="h-full rounded-sm"
        style={{ width: `${Math.min(100, Math.max(0, width))}%`, backgroundColor: color, transition: 'width 0.5s ease-out' }}
      />
    </div>
  )
}

// ── SeverityDot ──

export function SeverityDot({ severity, size = 10 }: { severity: Severity | null | string; size?: number }) {
  const color = severityColor(severity)
  return (
    <div
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: severity === 'blocker' ? `0 0 8px ${color}` : undefined,
      }}
    />
  )
}

// ── SeverityBadge ──

export function SeverityBadge({ severity }: { severity: Severity | null | string }) {
  const color = severityColor(severity)
  const label = severity ?? 'N/A'
  return (
    <span
      className="px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider inline-flex items-center gap-1.5"
      style={{
        border: `1px solid ${color}40`,
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  )
}

// ── BlockerCard ──

export function BlockerCard({ code, category, description, onClick }: {
  code: string
  category: string
  description: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="p-6 cursor-pointer"
      style={{
        backgroundColor: hovered ? '#1A1A1A' : 'transparent',
        border: '1px solid rgba(245, 233, 200, 0.1)',
        borderRadius: '24px',
        transition: 'background-color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <SeverityDot severity="blocker" />
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-widest font-mono" style={{ opacity: 0.6 }}>{code}</span>
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm" style={{ opacity: 0.5, backgroundColor: '#161616' }}>{category}</span>
          </div>
          <p className="text-[14px] leading-relaxed font-medium m-0">{description}</p>
        </div>
      </div>
    </div>
  )
}

// ── DimensionScoreCard ──

export function DimensionScoreCard({ number, title, scorePercent, color, description, onClick }: {
  number: number
  title: string
  scorePercent: number
  color: string
  description: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="p-6 flex flex-col cursor-pointer"
      style={{
        backgroundColor: hovered ? '#1A1A1A' : '#161616',
        borderRadius: '24px',
        transition: 'background-color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="text-[11px] uppercase tracking-[0.08em] font-medium" style={{ opacity: 0.5 }}>{number}. {title}</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <div className="mb-5">
        <div className="text-[32px] font-medium leading-none mb-4" style={color === '#FF6B6B' ? { color } : {}}>
          {scorePercent.toFixed(1)}%
        </div>
        <ProgressBar width={scorePercent} color={color} />
      </div>
      <p className="text-[13px] leading-relaxed mt-auto m-0" style={{ opacity: 0.7 }}>{description}</p>
    </div>
  )
}

// ── FilterButton ──

export function FilterButton({ label, isActive, onClick }: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return isActive ? (
    <button onClick={onClick} className="px-5 py-2 rounded-full text-[13px] font-medium" style={{ backgroundColor: '#F5E9C8', color: '#0C0C0C' }}>
      {label}
    </button>
  ) : (
    <button onClick={onClick} className="px-5 py-2 rounded-full text-[13px]" style={{ border: '1px solid rgba(245, 233, 200, 0.2)', color: '#F5E9C8', background: 'transparent' }}>
      {label}
    </button>
  )
}

// ── ImpactBadge ──

export function ImpactBadge({ value, color }: { value: string; color: 'green' | 'amber' | 'cream' }) {
  const colors = {
    green: { text: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
    amber: { text: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
    cream: { text: '#F5E9C8', bg: 'rgba(245,233,200,0.05)' },
  }
  const c = colors[color]
  return (
    <div className="flex items-center gap-1 font-medium text-[13px] px-2 py-1 rounded-md" style={{ color: c.text, backgroundColor: c.bg }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
      {value}
    </div>
  )
}

// ── Header / Nav ──

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

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
        style={{ backgroundColor: '#F5E9C8', color: '#0C0C0C' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </header>
  )
}

// ── Breadcrumb ──

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className="flex items-center gap-2 text-[12px] mb-6" style={{ opacity: 0.5 }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {item.to ? (
            <Link to={item.to} className="no-underline hover:opacity-80" style={{ color: '#F5E9C8' }}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}
