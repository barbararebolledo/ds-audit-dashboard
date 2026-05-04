import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuditSystem, RemediationItem } from '../data/types'
import type { DensityVariant } from '../data/tierMeta'
import { getMergedRemItem, sortRemediation, tierDef, tierValueFraming } from '../data/loader'
import { TIER_VISUAL_META, TIER_NUMBERS } from '../data/tierMeta'
import { FilterButton, ImpactBadge } from '../components'

function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="flex items-center justify-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider"
      style={{ border: '1px solid rgba(245, 233, 200, 0.1)', backgroundColor: 'rgba(17, 17, 17, 0.5)', color: 'rgba(245, 233, 200, 0.7)' }}>
      {category}
    </span>
  )
}

function RemediationItemRow({ item, densityVariant, impactColor, isFirst, isLast, onClick }: {
  item: RemediationItem
  densityVariant: DensityVariant
  impactColor: 'green' | 'amber' | 'cream'
  isFirst: boolean
  isLast: boolean
  onClick: () => void
}) {
  if (densityVariant === 'muted') {
    return (
      <div
        className="py-5 flex items-center justify-between group cursor-pointer"
        style={{ borderBottom: '1px solid rgba(245, 233, 200, 0.05)', opacity: 0.5 }}
        onClick={onClick}
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-medium m-0" style={{ color: '#F5E9C8' }}>
            {item.action_type && (
              <span className="text-[11px] uppercase tracking-wider font-medium mr-2" style={{ opacity: 0.5 }}>
                {item.action_type.charAt(0).toUpperCase() + item.action_type.slice(1)}:
              </span>
            )}
            {item.action}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ border: '1px solid rgba(245, 233, 200, 0.2)', color: 'rgba(245, 233, 200, 0.6)' }}>
              {item.ownership}
            </span>
            <span className="text-[12px] flex items-center gap-1" style={{ color: 'rgba(245, 233, 200, 0.4)' }}>
              <ClockIcon size={12} />
              {item.effort_estimate}
            </span>
          </div>
        </div>
        {item.projected_score_improvement && (
          <ImpactBadge value={item.projected_score_improvement.slice(0, 30)} color={impactColor} />
        )}
      </div>
    )
  }

  const isStandard = densityVariant === 'standard'

  return (
    <div
      className={`${!isLast ? 'border-b' : ''} group cursor-pointer`}
      style={{
        borderColor: 'rgba(245, 233, 200, 0.1)',
        paddingTop: isFirst ? 0 : (isStandard ? 24 : 20),
        paddingBottom: isStandard ? 24 : 20,
      }}
      onClick={onClick}
    >
      <h3
        className="font-medium m-0"
        style={{
          fontSize: isStandard ? 18 : 16,
          lineHeight: isStandard ? 1.375 : 1.625,
          marginBottom: isStandard ? 20 : 16,
          paddingRight: isStandard ? 40 : 0,
          color: 'white',
        }}
      >
        {item.action_type && (
          <span className="text-[11px] uppercase tracking-wider font-medium mr-2" style={{ opacity: 0.5 }}>
            {item.action_type.charAt(0).toUpperCase() + item.action_type.slice(1)}:
          </span>
        )}
        {item.action}
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CategoryBadge category={item.ownership} />
          <span className="flex items-center gap-1.5" style={{ fontSize: isStandard ? 14 : 13, color: 'rgba(245, 233, 200, 0.5)' }}>
            <ClockIcon size={14} />
            {item.effort_estimate}
          </span>
        </div>
        {item.projected_score_improvement && (
          <ImpactBadge value={item.projected_score_improvement.slice(0, 30)} color={impactColor} />
        )}
      </div>
    </div>
  )
}

const FILTERS = ['All', 'design', 'engineering', 'both'] as const

export default function Remediation({ system }: { system: AuditSystem }) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const { remediation, editorial } = system

  const merged = remediation.items.map(i => getMergedRemItem(i, editorial))

  const matchesFilter = (item: RemediationItem) =>
    activeFilter === 'All' || item.ownership === activeFilter

  const goToDimension = (item: RemediationItem) => {
    if (item.affected_dimensions.length > 0) {
      navigate(`/dimension/${item.affected_dimensions[0]}`)
    }
  }

  return (
    <main className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[44px] leading-tight font-medium mb-3 tracking-tight" style={{ color: 'white' }}>Remediation Roadmap</h1>
          <p className="text-[15px] m-0" style={{ color: 'rgba(245, 233, 200, 0.6)' }}>
            Prioritised actions to achieve AI-ready workflows — {system.name}
          </p>
        </div>
        <div className="flex gap-3 pb-2">
          {FILTERS.map(f => (
            <FilterButton
              key={f}
              label={f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              isActive={activeFilter === f}
              onClick={() => setActiveFilter(f)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {TIER_NUMBERS.map(tierNum => {
          const meta = TIER_VISUAL_META[tierNum]
          const def = tierDef(tierNum as 1 | 2 | 3, editorial)
          const valueFraming = tierValueFraming(tierNum as 1 | 2 | 3, editorial)
          const items = sortRemediation(
            merged.filter(i => i.priority_tier === tierNum).filter(matchesFilter)
          )

          const sectionStyle = meta.sectionStyle === 'filled'
            ? { backgroundColor: '#161616', borderRadius: '32px' }
            : { border: '1px solid rgba(245, 233, 200, 0.1)', borderRadius: '32px' }

          return (
            <section
              key={tierNum}
              className="p-10 flex flex-col"
              style={{ ...sectionStyle, gridColumn: `span ${meta.colSpan}` }}
            >
              <div
                className="flex items-center justify-between mb-6"
                style={meta.headerDimmed ? { opacity: 0.6 } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: meta.color,
                      opacity: meta.dimmed ? 0.3 : 1,
                      boxShadow: meta.glow !== 'none' ? meta.glow : undefined,
                    }}
                  />
                  <h2
                    className="text-[11px] uppercase tracking-[0.08em] font-medium m-0"
                    style={{ color: meta.dimmed ? '#F5E9C8' : 'rgba(245, 233, 200, 0.9)' }}
                  >
                    {def.label}
                  </h2>
                </div>
                <span
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: meta.dimmed ? 'rgba(245, 233, 200, 0.7)' : 'rgba(245, 233, 200, 0.4)' }}
                >
                  {items.length} Actions
                </span>
              </div>
              {valueFraming && (
                <p
                  className="text-[14px] leading-relaxed mb-8 m-0"
                  style={{
                    color: 'rgba(245, 233, 200, 0.7)',
                    maxWidth: '72ch',
                    opacity: meta.headerDimmed ? 0.7 : 1,
                  }}
                >
                  {valueFraming}
                </p>
              )}
              <div className={meta.itemsLayout === 'grid-2' ? 'grid grid-cols-2 gap-x-12' : 'flex flex-col'}>
                {items.length === 0 ? (
                  <p
                    className={`text-[14px] ${meta.itemsLayout === 'grid-2' ? 'col-span-2' : ''}`}
                    style={{ color: 'rgba(245, 233, 200, 0.3)' }}
                  >
                    No actions match this filter.
                  </p>
                ) : (
                  items.map((item, i) => (
                    <RemediationItemRow
                      key={item.id}
                      item={item}
                      densityVariant={meta.densityVariant}
                      impactColor={meta.impactColor}
                      isFirst={i === 0}
                      isLast={i === items.length - 1}
                      onClick={() => goToDimension(item)}
                    />
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
