import { useState } from 'react'
import { SeverityDot } from './SeverityDot'

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
