import { useState } from 'react'
import { ProgressBar } from './ProgressBar'

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
        <div className="text-[32px] font-medium leading-none mb-4" style={{ color }}>
          {scorePercent.toFixed(1)}%
        </div>
        <ProgressBar width={scorePercent} color={color} />
      </div>
      <p className="text-[13px] leading-relaxed mt-auto m-0" style={{ opacity: 0.7 }}>{description}</p>
    </div>
  )
}
