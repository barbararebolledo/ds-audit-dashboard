import type { AuditFile, DimensionAudit, Finding, RemediationItem } from './types'

export const CLUSTER_ORDER = [
  '0_prerequisites',
  '1_token_and_variable_system',
  '2_component_quality',
  '3_documentation_and_intent',
  '4_design_quality_baseline',
  '5_governance_and_ecosystem',
  '6_design_to_code_parity',
] as const

export function dimensionSlug(dimensionId: string): string {
  return dimensionId.replace(/^\d+\.\d+_/, '')
}

export function findDimensionKeyForSlug(
  audit: AuditFile,
  slug: string
): string | undefined {
  for (const cid of CLUSTER_ORDER) {
    const cluster = audit.clusters[cid]
    if (!cluster) continue
    for (const dimKey of Object.keys(cluster.dimensions)) {
      if (dimensionSlug(dimKey) === slug) return dimKey
    }
  }
  return undefined
}

export function clusterIdForDimension(audit: AuditFile, dimensionId: string): string | undefined {
  for (const cid of CLUSTER_ORDER) {
    const c = audit.clusters[cid]
    if (c?.dimensions[dimensionId]) return cid
  }
  return undefined
}

/** Cluster average on 0–4 scale from percentage (cluster_score = avg × 25). */
export function clusterAvgScore(clusterScorePercent: number): number {
  return clusterScorePercent / 25
}

export function prerequisitesFails(audit: AuditFile): boolean {
  const c0 = audit.clusters['0_prerequisites']
  if (!c0) return false
  return clusterAvgScore(c0.cluster_score) < 2
}

const SEV_ORDER: Record<string, number> = {
  blocker: 0,
  warning: 1,
  note: 2,
  pass: 3,
}

export function sortDimensionsForTable(
  entries: [string, DimensionAudit][]
): [string, DimensionAudit][] {
  return [...entries].sort((a, b) => {
    const [ka, da] = a
    const [kb, db] = b
    const sa = da.score === null ? 5 : SEV_ORDER[da.severity ?? ''] ?? 6
    const sb = db.score === null ? 5 : SEV_ORDER[db.severity ?? ''] ?? 6
    if (sa !== sb) return sa - sb
    return ka.localeCompare(kb)
  })
}

export function findingCountForCluster(audit: AuditFile, clusterId: string): number {
  const cluster = audit.clusters[clusterId]
  if (!cluster) return 0
  const dimKeys = new Set(Object.keys(cluster.dimensions))
  return audit.findings.filter((f) => {
    const dk = findDimensionKeyForSlug(audit, f.dimension)
    return dk && dimKeys.has(dk)
  }).length
}

export function blockerFindingCountForCluster(audit: AuditFile, clusterId: string): number {
  const cluster = audit.clusters[clusterId]
  if (!cluster) return 0
  const dimKeys = new Set(Object.keys(cluster.dimensions))
  return audit.findings.filter((f) => {
    if (f.severity !== 'blocker') return false
    const dk = findDimensionKeyForSlug(audit, f.dimension)
    return dk && dimKeys.has(dk)
  }).length
}

export function clusterRank(clusterId: string): number {
  const i = CLUSTER_ORDER.indexOf(clusterId as (typeof CLUSTER_ORDER)[number])
  return i === -1 ? 999 : i
}

export function topBlockers(audit: AuditFile, limit = 5): Finding[] {
  const blockers = audit.findings.filter((f) => f.severity === 'blocker')
  return [...blockers]
    .sort((a, b) => {
      if (b.severity_rank !== a.severity_rank) return b.severity_rank - a.severity_rank
      const ka = findDimensionKeyForSlug(audit, a.dimension)
      const kb = findDimensionKeyForSlug(audit, b.dimension)
      const ca = ka ? clusterIdForDimension(audit, ka) : ''
      const cb = kb ? clusterIdForDimension(audit, kb) : ''
      return clusterRank(ca ?? '') - clusterRank(cb ?? '')
    })
    .slice(0, limit)
}

export function findingsForCluster(audit: AuditFile, clusterId: string): Finding[] {
  const cluster = audit.clusters[clusterId]
  if (!cluster) return []
  const dimKeys = new Set(Object.keys(cluster.dimensions))
  return audit.findings
    .filter((f) => {
      const dk = findDimensionKeyForSlug(audit, f.dimension)
      return dk && dimKeys.has(dk)
    })
    .sort((a, b) => b.severity_rank - a.severity_rank)
}

export function findingsForDimension(audit: AuditFile, dimensionId: string): Finding[] {
  const slug = dimensionSlug(dimensionId)
  return audit.findings.filter((f) => f.dimension === slug)
}

export function allRemediationItems(audit: AuditFile): RemediationItem[] {
  const r = audit.remediation
  return [...r.quick_wins, ...r.foundational_blockers, ...r.post_migration]
}

export function remediationForCluster(audit: AuditFile, clusterId: string): RemediationItem[] {
  return allRemediationItems(audit).filter((item) => item.affected_cluster === clusterId)
}

export function remediationForDimension(audit: AuditFile, dimensionId: string): RemediationItem[] {
  return allRemediationItems(audit).filter((item) =>
    item.affected_dimensions.includes(dimensionId)
  )
}

export function remediationTierCounts(audit: AuditFile) {
  return {
    quickWins: audit.remediation.quick_wins.length,
    foundational: audit.remediation.foundational_blockers.length,
    postMigration: audit.remediation.post_migration.length,
  }
}

/** Item counts by ownership and effort estimate (for overview summary). */
export function effortByOwnership(
  audit: AuditFile
): Map<string, { hours: number; days: number; weeks: number; other: number }> {
  const map = new Map<string, { hours: number; days: number; weeks: number; other: number }>()
  for (const item of allRemediationItems(audit)) {
    const o = item.ownership
    if (!map.has(o)) {
      map.set(o, { hours: 0, days: 0, weeks: 0, other: 0 })
    }
    const row = map.get(o)!
    const e = item.effort_estimate
    if (e === 'hours') row.hours += 1
    else if (e === 'days') row.days += 1
    else if (e === 'weeks') row.weeks += 1
    else row.other += 1
  }
  return map
}

const EFF_SORT: Record<string, number> = { weeks: 0, days: 1, hours: 2 }

export function sortRemediationByEffort(items: RemediationItem[]): RemediationItem[] {
  return [...items].sort(
    (a, b) => (EFF_SORT[a.effort_estimate] ?? 9) - (EFF_SORT[b.effort_estimate] ?? 9)
  )
}

export function scoreBarTone(score: number | null, scoreMax: number): 'fail' | 'partial' | 'pass' | 'na' {
  if (score === null) return 'na'
  const max = scoreMax <= 2 ? 2 : 4
  const n = max === 2 ? score : score
  if (max === 2) {
    if (n <= 0) return 'fail'
    if (n === 1) return 'partial'
    return 'pass'
  }
  if (n <= 1) return 'fail'
  if (n === 2) return 'partial'
  return 'pass'
}

export const READINESS_COPY: Record<string, string> = {
  not_ready: 'Not ready for AI-assisted workflows',
  conditional_pass: 'Conditionally ready with significant gaps',
  pass: 'Ready for AI-assisted workflows',
}

export const SCORE_LABELS_0_4 = [
  'absent',
  'minimal',
  'partial',
  'substantial',
  'comprehensive',
] as const
