import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AuditSystem, DimensionReferenceJSON } from '../data/types'
import {
  clusterForDimension,
  dimensionNarrative,
  findingsForDimension,
  remediationForDimension,
  getMergedFinding,
  getMergedRemItem,
  severityColor,
  tierDef,
} from '../data/loader'
import { LabelCaps, Breadcrumbs, SeverityBadge, SeverityDot } from '../components'

export default function DimensionDetail({ system, dimensionRef }: {
  system: AuditSystem
  dimensionRef: DimensionReferenceJSON
}) {
  const { dimensionId } = useParams<{ dimensionId: string }>()
  const { audit, editorial, remediation } = system

  if (!dimensionId) return <p>Dimension not found.</p>

  // Find the dimension in audit clusters
  const clusterId = clusterForDimension(audit, dimensionId)
  if (!clusterId) return <p>Dimension "{dimensionId}" not found in any cluster.</p>

  const cluster = audit.clusters[clusterId]
  const dim = cluster.dimensions[dimensionId]
  if (!dim) return <p>Dimension data not found.</p>

  const ref = dimensionRef.dimensions[dimensionId]
  const name = ref?.name ?? dimensionId.replace(/^\d+\.\d+_/, '').replace(/_/g, ' ')
  const narrative = dimensionNarrative(dim, dimensionId, editorial)
  const findings = findingsForDimension(audit, dimensionId).map(f => getMergedFinding(f, editorial))
  const remItems = remediationForDimension(remediation.items, dimensionId).map(i => getMergedRemItem(i, editorial))
  const scoreColor = severityColor(dim.severity)

  return (
    <div className="w-full">
      <Breadcrumbs items={[
        { label: 'Overview', to: '/' },
        { label: cluster.cluster_name, to: `/cluster/${clusterId}` },
        { label: name },
      ]} />

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <LabelCaps className="mb-2">{cluster.cluster_name}</LabelCaps>
          <h1 className="text-[36px] font-medium tracking-tight m-0" style={{ color: 'white' }}>{name}</h1>
        </div>
        <div className="text-right flex items-center gap-4">
          <div>
            <div className="text-[48px] font-medium leading-none tracking-tight" style={{ color: scoreColor }}>
              {dim.score !== null ? dim.score : 'N/A'}
              <span className="text-[24px] ml-1" style={{ opacity: 0.5 }}>/{dim.score_max}</span>
            </div>
            <div className="mt-2">
              <SeverityBadge severity={dim.severity} />
            </div>
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div className="p-8 mb-8" style={{ backgroundColor: '#161616', borderRadius: '24px' }}>
        <LabelCaps className="mb-3">Analysis</LabelCaps>
        <p className="text-[15px] leading-relaxed m-0" style={{ opacity: 0.8 }}>{narrative}</p>
      </div>

      {/* Description from dimension reference */}
      {ref && (
        <div className="p-8 mb-8" style={{ backgroundColor: '#161616', borderRadius: '24px' }}>
          <LabelCaps className="mb-3">What This Measures</LabelCaps>
          <p className="text-[15px] leading-relaxed m-0" style={{ opacity: 0.7 }}>{ref.plain_description}</p>
          {ref.evidence_sources.length > 0 && (
            <div className="mt-4 flex gap-2">
              {ref.evidence_sources.map(s => (
                <span key={s} className="text-[11px] uppercase tracking-wider px-3 py-1 rounded-full" style={{ border: '1px solid rgba(245, 233, 200, 0.15)', opacity: 0.6 }}>
                  {s === 'Both' ? 'Figma + Code' : s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Score Rubric */}
      {ref?.score_levels && (
        <div className="mb-8">
          <LabelCaps className="mb-4">Score Scale</LabelCaps>
          <div className="flex flex-col gap-2">
            {Object.entries(ref.score_levels).map(([level, description]) => {
              const levelNum = parseInt(level)
              const isCurrentScore = dim.score === levelNum
              const levelSeverity = levelNum <= 1 ? 'blocker' : levelNum === 2 ? 'warning' : levelNum === 3 ? 'note' : 'pass'
              const color = severityColor(levelSeverity)

              return (
                <div
                  key={level}
                  className="flex items-start gap-4 p-4"
                  style={{
                    backgroundColor: isCurrentScore ? `${color}10` : '#161616',
                    borderRadius: '16px',
                    border: isCurrentScore ? `1px solid ${color}40` : '1px solid transparent',
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[14px] font-medium" style={{ backgroundColor: `${color}20`, color }}>
                    {level}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] leading-relaxed m-0" style={{ opacity: isCurrentScore ? 1 : 0.6 }}>
                      {description}
                    </p>
                    {isCurrentScore && (
                      <span className="text-[11px] uppercase tracking-wider font-medium mt-1 inline-block" style={{ color }}>← Current Score</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div className="mb-8">
          <LabelCaps className="mb-4">Findings ({findings.length})</LabelCaps>
          <div className="flex flex-col gap-4">
            {findings.map(f => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {/* Remediation */}
      {remItems.length > 0 && (
        <div className="mb-8">
          <LabelCaps className="mb-4">Remediation Actions</LabelCaps>
          <div className="flex flex-col gap-3">
            {remItems.map(item => (
              <div key={item.id} className="p-6" style={{ backgroundColor: '#161616', borderRadius: '24px' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ border: '1px solid rgba(245, 233, 200, 0.15)', opacity: 0.6 }}>
                    {tierDef(item.priority_tier, editorial).label} · {item.ownership} · {item.effort_estimate}
                  </span>
                </div>
                <p className="text-[14px] font-medium m-0 mb-2">
                  {item.action_type && (
                    <span className="text-[11px] uppercase tracking-wider font-medium mr-2" style={{ opacity: 0.5 }}>
                      {item.action_type.charAt(0).toUpperCase() + item.action_type.slice(1)}:
                    </span>
                  )}
                  {item.action}
                </p>
                {item.value_framing && (
                  <p className="text-[13px] m-0 mt-3" style={{ opacity: 0.5 }}>{item.value_framing}</p>
                )}
                {item.projected_score_improvement && (
                  <p className="text-[12px] m-0 mt-2" style={{ opacity: 0.4, color: '#4ADE80' }}>{item.projected_score_improvement}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FindingCard({ finding }: { finding: ReturnType<typeof getMergedFinding> }) {
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
          <div className="flex items-center justify-end mb-2">
            <SeverityBadge severity={finding.severity} />
          </div>
          <p className="text-[14px] font-medium m-0 mb-1">{finding.summary}</p>
          {expanded && (
            <div className="mt-4">
              <p className="text-[13px] leading-relaxed m-0 mb-4" style={{ opacity: 0.7 }}>{finding.description}</p>
              <div className="p-4" style={{ backgroundColor: 'rgba(74, 222, 128, 0.05)', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                <LabelCaps className="mb-2" style={{ color: '#4ADE80', opacity: 0.8 }}>Recommendation</LabelCaps>
                <p className="text-[13px] leading-relaxed m-0" style={{ opacity: 0.8 }}>{finding.recommendation}</p>
              </div>
              {finding.auto_fixable && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded" style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ADE80' }}>Auto-fixable</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
