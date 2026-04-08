import type {
  AuditJSON,
  RemediationJSON,
  EditorialJSON,
  DimensionReferenceJSON,
  ScoringWeightsJSON,
  AuditSystem,
  AppData,
  Finding,
  RemediationItem,
  ClusterAudit,
  DimensionAudit,
  Severity,
} from './types'

// ── Static JSON imports from sibling repo ──

import muiAudit from '@audit/audit/material-ui/v3.1/mui-audit-v3.1.json'
import muiRemediation from '@audit/audit/material-ui/v3.1/mui-remediation-v3.1.json'
import muiEditorial from '@audit/audit/material-ui/v3.1/mui-editorial-v3.1.json'
import carbonAudit from '@audit/audit/carbon/v3.1/carbon-audit-v3.1.json'
import carbonRemediation from '@audit/audit/carbon/v3.1/carbon-remediation-v3.1.json'
import carbonEditorial from '@audit/audit/carbon/v3.1/carbon-editorial-v3.1.json'
import dimensionRefData from '@audit/data/dimension-reference.json'
import scoringWeightsData from '@audit/config/scoring-weights.json'

// ── Editorial merge ──

function mergeVal<T>(auditVal: T, editorialVal: T | undefined | null): T {
  return editorialVal ?? auditVal
}

/** Apply editorial overrides to a finding. */
function mergeFinding(f: Finding, editorial: EditorialJSON): Finding {
  const ed = editorial.findings?.[f.id]
  if (!ed) return f
  return {
    ...f,
    summary: mergeVal(f.summary, ed.summary),
    description: mergeVal(f.description, ed.description),
    recommendation: mergeVal(f.recommendation, ed.recommendation),
  }
}

/** Apply editorial overrides to a remediation item. */
function mergeRemediationItem(item: RemediationItem, editorial: EditorialJSON): RemediationItem {
  const ed = editorial.remediation?.[item.id]
  if (!ed) return item
  return {
    ...item,
    action: mergeVal(item.action, ed.action),
    value_framing: mergeVal(item.value_framing, ed.value_framing),
  }
}

// ── Build app data ──

function buildSystem(
  id: string,
  name: string,
  version: string,
  audit: AuditJSON,
  remediation: RemediationJSON,
  editorial: EditorialJSON,
): AuditSystem {
  return { id, name, version, audit, remediation, editorial }
}

export function loadAppData(): AppData {
  return {
    systems: [
      buildSystem(
        'material-ui',
        'Material UI',
        'v3.1',
        muiAudit as unknown as AuditJSON,
        muiRemediation as unknown as RemediationJSON,
        muiEditorial as unknown as EditorialJSON,
      ),
      buildSystem(
        'carbon',
        'Carbon',
        'v3.1',
        carbonAudit as unknown as AuditJSON,
        carbonRemediation as unknown as RemediationJSON,
        carbonEditorial as unknown as EditorialJSON,
      ),
    ],
    dimensionRef: dimensionRefData as unknown as DimensionReferenceJSON,
    scoringWeights: scoringWeightsData as unknown as ScoringWeightsJSON,
  }
}

// ── Accessor helpers ──

export const CLUSTER_ORDER = [
  '0_prerequisites',
  '1_token_and_variable_system',
  '2_component_quality',
  '3_documentation_and_intent',
  '4_design_quality_baseline',
  '5_governance_and_ecosystem',
  '6_design_to_code_parity',
] as const

/** Get editorial cluster narrative, falling back to audit cluster_summary. */
export function clusterNarrative(cluster: ClusterAudit, clusterKey: string, editorial: EditorialJSON): string {
  return editorial.clusters?.[clusterKey]?.narrative ?? cluster.cluster_summary
}

/** Get editorial dimension narrative, falling back to audit narrative. */
export function dimensionNarrative(dim: DimensionAudit, dimKey: string, editorial: EditorialJSON): string {
  return editorial.dimensions?.[dimKey]?.narrative ?? dim.narrative
}

/** Get editorial value framing for a cluster. */
export function clusterValueFraming(clusterKey: string, editorial: EditorialJSON): string | undefined {
  return editorial.clusters?.[clusterKey]?.value_framing
}

