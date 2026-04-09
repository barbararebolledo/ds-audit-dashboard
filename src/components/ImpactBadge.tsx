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
