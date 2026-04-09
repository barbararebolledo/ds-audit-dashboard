import { useParams, useNavigate } from 'react-router-dom'
import type { AuditSystem, DimensionReferenceJSON } from '../data/types'
import {
  clusterNarrative,
  findingsForCluster,
  remediationForCluster,
  getMergedFinding,
  getMergedRemItem,
  severityColor,
  clusterDisplayNumber,
} from '../data/loader'
import { LabelCaps, Breadcrumbs, SeverityBadge, SeverityDot } from '../components'

export default function ClusterDetail({ system, dimensionRef }: {
  system: AuditSystem
  dimensionRef: DimensionReferenceJSON
}) {
  const { clusterId } = useParams<{ clusterId: string }>()
  const navigate = useNavigate()
  const { audit, editorial, remediation } = system

  if (!clusterId || !audit.clusters[clusterId]) {
    return <p>Cluster not found.</p>
  }

  const cluster = audit.clusters[clusterId]
  const narrative = clusterNarrative(cluster, clusterId, editorial)
  const findings = findingsForCluster(audit, clusterId).map(f => getMergedFinding(f, editorial))
  const remItems = remediationForCluster(remediation.items, clusterId).map(i => getMergedRemItem(i, editorial))
  const clusterNum = clusterDisplayNumber(clusterId)

  // Sort dimensions: blockers first, then by key
  const dimEntries = Object.entries(cluster.dimensions).sort((a, b) => {
    const sevOrder: Record<string, number> = { blocker: 0, warning: 1, note: 2, pass: 3 }
    const sa = sevOrder[a[1].severity ?? 'pass'] ?? 4
    const sb = sevOrder[b[1].severity ?? 'pass'] ?? 4
    if (sa !== sb) return sa - sb
    return a[0].localeCompare(b[0])
  })

  return (
    <div className="w-full">
      <Breadcrumbs items={[
        { label: 'Overview', to: '/' },
        { label: cluster.cluster_name },
      ]} />

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <LabelCaps className="mb-2">Cluster {clusterNum}</LabelCaps>
          <h1 className="text-[44px] font-medium tracking-tight m-0" style={{ color: 'white' }}>
            {cluster.cluster_name}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[48px] font-medium leading-none tracking-tight" style={{ color: cluster.cluster_score < 50 ? '#FF6B6B' : cluster.cluster_score < 75 ? '#F5A623' : '#4ADE80' }}>
            {cluster.cluster_score.toFixed(1)}%
          </div>
          <LabelCaps className="mt-1">Cluster Score</LabelCaps>
        </div>
      </div>

      {/* Narrative */}
      <div className="p-8 mb-8" style={{ backgroundColor: '#161616', borderRadius: '24px' }}>
        <p className="text-[15px] leading-relaxed m-0" style={{ opacity: 0.8 }}>{narrative}</p>
      </div>

      {/* Dimensions Table */}
      <LabelCaps className="mb-4">Dimensions</LabelCaps>
      <div className="mb-8 overflow-hidden" style={{ backgroundColor: '#161616', borderRadius: '24px' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(245, 233, 200, 0.1)' }}>
              <th className="text-left p-4 text-[11px] uppercase tracking-wider font-medium" style={{ opacity: 0.5 }}>Dimension</th>
              <th className="text-center p-4 text-[11px] uppercase tracking-wider font-medium w-20" style={{ opacity: 0.5 }}>Score</th>
              <th className="text-center p-4 text-[11px] uppercase tracking-wider font-medium w-28" style={{ opacity: 0.5 }}>Severity</th>
              <th className="text-center p-4 text-[11px] uppercase tracking-wider font-medium w-20" style={{ opacity: 0.5 }}>Findings</th>
              <th className="p-4 w-16" />
            </tr>
          </thead>
          <tbody>
            {dimEntries.map(([dimKey, dim]) => {
              const ref = dimensionRef.dimensions[dimKey]
              const name = ref?.name ?? dimKey.replace(/^\d+\.\d+_/, '').replace(/_/g, ' ')
              const scoreLabel = dim.score !== null ? `${dim.score}/${dim.score_max}` : 'N/A'
              const color = severityColor(dim.severity)
              const findingCount = dim.finding_ids.length

              return (
                <tr
                  key={dimKey}
                  className="cursor-pointer"
                  style={{ borderBottom: '1px solid rgba(245, 233, 200, 0.05)' }}
                  onClick={() => navigate(`/dimension/${dimKey}`)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <SeverityDot severity={dim.severity} size={8} />
                      <span className="text-[14px] font-medium">{name}</span>
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <span className="text-[14px] font-medium" style={{ color }}>{scoreLabel}</span>
                  </td>
                  <td className="text-center p-4">
                    <SeverityBadge severity={dim.severity} />
                  </td>
                  <td className="text-center p-4">
                    <span className="text-[14px]" style={{ opacity: findingCount > 0 ? 1 : 0.3 }}>{findingCount}</span>
                  </td>
                  <td className="p-4 text-right">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <>
          <LabelCaps className="mb-4">Findings ({findings.length})</LabelCaps>
          <div className="flex flex-col gap-4 mb-8">
            {findings.map(f => (
              <div
                key={f.id}
                className="p-6 cursor-pointer"
                style={{ backgroundColor: '#161616', borderRadius: '24px', border: '1px solid rgba(245, 233, 200, 0.05)' }}
                onClick={() => navigate(`/dimension/${f.dimension}`)}
              >
                <div className="flex items-start gap-3">
                  <SeverityDot severity={f.severity} />
                  <div className="flex-1">
                    <div className="flex items-center justify-end mb-2">
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="text-[14px] font-medium m-0 mb-2">{f.summary}</p>
                    <p className="text-[13px] m-0" style={{ opacity: 0.5 }}>{f.description.slice(0, 200)}{f.description.length > 200 ? '...' : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Remediation Items */}
      {remItems.length > 0 && (
        <>
          <LabelCaps className="mb-4">Remediation Actions ({remItems.length})</LabelCaps>
          <div className="flex flex-col gap-3">
            {remItems.map(item => (
              <div key={item.id} className="p-6 flex items-start justify-between" style={{ backgroundColor: '#161616', borderRadius: '24px' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ border: '1px solid rgba(245, 233, 200, 0.15)', opacity: 0.6 }}>
                      {item.ownership} · {item.effort_estimate}
                    </span>
                  </div>
                  <p className="text-[14px] font-medium m-0">{item.action}</p>
                  {item.projected_score_improvement && (
                    <p className="text-[12px] mt-2 m-0" style={{ opacity: 0.5 }}>{item.projected_score_improvement}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
