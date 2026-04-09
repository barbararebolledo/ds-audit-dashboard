import type { Severity } from '../data/types'
import { severityColor } from '../data/loader'

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
