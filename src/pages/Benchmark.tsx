import type { AuditSystem } from '../data/types'
import { CLUSTER_ORDER, clusterNarrative } from '../data/loader'
import { LabelCaps } from '../components'

function TiedBar({ label, score, pct }: { label: string; score: string; pct: number }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[14px] font-medium" style={{ color: '#CCCCCC' }}>{label}</span>
        <span className="text-[11px] uppercase tracking-wider" style={{ color: '#888888' }}>Tied · {score}</span>
      </div>
      <div className="h-8 rounded-full overflow-hidden flex relative" style={{ backgroundColor: '#111111' }}>
        <div className="absolute left-1/2 top-0 bottom-0 w-px z-10" style={{ backgroundColor: '#333333' }} />
        <div className="flex-1 flex justify-end items-center" style={{ paddingRight: `${100 - pct}%` }}>
          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#444444' }} />
        </div>
        <div className="flex-1 flex justify-start items-center" style={{ paddingLeft: `${100 - pct}%` }}>
          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#444444' }} />
        </div>
      </div>
    </div>
  )
}

function ComparisonBar({ label, muiScore, carbonScore, muiName, carbonName }: {
  label: string; muiScore: number; carbonScore: number; muiName: string; carbonName: string
}) {
  const delta = muiScore - carbonScore
  const absDelta = Math.abs(delta).toFixed(1)
  const leader = delta > 0 ? muiName : delta < 0 ? carbonName : null
  const isTied = Math.abs(delta) < 0.5

  if (isTied) {
    return <TiedBar label={label} score={`${muiScore.toFixed(1)}%`} pct={muiScore} />
  }

  const muiLeads = delta > 0
  const muiBarH = muiLeads ? 'h-3' : 'h-2'
  const carbonBarH = muiLeads ? 'h-2' : 'h-3'
  const muiColor = '#F5E9C8'
  const carbonColor = '#888888'

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[14px] font-medium" style={{ color: '#CCCCCC' }}>{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-medium" style={{ color: '#F5E9C8' }}>{muiScore.toFixed(1)}%</span>
          <span className="text-[11px] uppercase tracking-wider" style={{ color: '#888888' }}>vs</span>
          <span className="text-[14px] font-medium" style={{ color: '#888888' }}>{carbonScore.toFixed(1)}%</span>
          <span
            className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{
              backgroundColor: muiLeads ? 'rgba(245, 233, 200, 0.1)' : 'rgba(136, 136, 136, 0.1)',
              color: muiLeads ? '#F5E9C8' : '#888888',
            }}
          >
            +{absDelta} {leader}
          </span>
        </div>
      </div>
      <div className="h-8 rounded-full overflow-hidden flex relative" style={{ backgroundColor: '#111111' }}>
        <div className="absolute left-1/2 top-0 bottom-0 w-px z-10" style={{ backgroundColor: '#333333' }} />
        <div className="flex-1 flex justify-end items-center" style={{ paddingRight: `${100 - muiScore}%` }}>
          <div className={`${muiBarH} rounded-full`} style={{ width: `${muiScore}%`, backgroundColor: muiColor }} />
        </div>
        <div className="flex-1 flex justify-start items-center" style={{ paddingLeft: `${100 - carbonScore}%` }}>
          <div className={`${carbonBarH} rounded-full`} style={{ width: `${carbonScore}%`, backgroundColor: carbonColor }} />
        </div>
      </div>
    </div>
  )
}

