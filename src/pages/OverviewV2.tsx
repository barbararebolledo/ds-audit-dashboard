import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuditSystem, RemediationItem } from '../data/types'
import {
  CLUSTER_ORDER,
  clusterNarrative,
  resolveTopBlockers,
  remediationByTier,
  getMergedFinding,
  getMergedRemItem,
  READINESS_LABELS,
  clusterValueFraming,
  tierDef,
} from '../data/loader'

// ── Design tokens ──
const C = {
  cream: '#F5E9C8',
  creamDim: 'rgba(245, 233, 200, 0.5)',
  creamFaint: 'rgba(245, 233, 200, 0.3)',
  creamVeryFaint: 'rgba(245, 233, 200, 0.1)',
  creamBorder: 'rgba(245, 233, 200, 0.12)',
  creamHover: 'rgba(245, 233, 200, 0.25)',
  panel: '#111111',
  panelHover: '#161616',
  red: '#FF6B6B',
  redBg: 'rgba(255, 107, 107, 0.08)',
  redBorder: 'rgba(255, 107, 107, 0.2)',
  redTrack: '#331111',
  amber: '#FFB84C',
  amberBg: 'rgba(255, 184, 76, 0.08)',
  amberBorder: 'rgba(255, 184, 76, 0.2)',
  green: '#4ADE80',
  greenBg: 'rgba(74, 222, 128, 0.08)',
  greenBorder: 'rgba(74, 222, 128, 0.2)',
  bg: '#0B0B0B',
} as const

type TabId = 'overview' | 'roadmap' | 'impact'
type OwnerFilter = 'All' | 'design' | 'engineering'

// ── Helpers ──
function scoreColor(s: number) { return s < 50 ? C.red : s < 75 ? C.amber : C.green }
function scoreGlow(s: number) { return s >= 75 ? `0 0 8px rgba(74, 222, 128, 0.4)` : s < 50 ? `0 0 8px rgba(255, 107, 107, 0.4)` : 'none' }
function scoreTrack(s: number) { return s < 50 ? C.redTrack : '#222' }

function ownerLabel(o: RemediationItem['ownership']) {
  return o === 'design' ? 'Design' : o === 'engineering' ? 'Eng' : 'Both'
}

function effortLabel(e: RemediationItem['effort_estimate']) {
  return e === 'hours' ? 'Hours' : e === 'days' ? 'Days' : 'Weeks'
}

function ownerMatchesFilter(ownership: RemediationItem['ownership'], filter: OwnerFilter) {
  if (filter === 'All') return true
  if (filter === 'design') return ownership === 'design' || ownership === 'both'
  return ownership === 'engineering' || ownership === 'both'
}

function fmt(val: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
}

function fmtTotal(val: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(val).replace(/[^\d.,]/g, '').trim()
}

// ── Impact formulas (adapted from Impact.tsx) ──
function deriveAuditConstants(audit: AuditSystem['audit']) {
  const cluster3 = audit.clusters['3_documentation_readiness']
  const dim3_1 = cluster3
    ? Object.entries(cluster3.dimensions).find(([k]) => k.startsWith('3.1'))?.[1]
    : undefined
  const undocumentedRate = dim3_1 ? 1 - (dim3_1.score ?? 0) / dim3_1.score_max : 0.75
  const cluster1Score = audit.summary.cluster_scores['1_token_and_variable_system'] ?? 58
  const flatTokenCount = Math.round(200 * (1 - cluster1Score / 100))
  const cluster6 = audit.clusters['6_design_to_code_parity']
  const dim6_6 = cluster6
    ? Object.entries(cluster6.dimensions).find(([k]) => k.startsWith('6.6'))?.[1]
    : undefined
  const parityGapRate = dim6_6 ? 1 - (dim6_6.score ?? 0) / dim6_6.score_max : 1.0
  const componentCount = audit.summary.component_count ?? 500
  return {
    undocumentedRate,
    flatTokenCount,
    avgComponentsPerToken: 4,
    minutesPerTokenUpdate: 20,
    undocumentedGapCount: Math.round(componentCount * parityGapRate * 0.05),
    probabilityOfSurfacing: 0.3,
  }
}

