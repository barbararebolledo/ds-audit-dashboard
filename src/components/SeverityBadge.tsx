import type { Severity } from '../data/types'
import { severityColor } from '../data/loader'

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