/** Get merged finding (editorial overrides applied). */
export function getMergedFinding(finding: Finding, editorial: EditorialJSON): Finding {
  return mergeFinding(finding, editorial)
}

/** Get merged remediation item. */
export function getMergedRemItem(item: RemediationItem, editorial: EditorialJSON): RemediationItem {
  return mergeRemediationItem(item, editorial)
}

/** Look up which cluster a dimension belongs to. */
export function clusterForDimension(audit: AuditJSON, dimensionId: string): string | undefined {
  for (const [cid, cluster] of Object.entries(audit.clusters)) {
    if (cluster.dimensions[dimensionId]) return cid
  }
  return undefined
}

/** Get all findings for a given dimension key. */
export function findingsForDimension(audit: AuditJSON, dimensionId: string): Finding[] {
  return audit.findings.filter(f => f.dimension === dimensionId)
}

/** Get all findings for a given cluster. */
export function findingsForCluster(audit: AuditJSON, clusterId: string): Finding[] {
  const cluster = audit.clusters[clusterId]
  if (!cluster) return []
  const dimKeys = new Set(Object.keys(cluster.dimensions))
  return audit.findings.filter(f => dimKeys.has(f.dimension))
}

/** Get remediation items for a given cluster. */
export function remediationForCluster(items: RemediationItem[], clusterId: string): RemediationItem[] {
  return items.filter(i => i.affected_cluster === clusterId)
}

/** Get remediation items for a given dimension. */
export function remediationForDimension(items: RemediationItem[], dimensionId: string): RemediationItem[] {
  return items.filter(i => i.affected_dimensions.includes(dimensionId))
}

/** Sort remediation items: priority_tier asc, effort asc, severity desc */
const EFFORT_ORDER: Record<string, number> = { hours: 0, days: 1, weeks: 2 }

export function sortRemediation(items: RemediationItem[]): RemediationItem[] {
  return [...items].sort((a, b) => {
    if (a.priority_tier !== b.priority_tier) return a.priority_tier - b.priority_tier
    const ea = EFFORT_ORDER[a.effort_estimate] ?? 9
    const eb = EFFORT_ORDER[b.effort_estimate] ?? 9
    return ea - eb
  })
}

/** Group remediation by priority tier. */
export function remediationByTier(items: RemediationItem[]): { tier1: RemediationItem[]; tier2: RemediationItem[]; tier3: RemediationItem[] } {
  return {
    tier1: sortRemediation(items.filter(i => i.priority_tier === 1)),
    tier2: sortRemediation(items.filter(i => i.priority_tier === 2)),
    tier3: sortRemediation(items.filter(i => i.priority_tier === 3)),
  }
}

/** Resolve top blocker IDs to finding objects. */
export function resolveTopBlockers(audit: AuditJSON): Finding[] {
  return audit.summary.top_blockers
    .map(id => audit.findings.find(f => f.id === id))
    .filter((f): f is Finding => f != null)
}

/** Severity color mapping. */
export function severityColor(severity: Severity | null | string): string {
  switch (severity) {
    case 'blocker': return '#FF6B6B'
    case 'warning': return '#F5A623'
    case 'note':
    case 'pass': return '#4ADE80'
    default: return '#888888'
  }
}

/** Score to severity. */
export function scoreToSeverity(score: number | null, scoreMax: number): Severity | null {
  if (score === null) return null
  if (scoreMax <= 2) {
    if (score <= 0) return 'blocker'
    if (score === 1) return 'warning'
    return 'pass'
  }
  if (score <= 1) return 'blocker'
  if (score === 2) return 'warning'
  if (score === 3) return 'note'
  return 'pass'
}

/** Readiness label. */
export const READINESS_LABELS: Record<string, string> = {
  not_ready: 'Not ready for AI-assisted workflows',
  conditional_pass: 'Conditionally ready',
  pass: 'Ready for AI-assisted workflows',
}

/** Cluster display number (for the UI, 0-indexed → 1-indexed). */
export function clusterDisplayNumber(clusterKey: string): number {
  const idx = CLUSTER_ORDER.indexOf(clusterKey as typeof CLUSTER_ORDER[number])
  return idx === -1 ? 0 : idx
}
