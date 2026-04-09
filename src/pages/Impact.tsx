import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuditSystem } from '../data/types'
import { resolveTopBlockers, getMergedFinding, clusterValueFraming } from '../data/loader'
import { LabelCaps } from '../components'

function RangeSlider({ id, min, max, value, step, onChange }: {
  id: string; min: number; max: number; value: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      id={id}
      min={min}
      max={max}
      value={value}
      step={step}
      onChange={onChange}
      className="w-full"
      style={{
        background: `linear-gradient(to right, #F5E9C8 0%, #F5E9C8 ${pct}%, rgba(245, 233, 200, 0.15) ${pct}%, rgba(245, 233, 200, 0.15) 100%)`,
      }}
    />
  )
}

export default function Impact({ system }: { system: AuditSystem }) {
  const navigate = useNavigate()
  const { audit, editorial } = system
  const [teamSize, setTeamSize] = useState(12)
  const [components, setComponents] = useState(18)
  const [rate, setRate] = useState(75)

  const baseProduct = 16200
  const targetCc = 45600
  const targetTr = 32400
  const targetPd = 28800

  const currentProduct = teamSize * components * rate
  const costCc = Math.round((targetCc / baseProduct) * currentProduct)
  const costTr = Math.round((targetTr / baseProduct) * currentProduct)
  const costPd = Math.round((targetPd / baseProduct) * currentProduct)
  const total = costCc + costTr + costPd

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)

  const formatTotal = (val: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
      .format(val).replace(/[^\d.,]/g, '').trim()

  // Connect top blockers to cost categories
  const blockers = resolveTopBlockers(audit).map(f => getMergedFinding(f, editorial))

  // Value framings from editorial
  const correctionFraming = clusterValueFraming('3_documentation_and_intent', editorial) ?? 'Rework stemming from misunderstood component intent during handoff.'
  const themeFraming = clusterValueFraming('1_token_and_variable_system', editorial) ?? 'Manual updates required when brand changes occur.'
  const parityFraming = clusterValueFraming('6_design_to_code_parity', editorial) ?? 'Time spent fixing misalignments between Figma and code.'

  const costCards = [
    {
      cost: costCc,
      title: 'Correction Cycles',
      description: correctionFraming,
      iconBg: '#2A1616',
      iconColor: '#FF6B6B',
      iconBorder: 'rgba(255, 107, 107, 0.2)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      ),
      topBlocker: blockers.find(b => b.dimension.includes('3.1') || b.dimension.includes('description')),
    },
    {
      cost: costTr,
      title: 'Theme Rework',
      description: themeFraming,
      iconBg: '#2D2312',
      iconColor: '#FFB84C',
      iconBorder: 'rgba(255, 184, 76, 0.2)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
      topBlocker: blockers.find(b => b.dimension.includes('1.6') || b.dimension.includes('token')),
    },
    {
      cost: costPd,
      title: 'Parity Defects',
      description: parityFraming,
      iconBg: '#1A2332',
      iconColor: '#4C8BFF',
      iconBorder: 'rgba(76, 139, 255, 0.2)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      topBlocker: blockers.find(b => b.dimension.includes('6.6') || b.dimension.includes('parity')),
    },
  ]

  return (
    <main className="w-full">
      <div className="mb-10">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight mb-3" style={{ color: '#F5E9C8' }}>Impact Calculator</h1>
        <p className="text-[16px] max-w-[42rem] m-0" style={{ color: 'rgba(245, 233, 200, 0.5)' }}>
          Projected costs and savings from remediating the {system.name} design system based on current AI-readiness audit scores.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 w-full">
        {/* Team Parameters */}
        <section className="col-span-4 flex flex-col justify-between p-10" style={{ borderRadius: '32px', backgroundColor: '#111111', border: '1px solid rgba(245, 233, 200, 0.15)' }}>
          <div>
            <div className="flex items-center gap-3 mb-10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <LabelCaps style={{ letterSpacing: '0.1em', color: '#F5E9C8', opacity: 1 }}>Team Parameters</LabelCaps>
            </div>
            <div className="flex flex-col gap-10">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <LabelCaps>Engineering & Design Team Size</LabelCaps>
                  <span className="text-2xl font-medium tracking-tight">{teamSize}</span>
                </div>
                <RangeSlider id="team-size" min={1} max={30} value={teamSize} step={1} onChange={e => setTeamSize(parseInt(e.target.value))} />
              </div>
              <div>
                <div className="flex justify-between items-end mb-4">
                  <LabelCaps>Components Built / Sprint</LabelCaps>
                  <span className="text-2xl font-medium tracking-tight">{components}</span>
                </div>
                <RangeSlider id="components" min={5} max={50} value={components} step={1} onChange={e => setComponents(parseInt(e.target.value))} />
              </div>
              <div>
                <div className="flex justify-between items-end mb-4">
                  <LabelCaps>Average Blended Hourly Rate</LabelCaps>
                  <span className="text-2xl font-medium tracking-tight">{'\u20AC'}{rate}</span>
                </div>
                <RangeSlider id="rate" min={30} max={200} value={rate} step={5} onChange={e => setRate(parseInt(e.target.value))} />
              </div>
            </div>
          </div>
        </section>

        {/* Total Savings */}
        <section className="col-span-8 flex flex-col justify-between p-12 relative overflow-hidden" style={{ borderRadius: '32px', backgroundColor: '#F5E9C8', color: '#0B0B0B' }}>
          <div className="relative z-10">
            <div className="flex justify-between items-start gap-6 mb-8">
              <div>
                <h2 className="text-[12px] uppercase tracking-[0.08em] font-semibold mb-2" style={{ opacity: 0.8 }}>Total Projected Annual Savings</h2>
                <p className="text-[15px] max-w-[24rem] m-0" style={{ opacity: 0.7 }}>
                  Calculated estimate if all foundational and post-migration blockers are remediated.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap" style={{ backgroundColor: 'rgba(11,11,11,0.05)', border: '1px solid rgba(11,11,11,0.1)' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#16a34a' }} />
                <span className="text-[13px] font-medium" style={{ opacity: 0.9 }}>High Confidence Estimate</span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-baseline gap-2">
                <span className="text-[clamp(2rem,3vw,2.5rem)] font-medium" style={{ transform: 'translateY(-1rem)', opacity: 0.8 }}>{'\u20AC'}</span>
                <span className="value-transition text-[clamp(4rem,8vw,7rem)] leading-[0.9] font-medium tracking-tight" style={{ color: '#0B0B0B' }}>
                  {formatTotal(total)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 relative z-10" style={{ borderTop: '1px solid rgba(11,11,11,0.15)' }}>
            <div className="flex justify-between items-end gap-6">
              <div className="w-full max-w-[28rem]">
                <div className="flex justify-between text-[13px] font-medium mb-3">
                  <span style={{ opacity: 0.7 }}>Current Audit Score: {audit.summary.overall_score.toFixed(1)}%</span>
                  <span>Target: 85.0%+</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: 'rgba(11,11,11,0.1)' }}>
                  <div className="h-full relative" style={{ backgroundColor: '#0B0B0B', width: `${audit.summary.overall_score}%` }}>
                    <div className="absolute right-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: '#F5E9C8' }} />
                  </div>
                  <div className="h-full" style={{ borderTop: '1px dashed #0B0B0B', borderBottom: '1px dashed #0B0B0B', opacity: 0.3, width: `${85 - audit.summary.overall_score}%` }} />
                </div>
              </div>
              <button
                onClick={() => navigate('/remediation')}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full text-[14px] font-medium cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: '#0B0B0B', color: '#F5E9C8', border: 'none' }}
              >
                View Remediation Plan
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Cost Breakdown Cards */}
        {costCards.map(card => (
          <section key={card.title} className="card-hover col-span-4 flex flex-col justify-between p-10" style={{ borderRadius: '32px', backgroundColor: '#111111', border: '1px solid rgba(245, 233, 200, 0.15)' }}>
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-8" style={{ backgroundColor: card.iconBg, color: card.iconColor, border: `1px solid ${card.iconBorder}` }}>
                {card.icon}
              </div>
              <div className="value-transition text-[clamp(2rem,3vw,2.75rem)] font-medium leading-none tracking-tight mb-4" style={{ color: '#F5E9C8' }}>
                {formatCurrency(card.cost)}
              </div>
              <h3 className="text-[18px] font-medium mb-3 m-0" style={{ color: '#F5E9C8' }}>{card.title}</h3>
              <p className="text-[14px] leading-relaxed m-0" style={{ color: 'rgba(245, 233, 200, 0.5)' }}>{card.description}</p>
            </div>
            {card.topBlocker && (
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(245, 233, 200, 0.075)' }}>
                <LabelCaps>Top Blocker: {card.topBlocker.id}</LabelCaps>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