function calcCorrectionCost(c: number, d: number, rate: number, minCorr: number, sprints: number, hr: number) {
  return Math.round(c * d * rate * minCorr * sprints / 60 * hr)
}

function calcThemeCost(tokens: number, compsPerToken: number, minPerToken: number, changes: number, hr: number) {
  return Math.round(tokens * compsPerToken * minPerToken * (hr / 60) * changes)
}

function calcParityCost(gaps: number, prob: number, engineers: number, releases: number, hr: number) {
  return Math.round(gaps * prob * 2 * (engineers / 8) * hr * releases)
}

// ── Shared components ──

function LabelTag({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: C.creamDim,
      fontWeight: 500,
      ...style,
    }}>
      {children}
    </span>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        paddingBottom: 8,
        marginBottom: -1,
        color: active ? C.cream : C.creamDim,
        fontWeight: active ? 600 : 400,
        border: 'none',
        borderBottom: `2px solid ${active ? C.cream : 'transparent'}`,
        background: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  )
}

function ProgressBar({ score, color, track, glow }: { score: number; color: string; track: string; glow: string }) {
  return (
    <div style={{ width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: track }}>
      <div style={{ height: '100%', width: `${score}%`, backgroundColor: color, borderRadius: 2, boxShadow: glow }} />
    </div>
  )
}

// ── Range slider ──
function RangeSlider({ id, label, value, min, max, step, format, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <label htmlFor={id}>
          <LabelTag>{label}</LabelTag>
        </label>
        <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: C.cream, fontFamily: 'JetBrains Mono, monospace' }}>
          {format(value)}
        </span>
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
          background: `linear-gradient(to right, ${C.cream} 0%, ${C.cream} ${pct}%, rgba(245, 233, 200, 0.15) ${pct}%, rgba(245, 233, 200, 0.15) 100%)`,
        }}
      />
    </div>
  )
}

// ── Overview tab ──

