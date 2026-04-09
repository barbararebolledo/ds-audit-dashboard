import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuditSystem } from '../data/types'
import { clusterValueFraming } from '../data/loader'
import { LabelCaps } from '../components'

// ── Input components ──

function NumberInput({ id, label, value, min, max, suffix, onChange }: {
  id: string; label: string; value: number; min: number; max: number; suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-[12px] uppercase tracking-[0.08em] font-medium" style={{ opacity: 0.6, color: '#F5E9C8' }}>{label}</label>
        <div className="flex items-center gap-1">
          {suffix && <span className="text-[13px] font-medium" style={{ opacity: 0.5 }}>{suffix}</span>}
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={e => {
              const v = parseInt(e.target.value)
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
            }}
            className="w-20 text-right text-[18px] font-medium bg-transparent border-none outline-none"
            style={{ color: '#F5E9C8' }}
          />
        </div>
      </div>
    </div>
  )
}

function SliderInput({ id, label, value, min, max, step, unit, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step: number; unit?: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-[12px] uppercase tracking-[0.08em] font-medium" style={{ opacity: 0.6, color: '#F5E9C8' }}>{label}</label>
        <span className="text-[18px] font-medium" style={{ color: '#F5E9C8' }}>{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, #F5E9C8 0%, #F5E9C8 ${pct}%, rgba(245, 233, 200, 0.15) ${pct}%, rgba(245, 233, 200, 0.15) 100%)`,
        }}
      />
    </div>
  )
}

function InputSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <LabelCaps className="mb-5" style={{ color: '#F5E9C8', opacity: 0.4 }}>{title}</LabelCaps>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  )
}

// ── Formulas ──

function deriveAuditConstants(audit: AuditSystem['audit']) {
  // 3.1 undocumented rate (from cluster 3)
  const cluster3 = audit.clusters['3_documentation_readiness']
  const dim3_1 = cluster3
    ? Object.entries(cluster3.dimensions).find(([k]) => k.startsWith('3.1'))?.[1]
    : undefined
  const undocumentedRate = dim3_1
    ? 1 - (dim3_1.score ?? 0) / dim3_1.score_max
    : 0.75

  // Token architecture: cluster 1 score → flat token rate
  const cluster1Score = audit.summary.cluster_scores['1_token_and_variable_system'] ?? 58
  const flatTokenRate = 1 - cluster1Score / 100
  const flatTokenCount = Math.round(200 * flatTokenRate)
  const avgComponentsPerToken = 4
  const minutesPerTokenUpdate = 20

  // Parity gaps: dim 6.6 score
  const cluster6 = audit.clusters['6_design_to_code_parity']
  const dim6_6 = cluster6
    ? Object.entries(cluster6.dimensions).find(([k]) => k.startsWith('6.6'))?.[1]
    : undefined
  const parityGapRate = dim6_6
    ? 1 - (dim6_6.score ?? 0) / dim6_6.score_max
    : 1.0
  const componentCount = audit.summary.component_count ?? 500
  const undocumentedGapCount = Math.round(componentCount * parityGapRate * 0.05)
  const probabilityOfSurfacing = 0.3

  return {
    undocumentedRate,
    flatTokenCount,
    avgComponentsPerToken,
    minutesPerTokenUpdate,
    undocumentedGapCount,
    probabilityOfSurfacing,
  }
}

function calcCorrectionCost(
  componentsPerSprint: number,
  designers: number,
  undocumentedRate: number,
  minutesPerCorrection: number,
  sprintsPerYear: number,
  hourlyRate: number,
): number {
  const minutesPerSprint = componentsPerSprint * designers * undocumentedRate * minutesPerCorrection
  const annualHours = (minutesPerSprint * sprintsPerYear) / 60
  return Math.round(annualHours * hourlyRate)
}

function calcThemeCost(
  flatTokenCount: number,
  avgComponentsPerToken: number,
  minutesPerTokenUpdate: number,
  themeChangesPerYear: number,
  hourlyRate: number,
): number {
  const manualUpdatesPerChange = flatTokenCount * avgComponentsPerToken
  return Math.round(manualUpdatesPerChange * minutesPerTokenUpdate * (hourlyRate / 60) * themeChangesPerYear)
}

function calcParityCost(
  undocumentedGapCount: number,
  probabilityOfSurfacing: number,
  engineers: number,
  releasesPerYear: number,
  hourlyRate: number,
): number {
  const defectsPerRelease = undocumentedGapCount * probabilityOfSurfacing
  const avgHoursToFix = 2 * (engineers / 8)
  return Math.round(defectsPerRelease * avgHoursToFix * hourlyRate * releasesPerYear)
}

// ── Main component ──

