import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuditSystem } from '../data/types'
import { getMergedFinding, clusterForDimension } from '../data/loader'
import { LabelCaps, FilterButton, SeverityDot, SeverityBadge } from '../components'

type SeverityFilter = 'all' | 'blocker' | 'warning' | 'note' | 'pass'

export default function FindingList({ system }: { system: AuditSystem }) {
  const navigate = useNavigate()
  const { audit, editorial } = system
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [clusterFilter, setClusterFilter] = useState<string>('all')

  const { remediation } = system
  const mergedFindings = audit.findings.map(f => getMergedFinding(f, editorial))

  // Get unique clusters from findings
  const clusterKeys = [...new Set(
    mergedFindings.map(f => clusterForDimension(audit, f.dimension)).filter(Boolean)
  )] as string[]

  // Build finding_id → priority_tier map from remediation items
  const findingTierMap = new Map<string, number>()
  remediation.items.forEach(item => {
    const tier = item.priority_tier
    ;(item.finding_ids ?? []).forEach(fid => {
      const existing = findingTierMap.get(fid)
      if (existing === undefined || tier < existing) findingTierMap.set(fid, tier)
    })
  })

  // Sort by tier ascending (tier 1 first), then severity_rank descending
  const sorted = [...mergedFindings].sort((a, b) => {
    const tierA = findingTierMap.get(a.id) ?? 999
    const tierB = findingTierMap.get(b.id) ?? 999
    if (tierA !== tierB) return tierA - tierB
    return b.severity_rank - a.severity_rank
  })

  const filtered = sorted.filter(f => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false
    if (clusterFilter !== 'all') {
      const cid = clusterForDimension(audit, f.dimension)
      if (cid !== clusterFilter) return false
    }
    return true
  })

  // Severity counts
  const counts = {
    all: mergedFindings.length,
    blocker: mergedFindings.filter(f => f.severity === 'blocker').length,
    warning: mergedFindings.filter(f => f.severity === 'warning').length,
    note: mergedFindings.filter(f => f.severity === 'note').length,
    pass: mergedFindings.filter(f => f.severity === 'pass').length,
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[44px] font-medium tracking-tight m-0 mb-3" style={{ color: 'white' }}>Findings</h1>
          <p className="text-[15px] m-0" style={{ color: 'rgba(245, 233, 200, 0.6)' }}>
            What the audit found: {mergedFindings.length} findings across all dimensions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-6 mb-8 items-center">
        <div className="flex gap-2">
          {(['all', 'blocker', 'warning', 'note', 'pass'] as SeverityFilter[]).map(sev => (
            <FilterButton
              key={sev}
              label={`${sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)} (${counts[sev]})`}
              isActive={severityFilter === sev}
              onClick={() => setSeverityFilter(sev)}
            />
          ))}
        </div>
        <select
          value={clusterFilter}
          onChange={e => setClusterFilter(e.target.value)}
          className="text-[12px] font-medium px-3 py-2 rounded-full cursor-pointer"
          style={{ backgroundColor: 'rgba(245, 233, 200, 0.1)', color: '#F5E9C8', border: '1px solid rgba(245, 233, 200, 0.2)' }}
        >
          <option value="all" style={{ backgroundColor: '#161616' }}>All Clusters</option>
          {clusterKeys.map(key => (
            <option key={key} value={key} style={{ backgroundColor: '#161616' }}>
              {audit.clusters[key]?.cluster_name ?? key}
            </option>
          ))}
        </select>
      </div>

      {/* Findings list */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 && (
          <p className="text-[14px]" style={{ opacity: 0.4 }}>No findings match the current filters.</p>
        )}
        {filtered.map(f => {
          const clusterId = clusterForDimension(audit, f.dimension)
          const clusterName = clusterId ? audit.clusters[clusterId]?.cluster_name : ''
          return (
            <FindingRow
              key={f.id}
              finding={f}
              clusterName={clusterName ?? ''}
              onClick={() => navigate(`/dimension/${f.dimension}`)}
            />
          )
        })}
      </div>
    </div>
  )
}

function FindingRow({ finding, clusterName, onClick }: {
  finding: ReturnType<typeof getMergedFinding>
  clusterName: string
  onClick: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="p-6 cursor-pointer"
      style={{ backgroundColor: '#161616', borderRadius: '24px', border: '1px solid rgba(245, 233, 200, 0.05)' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <SeverityDot severity={finding.severity} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-widest font-mono" style={{ opacity: 0.6 }}>{finding.id}</span>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-sm" style={{ opacity: 0.5, backgroundColor: '#0C0C0C' }}>
                {clusterName}
              </span>
            </div>
            <SeverityBadge severity={finding.severity} />
          </div>
          <p className="text-[14px] font-medium m-0">{finding.summary}</p>

          {expanded && (
            <div className="mt-4">
              <p className="text-[13px] leading-relaxed m-0 mb-4" style={{ opacity: 0.7 }}>{finding.description}</p>
              <div className="p-4" style={{ backgroundColor: 'rgba(74, 222, 128, 0.05)', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                <LabelCaps className="mb-2" style={{ color: '#4ADE80', opacity: 0.8 }}>Recommendation</LabelCaps>
                <p className="text-[13px] leading-relaxed m-0" style={{ opacity: 0.8 }}>{finding.recommendation}</p>
              </div>
              <div className="mt-3 flex gap-2">
                {finding.auto_fixable && (
                  <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded" style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ADE80' }}>Auto-fixable</span>
                )}
                <button
                  className="text-[11px] uppercase tracking-wider px-3 py-1 rounded cursor-pointer"
                  style={{ backgroundColor: 'rgba(245, 233, 200, 0.1)', color: '#F5E9C8', border: 'none' }}
                  onClick={e => { e.stopPropagation(); onClick() }}
                >
                  View Dimension →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
