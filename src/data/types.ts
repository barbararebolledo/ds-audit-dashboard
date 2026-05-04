// ── Audit JSON (schema v3.0) ──

export type PhaseReadiness = 'not_ready' | 'conditional_pass' | 'pass'
export type Severity = 'blocker' | 'warning' | 'note' | 'pass'

export interface AuditMeta {
  schema_version: string
  system_name: string
  audit_date: string
  run_id: string
  audit_id: string
  timestamp: string
  auditor: string
  prompt_version: string
  git_tag: string
  target_system: string
  figma_files: Record<string, { file_key: string; file_version: string; file_name: string }>
  evidence_sources: string[]
}

export interface PhaseReadinessDetail {
  blocking_dimensions: string[]
  warning_dimensions: string[]
  conditions_for_advancement: string[]
}

export interface AuditSummary {
  overall_score: number
  phase_readiness: PhaseReadiness
  phase_readiness_detail: PhaseReadinessDetail
  top_blockers: string[]
  blocker_count: number
  dimension_scores: Record<string, number | null>
  cluster_scores: Record<string, number>
  dimensions_scored: number
  dimensions_total: number
  dimensions_null: number
  component_count?: number
}

export interface DimensionAudit {
  score: number | null
  score_max: number
  severity: Severity | null
  tier?: number
  narrative: string
  evidence_sources: string[]
  finding_ids: string[]
  sub_check_scores?: Record<string, number>
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
  severity: Severity
  severity_rank: number
  summary: string
  description: string
  evidence?: string | string[]
  recommendation: string
  contract_ref?: { type: string; level: string | null; path: string | null; field: string }
  affected_components?: string[]
  auto_fixable?: boolean
}

export interface DataGap {
  id: string
  description: string
  reason: string
  affected_components?: string[]
  impact: string
}

export interface AuditJSON {
  meta: AuditMeta
  summary: AuditSummary
  clusters: Record<string, ClusterAudit>
  findings: Finding[]
  data_gaps: DataGap[]
  config_ref?: { path: string; version: string }
}

// ── Remediation JSON (schema v1.0) ──

export interface RemediationItem {
  id: string
  action: string
  action_type?: 'move' | 'rework' | 'create'
  affected_cluster: string
  affected_dimensions: string[]
  effort_estimate: 'hours' | 'days' | 'weeks'
  ownership: 'design' | 'engineering' | 'both'
  priority_tier: 1 | 2 | 3
  remediation_type: 'relocate' | 'refactor' | 'rebuild'
  value_framing?: string
  impact_categories?: ('correction_cycles' | 'theme_rework' | 'parity_defects' | 'token_efficiency')[]
  projected_score_improvement?: string
  finding_ids?: string[]
}

export interface RemediationJSON {
  meta: { audit_id: string; system_name: string; schema_version: string; generated_at: string }
  items: RemediationItem[]
}

// ── Editorial JSON (schema v1.0) ──

export interface TierDefinition {
  label?: string
  value_framing?: string
}

export interface EditorialJSON {
  meta: { schema_version: string; audit_ref: string }
  report?: {
    title?: string
    executive_summary?: string
    methodology_note?: string
  }
  tiers?: {
    '1'?: TierDefinition
    '2'?: TierDefinition
    '3'?: TierDefinition
  }
  clusters?: Record<string, { narrative?: string; value_framing?: string }>
  dimensions?: Record<string, { narrative?: string }>
  findings?: Record<string, { summary?: string; description?: string; recommendation?: string }>
  remediation?: Record<string, { action?: string; value_framing?: string }>
}

// ── Dimension Reference ──

export interface DimensionRefEntry {
  name: string
  cluster: string
  description: string
  evidence_sources: string[]
  score_levels: Record<string, string>
}

export interface DimensionReferenceJSON {
  version: string
  dimensions: Record<string, DimensionRefEntry>
}

// ── Scoring Weights ──

export interface ScoringWeightsJSON {
  version: string
  clusters: Record<string, { weight: number; dimensions: Record<string, { weight: number }> }>
}

// ── Merged data for a single audit system ──

export interface AuditSystem {
  id: string
  name: string
  version: string
  audit: AuditJSON
  remediation: RemediationJSON
  editorial: EditorialJSON
}

// ── App-level data context ──

export interface AppData {
  systems: AuditSystem[]
  dimensionRef: DimensionReferenceJSON
  scoringWeights: ScoringWeightsJSON
}

// ── Navigation ──

export type AppView =
  | { page: 'overview' }
  | { page: 'remediation' }
  | { page: 'benchmark' }
  | { page: 'impact' }
  | { page: 'cluster'; clusterId: string }
  | { page: 'dimension'; dimensionId: string }
  | { page: 'findings' }