function ScoreHeroCard({ system, onRoadmapClick }: { system: AuditSystem; onRoadmapClick: () => void }) {
  const { audit, editorial } = system
  const { summary } = audit
  const readiness = summary.phase_readiness
  const readinessLabel = readiness === 'fail'
    ? 'Not AI ready'
    : (READINESS_LABELS[readiness] ?? 'Not ready')
  const readinessColor = readiness === 'pass' ? C.green : readiness === 'conditional_pass' ? C.amber : C.red
  const readinessBg = readiness === 'pass' ? C.greenBg : readiness === 'conditional_pass' ? C.amberBg : C.redBg
  const readinessBorder = readiness === 'pass' ? C.greenBorder : readiness === 'conditional_pass' ? C.amberBorder : C.redBorder

  return (
    <section
      className="relative overflow-hidden group"
      style={{
        gridColumn: 'span 8',
        borderRadius: 32,
        backgroundColor: C.panel,
        border: `1px solid ${C.creamBorder}`,
        padding: '40px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 380,
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Top row: readiness/date (left) + status chip (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <LabelTag style={{ display: 'block', marginBottom: 4 }}>Overall System Readiness</LabelTag>
            <span style={{ fontSize: 14, color: C.cream, fontWeight: 500 }}>{audit.meta.audit_date}</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: readinessBg,
            border: `1px solid ${readinessBorder}`,
            padding: '8px 16px', borderRadius: 9999,
            boxShadow: `0 0 15px ${readinessBg}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: readinessColor }}>
              {readinessLabel}
            </span>
          </div>
        </div>

        {/* Score + narrative */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontSize: 'clamp(80px, 9vw, 140px)',
              lineHeight: 0.82,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: C.cream,
              fontFeatureSettings: '"tnum", "zero"',
            }}>
              {summary.overall_score.toFixed(1)}
            </span>
            <span style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 500, color: C.creamDim }}>%</span>
          </div>
          <div style={{ marginTop: 18, maxWidth: '72ch' }}>
            <h3 style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 16px 0', color: C.cream }}>
              {audit.meta.system_name}
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.65, margin: 0, color: 'rgba(245, 233, 200, 0.8)' }}>
              {audit.meta.system_name} scores {summary.overall_score.toFixed(1)}/100 with {summary.blocker_count} structural gap{summary.blocker_count !== 1 ? 's' : ''} that affect AI tool reliability.
            </p>
            {editorial.report?.executive_summary && (
              <p style={{ fontSize: 13, lineHeight: 1.65, margin: '12px 0 0 0', color: 'rgba(245, 233, 200, 0.68)' }}>
                {editorial.report.executive_summary}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function BlockersCard({ system }: { system: AuditSystem }) {
  const { audit, editorial } = system
  const topBlockers = resolveTopBlockers(audit).map(f => getMergedFinding(f, editorial)).slice(0, 3)

  return (
    <div
      className="card-hover"
      style={{
        borderRadius: 32,
        backgroundColor: C.panel,
        border: `1px solid ${C.creamBorder}`,
        padding: 32,
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Red ambient glow */}
      <div style={{ position: 'absolute', right: 0, top: 0, width: 128, height: 128, backgroundColor: 'rgba(255, 107, 107, 0.05)', borderRadius: '50%', filter: 'blur(48px)', pointerEvents: 'none' }} />

      <LabelTag style={{ display: 'block', marginBottom: 24, position: 'relative', zIndex: 1 }}>Top Critical Blockers</LabelTag>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>
        {topBlockers.map((blocker, i) => {
          const clusterEntry = Object.entries(audit.clusters).find(([, c]) => Object.keys(c.dimensions).includes(blocker.dimension))
          const clusterName = clusterEntry ? clusterEntry[1].cluster_name : ''
          const shortCluster = clusterName.split(' ').slice(0, 2).join(' ')
          return (
            <div key={blocker.id}>
              {i > 0 && (
                <div style={{ height: 1, backgroundColor: C.creamBorder, marginBottom: 20 }} />
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  marginTop: 6, width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: C.red, flexShrink: 0,
                  boxShadow: '0 0 8px rgba(255, 107, 107, 0.5)',
                }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.red, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
                      {blocker.id}
                    </span>
                    {shortCluster && (
                      <span style={{
                        fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em',
                        backgroundColor: 'rgba(245, 233, 200, 0.05)', padding: '2px 8px',
                        borderRadius: 4, color: C.creamDim,
                      }}>
                        {shortCluster}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(245, 233, 200, 0.9)', lineHeight: 1.4, margin: 0 }}>
                    {blocker.summary}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RemediationPathCard({ tiers, onRoadmapClick }: {
  tiers: { tier1: RemediationItem[]; tier2: RemediationItem[]; tier3: RemediationItem[] }
  onRoadmapClick: () => void
}) {
  const total = tiers.tier1.length + tiers.tier2.length + tiers.tier3.length
  return (
    <div
      className="card-hover"
      onClick={onRoadmapClick}
      style={{
        borderRadius: 32,
        backgroundColor: C.panel,
        border: `1px solid ${C.creamBorder}`,
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      <div>
        <LabelTag style={{ display: 'block', marginBottom: 4, color: C.cream }}>Remediation Path</LabelTag>
        <span style={{ fontSize: 13, color: C.creamDim }}>{total} Total Actions</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          title="Quick Wins"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: C.greenBg, border: `1px solid ${C.greenBorder}`,
            color: C.green, fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {tiers.tier1.length}
        </div>
        <div
          title="Foundational Blockers"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: C.amberBg, border: `1px solid ${C.amberBorder}`,
            color: C.amber, fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {tiers.tier2.length}
        </div>
        <div
          title="Post-Migration"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'rgba(245, 233, 200, 0.05)', border: `1px solid rgba(245, 233, 200, 0.1)`,
            color: C.creamDim, fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {tiers.tier3.length}
        </div>
      </div>
    </div>
  )
}

function ClusterCard({ number, name, score, description, isLast, onClick }: {
  number: number; name: string; score: number; description: string; isLast: boolean; onClick: () => void
}) {
  const color = scoreColor(score)
  const isCritical = score < 50
  const track = scoreTrack(score)
  const glow = scoreGlow(score)

  const cardStyle: React.CSSProperties = {
    gridColumn: isLast ? 'span 2' : undefined,
    borderRadius: 24,
    padding: 24,
    minHeight: 180,
    backgroundColor: isCritical ? C.redBg : C.panel,
    border: `1px solid ${isCritical ? C.redBorder : C.creamBorder}`,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  if (isLast) {
    return (
      <div className="card-hover" style={cardStyle} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ maxWidth: '28rem' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.cream, display: 'block', marginBottom: 12 }}>
              {number}. {name}
            </span>
            <p style={{ fontSize: 13, color: C.creamDim, lineHeight: 1.6, margin: 0 }}>{description}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{
              fontSize: 24, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '-0.02em', color, display: 'block', marginBottom: 32,
            }}>
              {score.toFixed(1)}%
            </span>
            <div style={{ width: 128, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: track, display: 'inline-block' }}>
              <div style={{ height: '100%', width: `${score}%`, backgroundColor: color, boxShadow: glow }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-hover" style={cardStyle} onClick={onClick}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: isCritical ? C.red : C.cream, lineHeight: 1.3 }}>
            {number}. {name}
          </span>
          <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em', color, whiteSpace: 'nowrap' }}>
            {score.toFixed(1)}%
          </span>
        </div>
        <p style={{ fontSize: 13, color: isCritical ? 'rgba(245, 233, 200, 0.8)' : C.creamDim, lineHeight: 1.6, margin: 0, fontWeight: isCritical ? 500 : 400 }}>
          {description}
        </p>
      </div>
      <ProgressBar score={score} color={color} track={track} glow={glow} />
    </div>
  )
}

function OverviewTab({ system, tiers, onRoadmapClick }: {
  system: AuditSystem
  tiers: { tier1: RemediationItem[]; tier2: RemediationItem[]; tier3: RemediationItem[] }
  onRoadmapClick: () => void
}) {
  const navigate = useNavigate()
  const { audit, editorial } = system

  const clusterEntries = CLUSTER_ORDER
    .filter(key => audit.clusters[key])
    .map((key, i) => {
      const cluster = audit.clusters[key]
      return {
        key,
        number: i + 1,
        name: cluster.cluster_name,
        score: cluster.cluster_score,
        description: clusterNarrative(cluster, key, editorial),
      }
    })

  return (
    <div className="v2-fade-in">
      {/* Hero grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, marginBottom: 48 }}>
        <ScoreHeroCard system={system} onRoadmapClick={onRoadmapClick} />
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <BlockersCard system={system} />
          <RemediationPathCard tiers={tiers} onRoadmapClick={onRoadmapClick} />
        </div>
      </div>

      {/* Clusters section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Audit Clusters</h2>
        <LabelTag>{clusterEntries.length} Clusters Evaluated</LabelTag>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {clusterEntries.map((c, i) => (
          <ClusterCard
            key={c.key}
            number={c.number}
            name={c.name}
            score={c.score}
            description={c.description}
            isLast={i === clusterEntries.length - 1}
            onClick={() => navigate(`/cluster/${c.key}`)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Roadmap tab ──

function RoadmapItem({ item, tier, isFirst, isLast }: {
  item: RemediationItem; tier: 1 | 2 | 3; isFirst: boolean; isLast: boolean
}) {
  const accentColor = tier === 1 ? C.green : tier === 2 ? C.amber : C.creamDim
  const idColor = tier === 1 ? C.green : tier === 2 ? C.red : C.creamDim
  const dimmed = tier === 3

  return (
    <div
      className="card-hover"
      style={{
        backgroundColor: C.panel,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: 16,
        padding: '20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        opacity: dimmed ? 0.75 : 1,
      }}
    >
      {/* Left accent bar for foundational blockers */}
      {tier === 2 && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.amber }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingLeft: tier === 2 ? 8 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
          <span style={{
            marginTop: 2, fontSize: 11, color: idColor,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em',
            width: 64, flexShrink: 0,
          }}>
            {item.id}
          </span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, color: dimmed ? C.creamDim : C.cream, margin: '0 0 4px 0', lineHeight: 1.35 }}>
              {item.action}
            </h3>
            {item.value_framing && (
              <p style={{ fontSize: 13, color: dimmed ? 'rgba(245, 233, 200, 0.4)' : C.creamDim, margin: 0, lineHeight: 1.5 }}>
                {item.value_framing}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 24,
          paddingTop: 16, borderTop: `1px solid rgba(245, 233, 200, 0.08)`,
          paddingLeft: tier === 2 ? 8 : 0,
          opacity: dimmed ? 0.8 : 1,
        }}
      >
        <div style={{ flex: 1, display: 'flex', gap: 16 }}>
          <div>
            <LabelTag style={{ display: 'block', fontSize: 9, marginBottom: 2 }}>Effort</LabelTag>
            <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: C.creamDim }}>
              {effortLabel(item.effort_estimate)}
            </span>
          </div>
          <div>
            <LabelTag style={{ display: 'block', fontSize: 9, marginBottom: 2 }}>Owner</LabelTag>
            <span style={{
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
              backgroundColor: 'rgba(245, 233, 200, 0.08)', padding: '2px 8px',
              borderRadius: 4, color: C.cream,
            }}>
              {ownerLabel(item.ownership)}
            </span>
          </div>
        </div>
        {item.projected_score_improvement && (
          <div style={{ textAlign: 'right' }}>
            <LabelTag style={{ display: 'block', fontSize: 9, marginBottom: 2 }}>Impact</LabelTag>
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: accentColor }}>
              {item.projected_score_improvement}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function RoadmapSection({ title, timeframe, items, tier, accentColor, accentBg, accentBorder }: {
  title: string; timeframe: string
  items: RemediationItem[]
  tier: 1 | 2 | 3
  accentColor: string; accentBg: string; accentBorder: string
}) {
  if (items.length === 0) return null
  return (
    <section style={{ opacity: tier === 3 ? 0.85 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', backgroundColor: accentColor,
          boxShadow: `0 0 12px ${accentColor}66`,
        }} />
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
          {title}{' '}
          <span style={{ color: C.creamDim, fontWeight: 400, fontSize: 14 }}>({timeframe})</span>
        </h2>
        <span style={{
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
          backgroundColor: accentBg, color: accentColor,
          border: `1px solid ${accentBorder}`,
          padding: '4px 8px', borderRadius: 4,
          marginLeft: 'auto',
        }}>
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <RoadmapItem
            key={item.id}
            item={item}
            tier={tier}
            isFirst={i === 0}
            isLast={i === items.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

function RoadmapTab({ system }: { system: AuditSystem }) {
  const { remediation, editorial } = system
  const [filter, setFilter] = useState<OwnerFilter>('All')
  const merged = remediation.items.map(i => getMergedRemItem(i, editorial))
  const tiers = remediationByTier(merged)
  const match = (item: RemediationItem) => ownerMatchesFilter(item.ownership, filter)
  const t1 = tierDef(1, editorial)
  const t2 = tierDef(2, editorial)
  const t3 = tierDef(3, editorial)

  const filterButtons: OwnerFilter[] = ['All', 'design', 'engineering']

  return (
    <div className="v2-fade-in">
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 12px 0' }}>
            Remediation Roadmap
          </h1>
          <p style={{ fontSize: 16, color: C.creamDim, margin: 0, maxWidth: '42rem' }}>
            A prioritized path to achieve AI-readiness. Filter tasks by department ownership.
          </p>
        </div>

        {/* Filter pills */}
        <div style={{
          display: 'flex',
          backgroundColor: C.panel,
          border: `1px solid ${C.creamBorder}`,
          padding: 4,
          borderRadius: 9999,
        }}>
          {filterButtons.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 20px',
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
                backgroundColor: filter === f ? C.cream : 'transparent',
                color: filter === f ? C.bg : C.creamDim,
              }}
            >
              {f === 'All' ? 'All' : f === 'design' ? 'Design' : 'Engineering'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <RoadmapSection
          title={t1.label}
          timeframe={t1.effort}
          items={tiers.tier1.filter(match)}
          tier={1}
          accentColor={C.green}
          accentBg={C.greenBg}
          accentBorder={C.greenBorder}
        />
        <RoadmapSection
          title={t2.label}
          timeframe={t2.effort}
          items={tiers.tier2.filter(match)}
          tier={2}
          accentColor={C.amber}
          accentBg={C.amberBg}
          accentBorder={C.amberBorder}
        />
        <RoadmapSection
          title={t3.label}
          timeframe={t3.effort}
          items={tiers.tier3.filter(match)}
          tier={3}
          accentColor={C.creamFaint}
          accentBg="rgba(245, 233, 200, 0.05)"
          accentBorder="rgba(245, 233, 200, 0.1)"
        />
      </div>
    </div>
  )
}

// ── Impact tab ──

function ImpactTab({ system, onRoadmapClick }: { system: AuditSystem; onRoadmapClick: () => void }) {
  const { audit, editorial } = system
  const [teamSize, setTeamSize] = useState(12)
  const [componentsPerSprint, setComponentsPerSprint] = useState(18)
  const [hourlyRate, setHourlyRate] = useState(75)

  const designers = Math.max(1, Math.round(teamSize * 0.4))
  const engineers = Math.max(1, teamSize - designers)

  const {
    undocumentedRate,
    flatTokenCount,
    avgComponentsPerToken,
    minutesPerTokenUpdate,
    undocumentedGapCount,
    probabilityOfSurfacing,
  } = deriveAuditConstants(audit)

  const correctionCost = calcCorrectionCost(componentsPerSprint, designers, undocumentedRate, 10, 26, hourlyRate)
  const themeCost = calcThemeCost(flatTokenCount, avgComponentsPerToken, minutesPerTokenUpdate, 2, hourlyRate)
  const parityCost = calcParityCost(undocumentedGapCount, probabilityOfSurfacing, engineers, 12, hourlyRate)
  const total = correctionCost + themeCost + parityCost

  // Reference finding IDs for each cost category
  const getClusterDims = (key: string) => new Set(Object.keys(audit.clusters[key]?.dimensions ?? {}))
  const correctionRefId = audit.findings.find(f => f.severity === 'blocker' && getClusterDims('3_documentation_readiness').has(f.dimension))?.id
  const themeRefId = audit.findings.find(f => f.severity === 'blocker' && getClusterDims('1_token_and_variable_system').has(f.dimension))?.id
  const parityRefId = audit.findings.find(f => f.severity === 'blocker' && getClusterDims('6_design_to_code_parity').has(f.dimension))?.id

  const correctionFraming = clusterValueFraming('3_documentation_readiness', editorial)
    ?? 'Rework stemming from misunderstood component intent and error recovery gaps during handoff.'
  const themeFraming = clusterValueFraming('1_token_and_variable_system', editorial)
    ?? 'Manual updates required when brand changes occur, resulting from a lack of layered token architecture.'
  const parityFraming = clusterValueFraming('6_design_to_code_parity', editorial)
    ?? 'Time spent fixing misalignments between design files and implemented components due to undocumented structural gaps.'

  const costCards = [
    {
      cost: correctionCost,
      title: 'Correction Cycles',
      description: correctionFraming,
      refId: correctionRefId,
      iconBg: '#2A1616',
      iconColor: C.red,
      iconBorder: C.redBorder,
      refColor: C.red,
      refBg: C.redBg,
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
      refId: themeRefId,
      iconBg: '#2D2312',
      iconColor: C.amber,
      iconBorder: C.amberBorder,
      refColor: C.amber,
      refBg: C.amberBg,
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
      refId: parityRefId,
      iconBg: 'rgba(76, 139, 255, 0.08)',
      iconColor: '#4C8BFF',
      iconBorder: 'rgba(76, 139, 255, 0.2)',
      refColor: C.red,
      refBg: C.redBg,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
  ]

  return (
    <div className="v2-fade-in">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 12px 0' }}>
          Impact Calculator
        </h1>
        <p style={{ fontSize: 16, color: C.creamDim, margin: 0, maxWidth: '42rem' }}>
          Projected costs and savings from remediating the {system.name} design system based on current AI-readiness audit scores.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, width: '100%' }}>
        {/* Parameters card */}
        <section style={{
          gridColumn: 'span 4',
          borderRadius: 32,
          backgroundColor: C.panel,
          border: `1px solid ${C.creamBorder}`,
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, paddingBottom: 24, borderBottom: `1px solid ${C.creamBorder}` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.8 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <LabelTag style={{ color: C.cream, letterSpacing: '0.12em' }}>Team Parameters</LabelTag>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <RangeSlider
                id="v2-team-size"
                label="Engineering & Design Team Size"
                value={teamSize}
                min={1}
                max={30}
                step={1}
                format={v => String(v)}
                onChange={setTeamSize}
              />
              <RangeSlider
                id="v2-components"
                label="Components Built / Sprint"
                value={componentsPerSprint}
                min={5}
                max={50}
                step={1}
                format={v => String(v)}
                onChange={setComponentsPerSprint}
              />
              <RangeSlider
                id="v2-rate"
                label="Average Blended Hourly Rate"
                value={hourlyRate}
                min={30}
                max={200}
                step={5}
                format={v => `€${v}`}
                onChange={setHourlyRate}
              />
            </div>
          </div>
        </section>

        {/* Total savings hero */}
        <section style={{
          gridColumn: 'span 8',
          borderRadius: 32,
          backgroundColor: C.cream,
          color: C.bg,
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative bg */}
          <div style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.05, pointerEvents: 'none' }}>
            <svg width="320" height="320" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
              <path d="M12 2L2 22h20L12 2z" />
              <circle cx="12" cy="15" r="3" />
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 8px 0', opacity: 0.8 }}>
                  Total Projected Annual Savings
                </h2>
                <p style={{ fontSize: 15, opacity: 0.7, maxWidth: '24rem', margin: 0 }}>
                  Calculated estimate if all foundational and post-migration blockers are remediated.
                </p>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: 'rgba(11,11,11,0.05)',
                border: '1px solid rgba(11,11,11,0.1)',
                padding: '10px 16px', borderRadius: 9999,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Projected Estimate
                </span>
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 500, transform: 'translateY(-1rem)', opacity: 0.8 }}>€</span>
                <span className="value-transition" style={{
                  fontSize: 'clamp(4rem, 8vw, 7.5rem)',
                  lineHeight: 0.85,
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  fontFeatureSettings: '"tnum", "zero"',
                  color: C.bg,
                }}>
                  {fmtTotal(total)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid rgba(11,11,11,0.15)', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: '100%', maxWidth: '28rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                  <span style={{ opacity: 0.7, fontFamily: 'JetBrains Mono, monospace' }}>
                    Current Audit Score: {audit.summary.overall_score.toFixed(1)}%
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>Target: 85.0%+</span>
                </div>
                <div style={{ width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', backgroundColor: 'rgba(11,11,11,0.1)' }}>
                  <div style={{ backgroundColor: C.bg, width: `${audit.summary.overall_score}%`, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: C.cream }} />
                  </div>
                  <div style={{ height: '100%', borderTop: '1px dashed rgba(11,11,11,0.5)', borderBottom: '1px dashed rgba(11,11,11,0.5)', opacity: 0.3, width: `${Math.max(0, 85 - audit.summary.overall_score)}%` }} />
                </div>
              </div>
              <button
                onClick={onRoadmapClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 32px', borderRadius: 9999,
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  backgroundColor: C.bg, color: C.cream, border: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                View Remediation Plan
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Cost breakdown cards */}
        {costCards.map(card => (
          <section
            key={card.title}
            className="card-hover"
            style={{
              gridColumn: 'span 3',
              borderRadius: 32,
              backgroundColor: C.panel,
              border: `1px solid ${C.creamBorder}`,
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  backgroundColor: card.iconBg, color: card.iconColor,
                  border: `1px solid ${card.iconBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {card.icon}
                </div>
                {card.refId && (
                  <span style={{
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    color: card.refColor, backgroundColor: card.refBg,
                    padding: '4px 8px', borderRadius: 4,
                    border: `1px solid ${card.iconBorder}`,
                  }}>
                    {card.refId}
                  </span>
                )}
              </div>
              <div className="value-transition" style={{
                fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)',
                fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em',
                marginBottom: 16, color: C.cream,
                fontFeatureSettings: '"tnum", "zero"',
              }}>
                {fmt(card.cost)}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px 0', color: C.cream }}>{card.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: C.creamDim }}>{card.description}</p>
            </div>
          </section>
        ))}

        {/* Token Efficiency — emerging category */}
        <section
          style={{
            gridColumn: 'span 3',
            borderRadius: 32,
            backgroundColor: C.panel,
            border: `1px dashed ${C.creamBorder}`,
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            opacity: 0.75,
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                backgroundColor: 'rgba(45, 212, 191, 0.08)', color: '#2DD4BF',
                border: '1px solid rgba(45, 212, 191, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13.5 2.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" />
                </svg>
              </div>
              <span style={{
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                fontWeight: 500, color: '#2DD4BF',
                backgroundColor: 'rgba(45, 212, 191, 0.08)',
                border: '1px dashed rgba(45, 212, 191, 0.25)',
                padding: '4px 10px', borderRadius: 9999,
              }}>
                Emerging Category
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px 0', color: C.cream }}>Token Efficiency</h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: C.creamDim }}>
              Token consumption is an operational and environmental cost — compute, energy, water for cooling. This category becomes quantifiable after the token efficiency experiment.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Main component ──

export default function OverviewV2({ system }: { system: AuditSystem }) {
  const [tab, setTab] = useState<TabId>('overview')
  const { audit, editorial, remediation } = system
  const tiers = remediationByTier(remediation.items.map(i => getMergedRemItem(i, editorial)))

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'impact', label: 'Impact' },
  ]

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 32,
        paddingBottom: 32,
        borderBottom: `1px solid ${C.creamBorder}`,
        marginBottom: 40,
      }}>
        {tabs.map(t => (
          <TabButton key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab system={system} tiers={tiers} onRoadmapClick={() => setTab('roadmap')} />
      )}
      {tab === 'roadmap' && (
        <RoadmapTab system={system} />
      )}
      {tab === 'impact' && (
        <ImpactTab system={system} onRoadmapClick={() => setTab('roadmap')} />
      )}
    </div>
  )
}
