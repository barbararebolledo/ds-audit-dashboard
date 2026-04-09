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
