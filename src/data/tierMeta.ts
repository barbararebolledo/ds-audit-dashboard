export type DensityVariant = 'compact' | 'standard' | 'muted'

export interface TierVisualMeta {
  /** Primary tier colour (dot, badge accents) */
  color: string
  /** CSS box-shadow for the dot glow; 'none' to suppress */
  glow: string
  /** Controls item row typography, padding, and layout */
  densityVariant: DensityVariant
  /** ImpactBadge colour key */
  impactColor: 'green' | 'amber' | 'cream'
  /** Grid column span for the tier section */
  colSpan: number
  /** Section background treatment */
  sectionStyle: 'filled' | 'outlined'
  /** Whether the section header renders at reduced opacity */
  headerDimmed: boolean
  /** Item list layout: single column or 2-column grid */
  itemsLayout: 'single' | 'grid-2'
  /** Whether the tier renders in a subdued / de-emphasised style */
  dimmed: boolean
}

export const TIER_VISUAL_META: Record<number, TierVisualMeta> = {
  1: {
    color: '#4ADE80',
    glow: '0 0 10px rgba(74,222,128,0.4)',
    densityVariant: 'compact',
    impactColor: 'green',
    colSpan: 5,
    sectionStyle: 'filled',
    headerDimmed: false,
    itemsLayout: 'single',
    dimmed: false,
  },
  2: {
    color: '#F5A623',
    glow: '0 0 10px rgba(245,166,35,0.4)',
    densityVariant: 'standard',
    impactColor: 'amber',
    colSpan: 7,
    sectionStyle: 'filled',
    headerDimmed: false,
    itemsLayout: 'single',
    dimmed: false,
  },
  3: {
    color: '#F5E9C8',
    glow: 'none',
    densityVariant: 'muted',
    impactColor: 'cream',
    colSpan: 12,
    sectionStyle: 'outlined',
    headerDimmed: true,
    itemsLayout: 'grid-2',
    dimmed: true,
  },
}

/** Ordered list of tier numbers, derived from TIER_VISUAL_META keys. */
export const TIER_NUMBERS: number[] = Object.keys(TIER_VISUAL_META)
  .map(Number)
  .sort((a, b) => a - b)