function ProfileCard({ system, leads, color }: {
  system: AuditSystem; leads: { label: string; value: string; description: string }[]; color: string
}) {
  return (
    <div className="p-8" style={{ backgroundColor: '#1A1A1A', borderRadius: '28px', border: '1px solid #222222' }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <h3 className="text-xl font-medium m-0" style={{ color }}>{system.name} Profile</h3>
      </div>
      <div className="flex flex-col gap-4">
        {leads.map((item, i) => (
          <div key={i}>
            {i > 0 && <div className="w-full h-px mb-4" style={{ backgroundColor: 'rgba(51,51,51,0.5)' }} />}
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[15px] font-medium" style={{ color: 'white' }}>{item.label}</span>
              <span className="text-[16px] font-medium" style={{ color }}>{item.value}</span>
            </div>
            <p className="text-[13px] leading-relaxed m-0" style={{ color: '#888888' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Benchmark({ systems }: { systems: AuditSystem[] }) {
  const sys1 = systems[0] // MUI
  const sys2 = systems[1] // Carbon
  if (!sys1 || !sys2) return <p>Need at least two systems for benchmark comparison.</p>

  const a1 = sys1.audit
  const a2 = sys2.audit
  const delta = a1.summary.overall_score - a2.summary.overall_score
  const leader = delta > 0 ? sys1.name : delta < 0 ? sys2.name : 'Tied'

  // Cluster comparisons
  const clusterComparisons = CLUSTER_ORDER
    .filter(key => a1.clusters[key] && a2.clusters[key])
    .map(key => ({
      key,
      label: a1.clusters[key].cluster_name,
      muiScore: a1.summary.cluster_scores[key] ?? 0,
      carbonScore: a2.summary.cluster_scores[key] ?? 0,
    }))

  // Find where each system leads
  const sys1Leads = clusterComparisons.filter(c => c.muiScore - c.carbonScore > 2)
  const sys2Leads = clusterComparisons.filter(c => c.carbonScore - c.muiScore > 2)

  // Shared blockers: findings with same dimension + blocker severity in both
  const sys1BlockerDims = new Set(a1.findings.filter(f => f.severity === 'blocker').map(f => f.dimension))
  const sharedBlockers = a2.findings.filter(f => f.severity === 'blocker' && sys1BlockerDims.has(f.dimension))

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header>
        <div className="flex items-baseline gap-6 mb-4">
          <h1 className="text-[44px] leading-tight font-light tracking-tight m-0" style={{ color: 'white' }}>Benchmark Comparison</h1>
          <span className="text-[17px] font-light" style={{ color: '#888888' }}>{sys1.name} vs {sys2.name}</span>
        </div>
        <p className="text-[17px] leading-relaxed max-w-2xl mb-6 m-0" style={{ color: '#888888' }}>
          Two systems only {Math.abs(delta).toFixed(1)} points apart overall, with genuinely different cluster profiles.
        </p>
        <div className="flex gap-4">
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#888888' }}>Same methodology, same scoring model</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(245, 233, 200, 0.1)', border: '1px solid rgba(245, 233, 200, 0.3)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F5E9C8' }} />
            <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#F5E9C8' }}>
              {sys1.name}: {a1.summary.overall_score.toFixed(1)}% ({a1.summary.blocker_count} blockers)
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(136, 136, 136, 0.1)', border: '1px solid rgba(136, 136, 136, 0.3)' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#888888' }} />
            <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#888888' }}>
              {sys2.name}: {a2.summary.overall_score.toFixed(1)}% ({a2.summary.blocker_count} blockers)
            </span>
          </div>
        </div>
      </header>

      {/* Summary Card */}
      <div className="p-8 mb-0" style={{ backgroundColor: '#1A1A1A', borderRadius: '32px', border: '1px solid #222222' }}>
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center pr-8" style={{ borderRight: '1px solid rgba(51,51,51,0.5)' }}>
            <LabelCaps className="mb-2" style={{ color: '#F5E9C8' }}>{sys1.name}</LabelCaps>
            <div className="text-[64px] leading-none font-light tracking-tight mb-2" style={{ color: '#F5E9C8' }}>{a1.summary.overall_score.toFixed(1)}%</div>
            <div className="text-[13px]" style={{ color: '#888888' }}>Overall Score · {a1.summary.blocker_count} blockers</div>
          </div>
          <div className="text-center flex flex-col items-center justify-center">
            <LabelCaps className="mb-2" style={{ color: '#888888' }}>Delta</LabelCaps>
            <div className="text-[32px] font-light tracking-tight" style={{ color: 'white' }}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}</div>
            <div className="text-[13px]" style={{ color: '#888888' }}>{leader} leads by {Math.abs(delta).toFixed(1)} points</div>
          </div>
          <div className="text-center pl-8">
            <LabelCaps className="mb-2" style={{ color: '#888888' }}>{sys2.name}</LabelCaps>
            <div className="text-[64px] leading-none font-light tracking-tight mb-2" style={{ color: '#888888' }}>{a2.summary.overall_score.toFixed(1)}%</div>
            <div className="text-[13px]" style={{ color: '#888888' }}>Overall Score · {a2.summary.blocker_count} blockers</div>
          </div>
        </div>
      </div>

      {/* Diverging Bar Section */}
      <div className="p-10" style={{ backgroundColor: '#1A1A1A', borderRadius: '32px', border: '1px solid #222222' }}>
        <div className="flex justify-between items-center mb-8">
          <LabelCaps style={{ color: '#888888' }}>Cluster-by-Cluster Comparison</LabelCaps>
          <div className="flex gap-6 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F5E9C8' }} />
              <span style={{ color: '#CCCCCC' }}>{sys1.name} leads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#888888' }} />
              <span style={{ color: '#CCCCCC' }}>{sys2.name} leads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#444444' }} />
              <span style={{ color: '#CCCCCC' }}>Tied / Neutral</span>
            </div>
          </div>
        </div>
        {clusterComparisons.map(c => (
          <ComparisonBar
            key={c.key}
            label={c.label}
            muiScore={c.muiScore}
            carbonScore={c.carbonScore}
            muiName={sys1.name}
            carbonName={sys2.name}
          />
        ))}
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-2 gap-8">
        <ProfileCard
          system={sys1}
          color="#F5E9C8"
          leads={[
            ...sys1Leads.map(c => ({
              label: c.label,
              value: `+${(c.muiScore - c.carbonScore).toFixed(1)} lead`,
              description: clusterNarrative(a1.clusters[c.key], c.key, sys1.editorial),
            })),
            {
              label: 'Blocker Efficiency',
              value: `${a1.summary.blocker_count} vs ${a2.summary.blocker_count}`,
              description: `Fewer critical blockers despite similar overall score.`,
            },
          ]}
        />
        <ProfileCard
          system={sys2}
          color="#888888"
          leads={[
            ...sys2Leads.map(c => ({
              label: c.label,
              value: `+${(c.carbonScore - c.muiScore).toFixed(1)} lead`,
              description: clusterNarrative(a2.clusters[c.key], c.key, sys2.editorial),
            })),
            {
              label: `${sys2.name}-Only Blockers`,
              value: `${a2.summary.blocker_count - sharedBlockers.length} unique`,
              description: 'Blockers not shared with the other system.',
            },
          ]}
        />
      </div>

      {/* Shared Blockers */}
      {sharedBlockers.length > 0 && (
        <div className="p-8" style={{ backgroundColor: '#1A1A1A', borderRadius: '28px', border: '1px solid #222222' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(229, 161, 88, 0.1)', border: '1px solid rgba(229, 161, 88, 0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E5A158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="text-xl font-medium m-0" style={{ color: '#E5A158' }}>Shared Blockers ({sharedBlockers.length})</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {sharedBlockers.map(b => (
              <div key={b.id} className="flex items-start gap-3">
                <span className="text-[14px]" style={{ color: '#CCCCCC' }}>{b.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
