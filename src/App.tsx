import { useMemo, useState } from 'react'
import auditJson from './data/mui-audit-v2.1.json'
import dimensionRefJson from './data/dimension-reference.json'
import weightsJson from './data/scoring-weights.json'
import type {
  AuditFile,
  AppView,
  DimensionReferenceFile,
  RemediationItem,
  ScoringWeightsFile,
} from './audit/types'
import {
  CLUSTER_ORDER,
  READINESS_COPY,
  SCORE_LABELS_0_4,
  allRemediationItems,
  blockerFindingCountForCluster,
  clusterIdForDimension,
  effortByOwnership,
  findingCountForCluster,
  findingsForCluster,
  findingsForDimension,
  findDimensionKeyForSlug,
  prerequisitesFails,
  remediationForCluster,
  remediationForDimension,
  remediationTierCounts,
  scoreBarTone,
  sortDimensionsForTable,
  sortRemediationByEffort,
  topBlockers,
} from './audit/helpers'

const audit = auditJson as AuditFile
const dimRef = dimensionRefJson as DimensionReferenceFile
const weights = weightsJson as ScoringWeightsFile

function cn(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return <span className="text-[var(--color-muted)]">—</span>
  const map: Record<string, string> = {
    blocker: 'text-[var(--color-fail)] font-semibold',
    warning: 'text-[var(--color-partial)] font-semibold',
    note: 'text-neutral-600',
    pass: 'text-[var(--color-pass)]',
  }
  return <span className={map[severity] ?? 'text-neutral-600'}>{severity}</span>
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0
  const tone = scoreBarTone(score, max)
  const fill =
    tone === 'fail'
      ? 'bg-[var(--color-fail)]'
      : tone === 'partial'
        ? 'bg-[var(--color-partial)]'
        : tone === 'pass'
          ? 'bg-[var(--color-pass)]'
          : 'bg-neutral-300'
  return (
    <div className="flex h-2 w-full max-w-[200px] items-center bg-neutral-200">
      <div className={cn('h-2', fill)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ClusterScoreBar({ percent }: { percent: number }) {
  const pct = Math.min(100, Math.max(0, percent))
  const tone = scoreBarTone(Math.round(pct / 25), 4)
  const fill =
    tone === 'fail'
      ? 'bg-[var(--color-fail)]'
      : tone === 'partial'
        ? 'bg-[var(--color-partial)]'
        : 'bg-[var(--color-pass)]'
  return (
    <div className="flex h-2 w-full items-center bg-neutral-200">
      <div className={cn('h-2', fill)} style={{ width: `${pct}%` }} />
    </div>
  )
}

function dimensionScoreLabel(
  score: number | null,
  scoreMax: number,
  ref?: (typeof dimRef.dimensions)[string]
): string {
  if (score === null) return 'Not assessed'
  const levelText = ref?.score_levels[String(score)]
  if (scoreMax <= 2) {
    return levelText ? `${score} / ${scoreMax} — ${levelText}` : `${score} / ${scoreMax}`
  }
  const word = SCORE_LABELS_0_4[score] ?? '—'
  return `${score} — ${word}`
}

function Header({
  onOverview,
  onRemediation,
  onComparison,
}: {
  onOverview: () => void
  onRemediation: () => void
  onComparison: () => void
}) {
  const s = audit.summary
  return (
    <header className="border-b border-[var(--color-line)] bg-white">
      <div className="mx-auto flex max-w-[960px] flex-wrap items-baseline justify-between gap-4 px-6 py-6">
        <div className="flex flex-wrap items-baseline gap-6">
          <button
            type="button"
            onClick={onOverview}
            className="cursor-pointer border-none bg-transparent p-0 text-[17px] font-semibold text-[var(--color-accent)]"
          >
            {audit.meta.system_name}
          </button>
          <span className="text-[15px] text-neutral-600">
            Overall <span className="font-semibold text-neutral-900">{s.overall_score}%</span>
          </span>
        </div>
        <nav className="flex flex-wrap gap-6 text-[15px]">
          <button
            type="button"
            onClick={onOverview}
            className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={onRemediation}
            className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
          >
            Remediation
          </button>
          <button
            type="button"
            onClick={onComparison}
            className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
          >
            Comparison
          </button>
        </nav>
      </div>
    </header>
  )
}

function Breadcrumbs({
  items,
  onNavigate,
}: {
  items: { label: string; view: AppView }[]
  onNavigate: (v: AppView) => void
}) {
  return (
    <nav className="mb-8 text-[14px] text-neutral-600" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label + i}>
          {i > 0 && <span className="mx-2 text-neutral-400">/</span>}
          {i < items.length - 1 ? (
            <button
              type="button"
              onClick={() => onNavigate(item.view)}
              className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-neutral-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

function Overview({
  onCluster,
  onDimension,
  onRemediation,
}: {
  onCluster: (id: string) => void
  onDimension: (id: string) => void
  onRemediation: () => void
}) {
  const s = audit.summary
  const meta = audit.meta
  const prereqFails = prerequisitesFails(audit)
  const blockers = topBlockers(audit, 5)
  const tierCounts = remediationTierCounts(audit)
  const effortMap = effortByOwnership(audit)

  return (
    <div>
      <header className="mb-10 border-b border-neutral-200 pb-8">
        <p className="mb-1 text-[14px] text-neutral-500">{meta.audit_date}</p>
        <h1 className="mb-4 max-w-[42rem] text-[20px] font-semibold leading-snug text-neutral-900">
          {READINESS_COPY[s.phase_readiness] ?? s.phase_readiness}
        </h1>
        <div className="flex flex-wrap items-end gap-8">
          <div>
            <p className="mb-1 text-[12px] uppercase tracking-wide text-neutral-500">Overall score</p>
            <p className="text-[32px] font-semibold tabular-nums text-neutral-900">{s.overall_score}%</p>
          </div>
          <div className="min-w-[200px] flex-1">
            <ClusterScoreBar percent={s.overall_score} />
          </div>
        </div>
      </header>

      <section className="mb-12">
        <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">Clusters</h2>
        <div className="flex flex-col gap-8">
          {CLUSTER_ORDER.map((cid) => {
            const c = audit.clusters[cid]
            if (!c) return null
            const isPrereq = cid === '0_prerequisites'
            const fc = findingCountForCluster(audit, cid)
            const bc = blockerFindingCountForCluster(audit, cid)
            return (
              <button
                key={cid}
                type="button"
                onClick={() => onCluster(cid)}
                className={cn(
                  'w-full cursor-pointer border-none bg-transparent p-0 text-left',
                  isPrereq && 'border-l-2 border-neutral-900 pl-6',
                  !isPrereq && 'pl-0',
                  prereqFails && !isPrereq && 'opacity-90'
                )}
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-4">
                  <span className="text-[17px] font-semibold text-neutral-900">{c.cluster_name}</span>
                  <span className="tabular-nums text-neutral-700">{c.cluster_score.toFixed(1)}%</span>
                </div>
                <div className="mb-3 max-w-xl">
                  <ClusterScoreBar percent={c.cluster_score} />
                </div>
                <p className="mb-3 max-w-[42rem] text-neutral-700">{c.cluster_summary}</p>
                <p className="text-[13px] text-neutral-500">
                  {fc} findings · {bc} blockers
                </p>
                {prereqFails && !isPrereq && (
                  <p className="mt-3 max-w-[42rem] text-[13px] text-[var(--color-partial)]">
                    Prerequisites below threshold — interpret this cluster with caution.
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Top blockers
        </h2>
        <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
          {blockers.map((f) => {
            const dk = findDimensionKeyForSlug(audit, f.dimension)
            const cid = dk ? clusterIdForDimension(audit, dk) : ''
            const clusterName = cid ? audit.clusters[cid]?.cluster_name : '—'
            const dimName = dk ? dimRef.dimensions[dk]?.name ?? dk : f.dimension
            return (
              <li key={f.id} className="py-4">
                <button
                  type="button"
                  onClick={() => dk && onDimension(dk)}
                  className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
                >
                  <div className="mb-1 flex flex-wrap items-baseline gap-3">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-semibold text-neutral-900">{f.summary}</span>
                  </div>
                  <p className="text-[13px] text-neutral-500">
                    {clusterName} · {dimName}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Remediation summary
        </h2>
        <div className="mb-6 flex flex-wrap gap-8 text-[15px]">
          <div>
            <span className="text-neutral-500">Quick wins </span>
            <span className="font-semibold tabular-nums">{tierCounts.quickWins}</span>
          </div>
          <div>
            <span className="text-neutral-500">Foundational blockers </span>
            <span className="font-semibold tabular-nums">{tierCounts.foundational}</span>
          </div>
          <div>
            <span className="text-neutral-500">Post-migration </span>
            <span className="font-semibold tabular-nums">{tierCounts.postMigration}</span>
          </div>
          <button
            type="button"
            onClick={onRemediation}
            className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
          >
            View roadmap
          </button>
        </div>
        <p className="mb-2 text-[12px] uppercase tracking-wide text-neutral-500">Effort by ownership</p>
        <table className="w-full max-w-lg border-collapse text-[14px]">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="pb-2 pr-4 font-normal">Ownership</th>
              <th className="pb-2 pr-4 font-normal">Hours</th>
              <th className="pb-2 pr-4 font-normal">Days</th>
              <th className="pb-2 font-normal">Weeks</th>
            </tr>
          </thead>
          <tbody>
            {[...effortMap.entries()].map(([own, row]) => (
              <tr key={own} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{own}</td>
                <td className="tabular-nums">{row.hours}</td>
                <td className="tabular-nums">{row.days}</td>
                <td className="tabular-nums">{row.weeks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {audit.data_gaps.length > 0 && (
        <section className="mb-12 border-l-2 border-neutral-400 pl-6">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
            Data gaps
          </h2>
          <ul className="space-y-4">
            {audit.data_gaps.map((g) => (
              <li key={g.id}>
                <p className="mb-1 text-[14px] text-neutral-800">{g.description}</p>
                <p className="text-[13px] text-neutral-500">{g.impact}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ClusterDetail({
  clusterId,
  onCluster,
  onDimension,
  onOverview,
}: {
  clusterId: string
  onCluster: (id: string) => void
  onDimension: (id: string) => void
  onOverview: () => void
}) {
  const c = audit.clusters[clusterId]
  const w = weights.clusters[clusterId]?.weight
  const sorted = sortDimensionsForTable(Object.entries(c.dimensions))
  const findings = findingsForCluster(audit, clusterId)
  const rem = remediationForCluster(audit, clusterId)

  const crumbs: { label: string; view: AppView }[] = [
    { label: 'Overview', view: { screen: 'overview' } },
    { label: c.cluster_name, view: { screen: 'cluster', clusterId } },
  ]

  return (
    <div>
      <Breadcrumbs
        items={crumbs}
        onNavigate={(v) => {
          if (v.screen === 'overview') onOverview()
          else if (v.screen === 'cluster') onCluster(v.clusterId)
        }}
      />
      <header className="mb-8 border-b border-neutral-200 pb-8">
        <h1 className="mb-2 text-[20px] font-semibold text-neutral-900">{c.cluster_name}</h1>
        <div className="mb-4 flex flex-wrap items-end gap-8">
          <p className="text-[28px] font-semibold tabular-nums">{c.cluster_score.toFixed(1)}%</p>
          <div className="min-w-[200px] flex-1 max-w-md">
            <ClusterScoreBar percent={c.cluster_score} />
          </div>
        </div>
        <p className="mb-2 max-w-[42rem] text-neutral-700">{c.cluster_summary}</p>
        <p className="text-[14px] text-neutral-500">
          Weight {w !== undefined ? `${(w * 100).toFixed(0)}%` : '—'}
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Dimensions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-2 pr-4 font-normal">Dimension</th>
                <th className="pb-2 pr-4 font-normal">Score</th>
                <th className="pb-2 pr-4 font-normal">Severity</th>
                <th className="pb-2 pr-4 font-normal">Evidence</th>
                <th className="pb-2 font-normal">Findings</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(([dimId, d]) => {
                const ref = dimRef.dimensions[dimId]
                const fname = ref?.name ?? dimId
                const fcount = d.finding_ids.length
                return (
                  <tr key={dimId} className="border-b border-neutral-100">
                    <td className="py-3 pr-4 align-top">
                      <button
                        type="button"
                        onClick={() => onDimension(dimId)}
                        className="cursor-pointer border-none bg-transparent p-0 text-left text-[var(--color-accent)]"
                      >
                        {fname}
                      </button>
                    </td>
                    <td className="py-3 pr-4 align-top tabular-nums">
                      {dimensionScoreLabel(d.score, d.score_max, ref)}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <SeverityBadge severity={d.severity} />
                    </td>
                    <td className="py-3 pr-4 align-top text-neutral-600">
                      {d.evidence_sources.length ? d.evidence_sources.join(', ') : '—'}
                    </td>
                    <td className="py-3 align-top tabular-nums">{fcount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Findings
        </h2>
        <ul className="space-y-6">
          {findings.map((f) => (
            <li key={f.id} className="max-w-[42rem]">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="text-[13px] text-neutral-500">{f.id}</span>
                <SeverityBadge severity={f.severity} />
              </div>
              <p className="mb-1 font-semibold text-neutral-900">{f.summary}</p>
              <p className="text-neutral-700">{f.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Remediation (this cluster)
        </h2>
        {rem.length === 0 ? (
          <p className="text-neutral-500">No items solely assigned to this cluster.</p>
        ) : (
          <ul className="space-y-4">
            {rem.map((item, i) => (
              <li key={i} className="max-w-[42rem] text-[14px]">
                <p className="text-neutral-800">{item.action}</p>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {item.effort_estimate} · {item.ownership} · {item.projected_score_improvement}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function DimensionDetail({
  dimensionId,
  onCluster,
  onDimension,
  onOverview,
}: {
  dimensionId: string
  onCluster: (id: string) => void
  onDimension: (id: string) => void
  onOverview: () => void
}) {
  const cid = clusterIdForDimension(audit, dimensionId)
  const c = cid ? audit.clusters[cid] : undefined
  const d = c?.dimensions[dimensionId]
  const ref = dimRef.dimensions[dimensionId]
  const findings = findingsForDimension(audit, dimensionId)
  const rem = remediationForDimension(audit, dimensionId)

  if (!c || !d) {
    return (
      <p className="text-neutral-500">
        Unknown dimension.{' '}
        <button type="button" className="text-[var(--color-accent)]" onClick={() => onOverview()}>
          Overview
        </button>
      </p>
    )
  }

  const crumbs: { label: string; view: AppView }[] = [
    { label: 'Overview', view: { screen: 'overview' } },
    { label: c.cluster_name, view: { screen: 'cluster', clusterId: cid! } },
    { label: ref?.name ?? dimensionId, view: { screen: 'dimension', dimensionId } },
  ]

  return (
    <div>
      <Breadcrumbs
        items={crumbs}
        onNavigate={(v) => {
          if (v.screen === 'overview') onOverview()
          else if (v.screen === 'cluster') onCluster(v.clusterId)
          else if (v.screen === 'dimension') onDimension(v.dimensionId)
        }}
      />
      <header className="mb-8 border-b border-neutral-200 pb-8">
        <p className="mb-1 font-mono text-[13px] text-neutral-500">{dimensionId}</p>
        <h1 className="mb-4 text-[20px] font-semibold text-neutral-900">{ref?.name ?? dimensionId}</h1>
        <div className="mb-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="mb-1 text-[12px] uppercase tracking-wide text-neutral-500">Score</p>
            <p className="text-[17px] font-semibold">{dimensionScoreLabel(d.score, d.score_max, ref)}</p>
          </div>
          <div>
            <p className="mb-1 text-[12px] uppercase tracking-wide text-neutral-500">Severity</p>
            <SeverityBadge severity={d.severity} />
          </div>
        </div>
        {d.score !== null && (
          <div className="mb-2 max-w-xs">
            <ScoreBar score={d.score} max={d.score_max} />
          </div>
        )}
        <p className="mb-4 text-[14px]">
          Cluster{' '}
          <button
            type="button"
            onClick={() => onCluster(cid!)}
            className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
          >
            {c.cluster_name}
          </button>
        </p>
        <p className="max-w-[42rem] text-neutral-700">{ref?.description ?? d.narrative}</p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Score scale
        </h2>
        <ul className="max-w-[42rem] space-y-2 text-[14px]">
          {ref &&
            Object.entries(ref.score_levels).map(([k, text]) => (
              <li key={k}>
                <span className="font-semibold tabular-nums">{k}</span>{' '}
                <span className="text-neutral-700">{text}</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Findings
        </h2>
        <ul className="space-y-8">
          {findings.map((f) => (
            <li key={f.id} className="max-w-[42rem]">
              <p className="mb-1 text-[13px] text-neutral-500">{f.id}</p>
              <p className="mb-2 font-semibold text-neutral-900">{f.summary}</p>
              <p className="mb-3 text-neutral-700">{f.description}</p>
              <p className="text-[14px] text-neutral-600">
                <span className="font-semibold text-neutral-800">Recommendation </span>
                {f.recommendation}
              </p>
            </li>
          ))}
        </ul>
        {findings.length === 0 && <p className="text-neutral-500">No findings recorded.</p>}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Related remediation
        </h2>
        {rem.length === 0 ? (
          <p className="text-neutral-500">None linked to this dimension.</p>
        ) : (
          <ul className="space-y-4">
            {rem.map((item, i) => (
              <li key={i} className="max-w-[42rem] text-[14px]">
                <p className="text-neutral-800">{item.action}</p>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {item.effort_estimate} · {item.ownership}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

type OwnershipFilter = 'all' | 'design' | 'engineering' | 'both'

function matchesOwnership(f: OwnershipFilter, item: RemediationItem): boolean {
  if (f === 'all') return true
  return item.ownership === f
}

function RemediationView({
  onCluster,
  onDimension,
  onOverview,
}: {
  onCluster: (id: string) => void
  onDimension: (id: string) => void
  onOverview: () => void
}) {
  const [filter, setFilter] = useState<OwnershipFilter>('all')

  const quick = useMemo(() => {
    const q = audit.remediation.quick_wins
    return filter === 'all' ? q : q.filter((i) => matchesOwnership(filter, i))
  }, [filter])

  const found = useMemo(() => {
    const q = sortRemediationByEffort(audit.remediation.foundational_blockers)
    return filter === 'all' ? q : q.filter((i) => matchesOwnership(filter, i))
  }, [filter])

  const post = useMemo(() => {
    const q = sortRemediationByEffort(audit.remediation.post_migration)
    return filter === 'all' ? q : q.filter((i) => matchesOwnership(filter, i))
  }, [filter])

  const crumbs: { label: string; view: AppView }[] = [
    { label: 'Overview', view: { screen: 'overview' } },
    { label: 'Remediation roadmap', view: { screen: 'remediation' } },
  ]

  const filters: { key: OwnershipFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'design', label: 'Design' },
    { key: 'engineering', label: 'Engineering' },
    { key: 'both', label: 'Both' },
  ]

  return (
    <div>
      <Breadcrumbs
        items={crumbs}
        onNavigate={(v) => {
          if (v.screen === 'overview') onOverview()
        }}
      />
      <header className="mb-8 border-b border-neutral-200 pb-8">
        <h1 className="text-[20px] font-semibold text-neutral-900">Remediation roadmap</h1>
        <p className="mt-2 max-w-[42rem] text-neutral-600">
          {allRemediationItems(audit).length} actions across quick wins, foundational work, and
          post-migration improvements.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'cursor-pointer border px-3 py-1 text-[14px]',
                filter === key
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 bg-white text-neutral-800'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Quick wins
        </h2>
        <ul className="space-y-6">
          {quick.map((item, i) => (
            <li key={i} className="max-w-[42rem] border-b border-neutral-100 pb-6">
              <p className="mb-3 text-neutral-800">{item.action}</p>
              <p className="mb-2 text-[13px] text-neutral-500">
                {item.effort_estimate} · {item.ownership} · {item.projected_score_improvement}
              </p>
              <p className="text-[14px] text-neutral-600">
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
                  onClick={() => onCluster(item.affected_cluster)}
                >
                  {audit.clusters[item.affected_cluster]?.cluster_name ?? item.affected_cluster}
                </button>
                {' · '}
                {item.affected_dimensions.map((did, idx) => (
                  <span key={did}>
                    {idx > 0 ? ', ' : ''}
                    <button
                      type="button"
                      className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
                      onClick={() => onDimension(did)}
                    >
                      {dimRef.dimensions[did]?.name ?? did}
                    </button>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Foundational blockers
        </h2>
        <ul className="space-y-6">
          {found.map((item, i) => (
            <li key={i} className="max-w-[42rem] border-b border-neutral-100 pb-6">
              <p className="mb-3 text-neutral-800">{item.action}</p>
              <p className="mb-2 text-[13px] text-neutral-500">
                {item.effort_estimate} · {item.ownership} · {item.projected_score_improvement}
              </p>
              <p className="text-[14px] text-neutral-600">
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
                  onClick={() => onCluster(item.affected_cluster)}
                >
                  {audit.clusters[item.affected_cluster]?.cluster_name ?? item.affected_cluster}
                </button>
                {' · '}
                {item.affected_dimensions.map((did, idx) => (
                  <span key={did}>
                    {idx > 0 ? ', ' : ''}
                    <button
                      type="button"
                      className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
                      onClick={() => onDimension(did)}
                    >
                      {dimRef.dimensions[did]?.name ?? did}
                    </button>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-500">
          Post-migration
        </h2>
        <ul className="space-y-6">
          {post.map((item, i) => (
            <li key={i} className="max-w-[42rem] border-b border-neutral-100 pb-6">
              <p className="mb-3 text-neutral-800">{item.action}</p>
              <p className="mb-2 text-[13px] text-neutral-500">
                {item.effort_estimate} · {item.ownership}
                {item.projected_score_improvement ? ` · ${item.projected_score_improvement}` : ''}
              </p>
              <p className="text-[14px] text-neutral-600">
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
                  onClick={() => onCluster(item.affected_cluster)}
                >
                  {audit.clusters[item.affected_cluster]?.cluster_name ?? item.affected_cluster}
                </button>
                {item.affected_dimensions?.length ? ' · ' : ''}
                {item.affected_dimensions?.map((did, idx) => (
                  <span key={did}>
                    {idx > 0 ? ', ' : ''}
                    <button
                      type="button"
                      className="cursor-pointer border-none bg-transparent p-0 text-[var(--color-accent)]"
                      onClick={() => onDimension(did)}
                    >
                      {dimRef.dimensions[did]?.name ?? did}
                    </button>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function ComparisonView({ onOverview }: { onOverview: () => void }) {
  const crumbs: { label: string; view: AppView }[] = [
    { label: 'Overview', view: { screen: 'overview' } },
    { label: 'Comparison', view: { screen: 'comparison' } },
  ]

  return (
    <div>
      <Breadcrumbs
        items={crumbs}
        onNavigate={(v) => {
          if (v.screen === 'overview') onOverview()
        }}
      />
      <div className="bg-neutral-100 px-8 py-16 text-center">
        <p className="mb-2 text-[17px] font-semibold text-neutral-900">Comparison</p>
        <p className="mx-auto max-w-md text-[15px] text-neutral-600">
          Comparison is available when multiple audit files are loaded. This prototype uses a single
          fixed audit; load additional runs in a future version to compare scores and deltas side by
          side.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<AppView>({ screen: 'overview' })

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header
        onOverview={() => setView({ screen: 'overview' })}
        onRemediation={() => setView({ screen: 'remediation' })}
        onComparison={() => setView({ screen: 'comparison' })}
      />
      <main className="mx-auto max-w-[960px] px-6 py-10 pb-20">
        {view.screen === 'overview' && (
          <Overview
            onCluster={(id) => setView({ screen: 'cluster', clusterId: id })}
            onDimension={(id) => setView({ screen: 'dimension', dimensionId: id })}
            onRemediation={() => setView({ screen: 'remediation' })}
          />
        )}
        {view.screen === 'cluster' && (
          <ClusterDetail
            clusterId={view.clusterId}
            onCluster={(id) => setView({ screen: 'cluster', clusterId: id })}
            onDimension={(id) => setView({ screen: 'dimension', dimensionId: id })}
            onOverview={() => setView({ screen: 'overview' })}
          />
        )}
        {view.screen === 'dimension' && (
          <DimensionDetail
            dimensionId={view.dimensionId}
            onCluster={(id) => setView({ screen: 'cluster', clusterId: id })}
            onDimension={(id) => setView({ screen: 'dimension', dimensionId: id })}
            onOverview={() => setView({ screen: 'overview' })}
          />
        )}
        {view.screen === 'remediation' && (
          <RemediationView
            onCluster={(id) => setView({ screen: 'cluster', clusterId: id })}
            onDimension={(id) => setView({ screen: 'dimension', dimensionId: id })}
            onOverview={() => setView({ screen: 'overview' })}
          />
        )}
        {view.screen === 'comparison' && (
          <ComparisonView onOverview={() => setView({ screen: 'overview' })} />
        )}
      </main>
    </div>
  )
}
