import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { AuditSystem, DimensionReferenceJSON, Finding } from '../data/types'
import {
  clusterNarrative,
  findingsForDimension,
  getMergedFinding,
  severityColor,
  clusterDisplayNumber,
  dimensionNarrative,
} from '../data/loader'
import { LabelCaps, Breadcrumbs, SeverityBadge, SeverityDot } from '../components'

export default function ClusterDetail({ system, dimensionRef }: {
  system: AuditSystem
  dimensionRef: DimensionReferenceJSON
}) {
  const { clusterId } = useParams<{ clusterId: string }>()
  const navigate = useNavigate()
  const { audit, editorial } = system

  if (!clusterId || !audit.clusters[clusterId]) {
    return <p>Cluster not found.</p>
  }

  const cluster = audit.clusters[clusterId]
  const narrative = clusterNarrative(cluster, clusterId, editorial)
  const clusterNum = clusterDisplayNumber(clusterId)

  // Sort dimensions: grouped by tier, then within each tier by severity (findings first), then alphabetical
  const sevOrder: Record<string, number> = { blocker: 0, warning: 1, note: 2, pass: 3 }
  const sortBySeverity = (entries: [string, typeof cluster.dimensions[string]][]) =>
    [...entries].sort((a, b) => {
      // Dimensions with findings first
      const aHas = a[1].finding_ids.length > 0 ? 0 : 1
      const bHas = b[1].finding_ids.length > 0 ? 0 : 1
      if (aHas !== bHas) return aHas - bHas
      const sa = sevOrder[a[1].severity ?? 'pass'] ?? 4
      const sb = sevOrder[b[1].severity ?? 'pass'] ?? 4
      if (sa !== sb) return sa - sb
      return a[0].localeCompare(b[0])
    })

  const allDimEntries = Object.entries(cluster.dimensions)
  const tier1Entries = sortBySeverity(allDimEntries.filter(([, d]) => d.score_max === 4))
  const tier2Entries = sortBySeverity(allDimEntries.filter(([, d]) => d.score_max === 2))
  const allSorted = [...tier1Entries, ...tier2Entries]

  // Default: first dimension with findings
  const defaultDim = allSorted.find(([, d]) => d.finding_ids.length > 0)?.[0] ?? allSorted[0]?.[0]
  const [selectedDim, setSelectedDim] = useState<string | null>(defaultDim ?? null)

  // Findings for the selected dimension
  const selectedDimData = selectedDim ? cluster.dimensions[selectedDim] : null
  const selectedFindings: Finding[] = selectedDim
    ? findingsForDimension(audit, selectedDim).map(f => getMergedFinding(f, editorial))
    : []
  const selectedDimName = selectedDim
    ? (dimensionRef.dimensions[selectedDim]?.name ?? selectedDim.replace(/^\d+\.\d+_/, '').replace(/_/g, ' '))
    : ''

  // Tier 1 "show all" collapse: if >3 dimensions with no findings, collapse behind a button
  const [showAllTier1, setShowAllTier1] = useState(false)
  const [showAllTier2, setShowAllTier2] = useState(false)

  const tier1NoFindings = tier1Entries.filter(([, d]) => d.finding_ids.length === 0)
  const tier1Visible = showAllTier1 || tier1NoFindings.length <= 3
    ? tier1Entries
    : [...tier1Entries.filter(([, d]) => d.finding_ids.length > 0), ...tier1NoFindings.slice(0, 3)]
  const tier1HiddenCount = tier1NoFindings.length > 3 && !showAllTier1 ? tier1NoFindings.length - 3 : 0

  const tier2NoFindings = tier2Entries.filter(([, d]) => d.finding_ids.length === 0)
  const tier2Visible = showAllTier2 || tier2NoFindings.length <= 3
    ? tier2Entries
    : [...tier2Entries.filter(([, d]) => d.finding_ids.length > 0), ...tier2NoFindings.slice(0, 3)]
  const tier2HiddenCount = tier2NoFindings.length > 3 && !showAllTier2 ? tier2NoFindings.length - 3 : 0

  function DimensionRow({ dimKey, dim }: { dimKey: string; dim: typeof cluster.dimensions[string] }) {
    const ref = dimensionRef.dimensions[dimKey]
    const name = ref?.name ?? dimKey.replace(/^\d+\.\d+_/, '').replace(/_/g, ' ')
    const scoreLabel = dim.score !== null ? `${dim.score}/${dim.score_max}` : 'N/A'
    const color = severityColor(dim.severity)
    const isSelected = selectedDim === dimKey

    return (
      <tr
        className="cursor-pointer"
        style={{
          borderBottom: '1px solid rgba(245, 233, 200, 0.05)',
          backgroundColor: isSelected ? 'rgba(245, 233, 200, 0.04)' : 'transparent',
          borderLeft: isSelected ? '3px solid rgba(245, 233, 200, 0.4)' : '3px solid transparent',
        }}
        onClick={() => setSelectedDim(dimKey)}
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
        <td className="p-4 text-right">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/dimension/${dimKey}`) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </td>
      </tr>
    )
  }

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

      {/* Master-detail layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left panel — Dimensions table (~65%) */}
        <div style={{ flex: '0 0 63%', minWidth: 0 }}>
          <LabelCaps className="mb-4">Dimensions</LabelCaps>
          <div style={{ backgroundColor: '#161616', borderRadius: '24px', overflow: 'hidden', maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(245, 233, 200, 0.1)' }}>
                  <th className="text-left p-4 text-[11px] uppercase tracking-wider font-medium" style={{ opacity: 0.5 }}>Dimension</th>
                  <th className="text-center p-4 text-[11px] uppercase tracking-wider font-medium w-20" style={{ opacity: 0.5 }}>Score</th>
                  <th className="text-center p-4 text-[11px] uppercase tracking-wider font-medium w-28" style={{ opacity: 0.5 }}>Severity</th>
                  <th className="p-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {tier1Visible.map(([dimKey, dim]) => (
                  <DimensionRow key={dimKey} dimKey={dimKey} dim={dim} />
                ))}
                {tier1HiddenCount > 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2">
                      <button
                        onClick={() => setShowAllTier1(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245, 233, 200, 0.5)', fontSize: 13, padding: 0 }}
                      >
                        Show all ({tier1HiddenCount} more)
                      </button>
                    </td>
                  </tr>
                )}
                {tier1Entries.length > 0 && tier2Entries.length > 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2" style={{ backgroundColor: '#0B0B0B', borderBottom: '1px solid rgba(245, 233, 200, 0.05)' }}>
                      <LabelCaps>Heuristic</LabelCaps>
                    </td>
                  </tr>
                )}
                {tier2Visible.map(([dimKey, dim]) => (
                  <DimensionRow key={dimKey} dimKey={dimKey} dim={dim} />
                ))}
                {tier2HiddenCount > 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-2">
                      <button
                        onClick={() => setShowAllTier2(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245, 233, 200, 0.5)', fontSize: 13, padding: 0 }}
                      >
                        Show all ({tier2HiddenCount} more)
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel — Findings (~35%) */}
        <div style={{ flex: '1 1 37%', minWidth: 0 }}>
          <LabelCaps className="mb-4">
            Findings{selectedFindings.length > 0 ? ` (${selectedFindings.length})` : ''}
          </LabelCaps>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            {/* Panel header: selected dimension info */}
            {selectedDim && selectedDimData && (
              <div className="mb-4 px-2">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium">{selectedDimName}</span>
                  <span className="text-[14px] font-medium" style={{ color: severityColor(selectedDimData.severity) }}>
                    {selectedDimData.score !== null ? `${selectedDimData.score}/${selectedDimData.score_max}` : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {selectedFindings.length > 0 ? (
              <div className="flex flex-col gap-4">
                {selectedFindings.map(f => (
                  <div
                    key={f.id}
                    className="p-6"
                    style={{ backgroundColor: '#161616', borderRadius: '24px', border: '1px solid rgba(245, 233, 200, 0.05)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SeverityDot severity={f.severity} />
                        <span className="text-[11px] uppercase tracking-widest font-mono" style={{ opacity: 0.6, fontFamily: 'monospace' }}>{f.id}</span>
                      </div>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="text-[14px] font-medium m-0 mb-2">{f.summary}</p>
                    <p className="text-[13px] m-0" style={{ opacity: 0.5 }}>
                      {f.description.slice(0, 200)}{f.description.length > 200 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : selectedDim && selectedDimData ? (
              <div className="p-6" style={{ backgroundColor: '#161616', borderRadius: '24px', border: '1px solid rgba(245, 233, 200, 0.05)' }}>
                <p className="text-[13px] m-0" style={{ opacity: 0.5 }}>
                  {dimensionNarrative(selectedDimData, selectedDim, editorial)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
