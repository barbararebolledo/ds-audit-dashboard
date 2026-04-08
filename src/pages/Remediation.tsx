import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuditSystem, RemediationItem } from '../data/types'
import { remediationByTier, getMergedRemItem } from '../data/loader'
import { FilterButton, ImpactBadge } from '../components/shared'

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

function QuickWinItem({ item, isFirst, isLast, onClick }: {
  item: RemediationItem; isFirst: boolean; isLast: boolean; onClick: () => void
}) {
  return (
    <div
      className={`${isFirst ? 'pt-0 pb-5' : 'py-5'} ${!isLast ? 'border-b' : ''} group cursor-pointer`}
      style={{ borderColor: 'rgba(245, 233, 200, 0.1)' }}
      onClick={onClick}
    >
      <h3 className="text-[16px] leading-relaxed font-medium mb-4 m-0" style={{ color: 'white' }}>{item.action}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CategoryBadge category={item.ownership} />
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: 'rgba(245, 233, 200, 0.5)' }}>
            <ClockIcon size={14} />
            {item.effort_estimate}
          </span>
        </div>
        {item.projected_score_improvement && (
          <ImpactBadge value={item.projected_score_improvement.slice(0, 30)} color="green" />
        )}
      </div>
    </div>
  )
}

function FoundationalItem({ item, isFirst, isLast, onClick }: {
  item: RemediationItem; isFirst: boolean; isLast: boolean; onClick: () => void
}) {
  return (
    <div
      className={`${isFirst ? 'pt-0 pb-6' : 'py-6'} ${!isLast ? 'border-b' : ''} group cursor-pointer flex-1`}
      style={{ borderColor: 'rgba(245, 233, 200, 0.1)' }}
      onClick={onClick}
    >
      <h3 className="text-[18px] leading-snug font-medium mb-5 m-0 pr-10" style={{ color: 'white' }}>{item.action}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CategoryBadge category={item.ownership} />
          <span className="flex items-center gap-1.5 text-[14px]" style={{ color: 'rgba(245, 233, 200, 0.5)' }}>
            <ClockIcon size={14} />
            {item.effort_estimate}
          </span>
        </div>
        {item.projected_score_improvement && (
          <ImpactBadge value={item.projected_score_improvement.slice(0, 30)} color="amber" />
        )}
      </div>
    </div>
  )
}

function PostMigrationItem({ item, onClick }: { item: RemediationItem; onClick: () => void }) {
  return (
    <div
      className="py-5 flex items-center justify-between group cursor-pointer"
      style={{ borderBottom: '1px solid rgba(245, 233, 200, 0.05)', opacity: 0.5 }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-[15px] font-medium m-0" style={{ color: '#F5E9C8' }}>{item.action}</h3>
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
        <ImpactBadge value={item.projected_score_improvement.slice(0, 30)} color="cream" />
      )}
    </div>
  )
}

const FILTERS = ['All', 'design', 'engineering', 'both'] as const

export default function Remediation({ system }: { system: AuditSystem }) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const { remediation, editorial } = system

  const merged = remediation.items.map(i => getMergedRemItem(i, editorial))
  const tiers = remediationByTier(merged)

  const matchesFilter = (item: RemediationItem) =>
    activeFilter === 'All' || item.ownership === activeFilter

  const filteredT1 = tiers.tier1.filter(matchesFilter)
  const filteredT2 = tiers.tier2.filter(matchesFilter)
  const filteredT3 = tiers.tier3.filter(matchesFilter)

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
        {/* Quick Wins */}
        <section className="col-span-5 p-10 flex flex-col" style={{ backgroundColor: '#1A1A1A', borderRadius: '32px' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4ADE80', boxShadow: '0 0 10px rgba(74,222,128,0.4)' }} />
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-medium m-0" style={{ color: 'rgba(245, 233, 200, 0.9)' }}>Quick Wins</h2>
            </div>
            <span className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(245, 233, 200, 0.4)' }}>{filteredT1.length} Actions</span>
          </div>
          <div className="flex flex-col">
            {filteredT1.length === 0 ? (
              <p className="text-[14px]" style={{ color: 'rgba(245, 233, 200, 0.3)' }}>No actions match this filter.</p>
            ) : (
              filteredT1.map((item, i) => (
                <QuickWinItem key={item.id} item={item} isFirst={i === 0} isLast={i === filteredT1.length - 1} onClick={() => goToDimension(item)} />
              ))
            )}
          </div>
        </section>

        {/* Foundational Blockers */}
        <section className="col-span-7 p-10 flex flex-col" style={{ backgroundColor: '#1A1A1A', borderRadius: '32px' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F5A623', boxShadow: '0 0 10px rgba(245,166,35,0.4)' }} />
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-medium m-0" style={{ color: 'rgba(245, 233, 200, 0.9)' }}>Foundational</h2>
            </div>
            <span className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(245, 233, 200, 0.4)' }}>{filteredT2.length} Actions</span>
          </div>
          <div className="flex flex-col">
            {filteredT2.length === 0 ? (
              <p className="text-[14px]" style={{ color: 'rgba(245, 233, 200, 0.3)' }}>No actions match this filter.</p>
            ) : (
              filteredT2.map((item, i) => (
                <FoundationalItem key={item.id} item={item} isFirst={i === 0} isLast={i === filteredT2.length - 1} onClick={() => goToDimension(item)} />
              ))
            )}
          </div>
        </section>

        {/* Post-Migration */}
        <section className="col-span-12 p-10" style={{ border: '1px solid rgba(245, 233, 200, 0.1)', borderRadius: '32px' }}>
          <div className="flex items-center justify-between mb-8" style={{ opacity: 0.6 }}>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(245, 233, 200, 0.3)' }} />
              <h2 className="text-[11px] uppercase tracking-[0.08em] font-medium m-0" style={{ color: '#F5E9C8' }}>Post-Migration</h2>
            </div>
            <span className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(245, 233, 200, 0.7)' }}>{filteredT3.length} Actions</span>
          </div>
          <div className="grid grid-cols-2 gap-x-12">
            {filteredT3.length === 0 ? (
              <p className="text-[14px] col-span-2" style={{ color: 'rgba(245, 233, 200, 0.3)' }}>No actions match this filter.</p>
            ) : (
              filteredT3.map(item => (
                <PostMigrationItem key={item.id} item={item} onClick={() => goToDimension(item)} />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
