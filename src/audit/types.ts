export type PhaseReadiness = 'not_ready' | 'conditional_pass' | 'pass'

export type Severity = 'blocker' | 'warning' | 'note' | 'pass' | null

export interface DimensionAudit {
  score: number | null
  score_max: number
  severity: Severity
  narrative: string
  evidence_sources: string[]
  finding_ids: string[]
  tier?: number
}

export interface ClusterAudit {
  cluster_name: string
  cluster_summary: string
  cluster_score: number
  dimensions: Record<string, DimensionAudit>
}

export interface Finding {
  id: string
  dimension: string
  severity: string
  severity_rank: number
  summary: string
  description: string
  recommendation: string
}

export interface RemediationItem {
  action: string
  affected_cluster: string
  affected_dimensions: string[]
  effort_estimate: string
  ownership: string
  projected_score_improvement: string
  finding_ids?: string[]
}

export interface Remediation {
  quick_wins: RemediationItem[]
  foundational_blockers: RemediationItem[]
  post_migration: RemediationItem[]
}

export interface DataGap {
  id: string
  description: string
  reason: string
  impact: string
}

export interface AuditMeta {
  system_name: string
  audit_date: string
}

export interface AuditSummary {
  overall_score: number
  phase_readiness: PhaseReadiness
  blocker_count: number
  cluster_scores: Record<string, number>
}

export interface AuditFile {
  meta: AuditMeta
  summary: AuditSummary
  clusters: Record<string, ClusterAudit>
  findings: Finding[]
  remediation: Remediation
  data_gaps: DataGap[]
}

export interface DimensionRefEntry {
  name: string
  cluster: string
  description: string
  evidence_sources: string[]
  score_levels: Record<string, string>
}

export interface DimensionReferenceFile {
  dimensions: Record<string, DimensionRefEntry>
}

export interface ScoringWeightsFile {
  clusters: Record<string, { weight: number }>
}

export type AppView =
  | { screen: 'overview' }
  | { screen: 'cluster'; clusterId: string }
  | { screen: 'dimension'; dimensionId: string }
  | { screen: 'remediation' }
  | { screen: 'comparison' }