export default function Impact({ system }: { system: AuditSystem }) {
  const navigate = useNavigate()
  const { audit, editorial } = system

  const [designers, setDesigners] = useState(5)
  const [engineers, setEngineers] = useState(8)
  const [componentsPerSprint, setComponentsPerSprint] = useState(20)
  const [minutesPerCorrection, setMinutesPerCorrection] = useState(10)
  const [sprintsPerYear, setSprintsPerYear] = useState(26)
  const [themeChangesPerYear, setThemeChangesPerYear] = useState(2)
  const [releasesPerYear, setReleasesPerYear] = useState(12)
  const [hourlyRate, setHourlyRate] = useState(80)

  const {
    undocumentedRate,
    flatTokenCount,
    avgComponentsPerToken,
    minutesPerTokenUpdate,
    undocumentedGapCount,
    probabilityOfSurfacing,
  } = deriveAuditConstants(audit)

  const correctionCost = calcCorrectionCost(componentsPerSprint, designers, undocumentedRate, minutesPerCorrection, sprintsPerYear, hourlyRate)
  const themeCost = calcThemeCost(flatTokenCount, avgComponentsPerToken, minutesPerTokenUpdate, themeChangesPerYear, hourlyRate)
  const parityCost = calcParityCost(undocumentedGapCount, probabilityOfSurfacing, engineers, releasesPerYear, hourlyRate)
  const total = correctionCost + themeCost + parityCost

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)

  const formatTotal = (val: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
      .format(val).replace(/[^\d.,]/g, '').trim()

  const correctionFraming = clusterValueFraming('3_documentation_readiness', editorial)
    ?? 'Projected hours spent on human corrections when AI agents lack component intent documentation.'
  const themeFraming = clusterValueFraming('1_token_and_variable_system', editorial)
    ?? 'Projected cost of manual updates when token architecture lacks semantic layers.'
  const parityFraming = clusterValueFraming('6_design_to_code_parity', editorial)
    ?? 'Projected cost of bugs from undocumented Figma-to-code mismatches surfacing in QA or production.'

  const quantifiedCards = [
    {
      cost: correctionCost,
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
    },
    {
      cost: themeCost,
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
    },
    {
      cost: parityCost,
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
        {/* Input sidebar */}
        <section className="col-span-4 p-8 flex flex-col" style={{ borderRadius: '32px', backgroundColor: '#111111', border: '1px solid rgba(245, 233, 200, 0.15)' }}>
          <div className="flex items-center gap-3 mb-8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, color: '#F5E9C8' }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <LabelCaps style={{ color: '#F5E9C8', opacity: 1 }}>Team Parameters</LabelCaps>
          </div>

          <InputSection title="Your Team">
            <NumberInput id="designers" label="Designers" value={designers} min={1} max={500} onChange={setDesigners} />
            <NumberInput id="engineers" label="Engineers" value={engineers} min={1} max={500} onChange={setEngineers} />
          </InputSection>

          <InputSection title="Your Workflow">
            <SliderInput id="components-per-sprint" label="Components / Sprint" value={componentsPerSprint} min={5} max={50} step={1} onChange={setComponentsPerSprint} />
            <SliderInput id="minutes-per-correction" label="Minutes / Correction" value={minutesPerCorrection} min={3} max={30} step={1} onChange={setMinutesPerCorrection} />
            <NumberInput id="sprints-per-year" label="Sprints / Year" value={sprintsPerYear} min={1} max={52} onChange={setSprintsPerYear} />
            <SliderInput id="theme-changes" label="Theme Changes / Year" value={themeChangesPerYear} min={0} max={6} step={1} onChange={setThemeChangesPerYear} />
            <NumberInput id="releases-per-year" label="Releases / Year" value={releasesPerYear} min={1} max={52} onChange={setReleasesPerYear} />
          </InputSection>

          <InputSection title="Your Costs">
            <NumberInput id="hourly-rate" label="Blended Hourly Rate" value={hourlyRate} min={30} max={300} suffix="€" onChange={setHourlyRate} />
          </InputSection>
        </section>

        {/* Total savings hero */}
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
                <span className="text-[13px] font-medium" style={{ opacity: 0.9 }}>Projected Estimate</span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-baseline gap-2">
                <span className="text-[clamp(2rem,3vw,2.5rem)] font-medium" style={{ transform: 'translateY(-1rem)', opacity: 0.8 }}>€</span>
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

        {/* Quantified impact cards */}
        {quantifiedCards.map(card => (
          <section key={card.title} className="card-hover col-span-3 flex flex-col justify-between p-8" style={{ borderRadius: '32px', backgroundColor: '#111111', border: '1px solid rgba(245, 233, 200, 0.15)' }}>
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: card.iconBg, color: card.iconColor, border: `1px solid ${card.iconBorder}` }}>
                {card.icon}
              </div>
              <div className="value-transition text-[clamp(1.75rem,2.5vw,2.25rem)] font-medium leading-none tracking-tight mb-3" style={{ color: '#F5E9C8' }}>
                {formatCurrency(card.cost)}
              </div>
              <h3 className="text-[16px] font-medium mb-2 m-0" style={{ color: '#F5E9C8' }}>{card.title}</h3>
              <p className="text-[13px] leading-relaxed m-0" style={{ color: 'rgba(245, 233, 200, 0.5)' }}>{card.description}</p>
            </div>
          </section>
        ))}

        {/* Token Efficiency card — staged / no cost */}
        <section className="col-span-3 flex flex-col justify-between p-8" style={{ borderRadius: '32px', backgroundColor: '#111111', border: '1px dashed rgba(245, 233, 200, 0.2)', opacity: 0.7 }}>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#162018', color: '#4ADB9E', border: '1px solid rgba(74, 219, 158, 0.2)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(74, 219, 158, 0.08)', border: '1px solid rgba(74, 219, 158, 0.2)', color: '#4ADB9E' }}>
                Emerging Category
              </span>
            </div>
            <h3 className="text-[16px] font-medium mb-2 m-0" style={{ color: '#F5E9C8' }}>Token Efficiency</h3>
            <p className="text-[13px] leading-relaxed m-0" style={{ color: 'rgba(245, 233, 200, 0.5)' }}>
              Token consumption is an operational and environmental cost — compute, energy, water for cooling. This category becomes quantifiable after the token efficiency experiment.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
