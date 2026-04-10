import { useNavigate } from 'react-router-dom'
import type { AuditSystem } from '../data/types'
import {
  CLUSTER_ORDER,
  clusterNarrative,
  resolveTopBlockers,
  remediationByTier,
  clusterDisplayNumber,
  getMergedFinding,
} from '../data/loader'
import { LabelCaps, BlockerCard, DimensionScoreCard } from '../components'

function RemediationSummaryItem({ color, label, effort, count, borderBottom, dimmed }: {
  color: string; label: string; effort: string; count: number; borderBottom: boolean; dimmed: boolean
}) {
  return (
    <div className="flex items-center justify-between py-4" style={borderBottom ? { borderBottom: '1px solid rgba(245, 233, 200, 0.1)' } : {}}>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, opacity: dimmed ? 0.3 : 1 }} />
          <span className="text-[16px] font-medium" style={dimmed ? { opacity: 0.6 } : {}}>{label}</span>
        </div>
        <span className="text-[11px] uppercase tracking-widest ml-5" style={{ opacity: dimmed ? 0.4 : 0.5 }}>
          Est. Effort: {effort}
        </span>
      </div>
      <span className="text-[32px] font-medium" style={{ color: dimmed ? undefined : color, opacity: dimmed ? 0.4 : 1 }}>
        {count}
      </span>
    </div>
  )
}

export default function Overview({ system }: {
  system: AuditSystem
}) {
  const navigate = useNavigate()
  const { audit, editorial, remediation } = system
  const { summary } = audit

  const topBlockers = resolveTopBlockers(audit).map(f => getMergedFinding(f, editorial))
  const tiers = remediationByTier(remediation.items)

  // Build cluster cards data
  const clusterEntries = CLUSTER_ORDER
    .filter(key => audit.clusters[key])
    .map(key => {
      const cluster = audit.clusters[key]
      const score = cluster.cluster_score
      const color = score < 50 ? '#FF6B6B' : score < 75 ? '#F5A623' : '#4ADE80'
      return {
        key,
        number: clusterDisplayNumber(key),
        name: cluster.cluster_name,
        score,
        color,
        description: clusterNarrative(cluster, key, editorial),
      }
    })

  // Readiness badge
  const readinessColor = summary.phase_readiness === 'pass' ? '#4ADE80' : summary.phase_readiness === 'conditional_pass' ? '#F5A623' : '#FF6B6B'
  const readinessLabel = summary.phase_readiness === 'pass'
    ? 'Ready: AI tools can work with this system reliably.'
    : summary.phase_readiness === 'conditional_pass'
      ? 'Conditionally ready: some manual correction still required.'
      : 'Not ready: AI tools will need significant human correction.'

  return (
    <main className="grid grid-cols-12 gap-6 w-full">
      {/* Overall Score Card */}
      <section className="col-span-8 p-10 flex flex-col justify-between" style={{ backgroundColor: '#161616', borderRadius: '32px', minHeight: '340px' }}>
        <div>
          <div className="flex justify-between items-start mb-4">
            <LabelCaps>Overall System Score</LabelCaps>
            <div
              className="px-4 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-2"
              style={{
                border: `1px solid ${readinessColor}40`,
                backgroundColor: `${readinessColor}15`,
                color: readinessColor,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: readinessColor, boxShadow: `0 0 6px ${readinessColor}` }} />
              {readinessLabel}
            </div>
          </div>
          <h1 className="text-[96px] font-medium leading-none tracking-tight mt-2">
            {summary.overall_score.toFixed(1)}
            <span className="text-[48px] ml-1" style={{ opacity: 0.5 }}>%</span>
          </h1>
        </div>
        <div className="mt-12 flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <LabelCaps className="mb-1">Target Design System</LabelCaps>
              <p className="text-[20px] font-medium tracking-tight m-0">{audit.meta.system_name}</p>
            </div>
            <div className="text-right">
              <LabelCaps className="mb-1">Audit Date</LabelCaps>
              <p className="text-[14px] m-0" style={{ opacity: 0.6 }}>{audit.meta.audit_date}</p>
            </div>
          </div>

          <div className="max-w-[72ch]">
            <p className="text-[13px] leading-relaxed m-0" style={{ opacity: 0.8 }}>
              {audit.meta.system_name} scores {summary.overall_score.toFixed(1)}/100 with {summary.blocker_count} structural gap{summary.blocker_count !== 1 ? 's' : ''} that affect AI tool reliability.
            </p>
            {editorial.report?.executive_summary && (
              <p className="text-[13px] leading-relaxed mt-2 mb-0" style={{ opacity: 0.75 }}>
                {editorial.report.executive_summary}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Remediation Summary */}
      <section className="col-span-4 p-10 flex flex-col" style={{ backgroundColor: '#161616', borderRadius: '32px' }}>
        <div className="flex justify-between items-center mb-8">
          <LabelCaps>Remediation Summary</LabelCaps>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="flex flex-col flex-grow justify-center">
          <RemediationSummaryItem color="#4ADE80" label="Quick Wins" effort="Hours–Days" count={tiers.tier1.length} borderBottom dimmed={false} />
          <RemediationSummaryItem color="#F5A623" label="Foundational" effort="Days–Weeks" count={tiers.tier2.length} borderBottom dimmed={false} />
          <RemediationSummaryItem color="#F5E9C8" label="Post-Migration" effort="Weeks" count={tiers.tier3.length} borderBottom={false} dimmed />
        </div>
      </section>

      {/* Top Priorities */}
      <div className="col-span-12 mt-4">
        <div className="flex items-center justify-between mb-5">
          <LabelCaps>Top Priorities</LabelCaps>
          <span className="text-[12px]" style={{ opacity: 0.5 }}>
            {summary.blocker_count} Blocker{summary.blocker_count !== 1 ? 's' : ''} · {audit.findings.length} Total Findings
          </span>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {topBlockers.map(blocker => {
            const cluster = Object.entries(audit.clusters).find(([, c]) => Object.keys(c.dimensions).includes(blocker.dimension))
            const clusterName = cluster ? cluster[1].cluster_name : ''
            return (
              <BlockerCard
                key={blocker.id}
                category={clusterName}
                description={blocker.summary}
                onClick={() => navigate(`/dimension/${blocker.dimension}`)}
              />
            )
          })}
        </div>
      </div>

      {/* Cluster Scores */}
      <div className="col-span-12 mt-6">
        <LabelCaps className="mb-5">Cluster Scores</LabelCaps>
        <div className="grid grid-cols-12 gap-6">
          {clusterEntries.map((c, i) => {
            // First 4 clusters get 3 cols, last 3 get 4 cols
            const colSpan = i < 4 ? 3 : 4
            return (
              <div key={c.key} style={{ gridColumn: `span ${colSpan}` }}>
                <DimensionScoreCard
                  number={c.number}
                  title={c.name}
                  scorePercent={c.score}
                  color={c.color}
                  description={c.description}
                  onClick={() => navigate(`/cluster/${c.key}`)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
