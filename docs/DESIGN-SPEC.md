# DESIGN-SPEC.md
# ds-audit-dashboard -- Design Specification

Last updated: 2026-04-09
Status: Active -- reflects confirmed decisions from ADR 011 session
Affects: all pages, component patterns, layout structure

---

## Design tokens

All values below are the source of truth for implementation. Do not invent new values.

### Colour

| Token | Value | Usage |
|---|---|---|
| background | #0B0B0B | Page background |
| surface | #111111 | Card surfaces, panels |
| surface-raised | #161616 | Table surfaces, narrative cards |
| text-primary | #F5E9C8 | Headings, primary content |
| text-muted | rgba(245, 233, 200, 0.5) | Descriptions, secondary content |
| border-default | rgba(245, 233, 200, 0.15) | Card borders, panel edges |
| border-subtle | rgba(245, 233, 200, 0.05) | Table row separators |
| border-medium | rgba(245, 233, 200, 0.1) | Table header border |
| severity-blocker | #FF6B6B | Blocker severity |
| severity-warning | #F5A623 | Warning severity |
| severity-pass | #4ADE80 | Pass and note severity |
| severity-null | #888888 | Unassessed/null severity |

### Typography

| Token | Value |
|---|---|
| page-title | clamp(2rem, 4vw, 3rem), font-weight 500, tracking tight |
| cluster-title | 44px, font-weight 500, tracking tight, colour white |
| score-large | 48px, font-weight 500, leading none, tracking tight |
| body | 15px, line-height relaxed |
| body-small | 14px, font-weight 500 |
| caption | 13px, opacity 0.5 |
| label-caps | 11px, uppercase, tracking 0.08em, font-weight 500, opacity 0.6 |
| mono-id | 11px, uppercase, monospace, tracking widest, opacity 0.6 |

### Shape

| Token | Value |
|---|---|
| radius-card | 32px |
| radius-surface | 24px |
| radius-badge | fully rounded (capsule) |

### Spacing

Padding inside cards and panels: 32-40px (p-8 to p-10).
Table cell padding: 16px (p-4).
Gap between stacked cards: 16px.
Section spacing: 32px (mb-8).

---

## Shared components

### LabelCaps

Section headers above cards, tables, and panels. 11px uppercase, tracking 0.08em, font-weight medium, 60% opacity, colour inherited (#F5E9C8). No margin by default. Used for labels like "DIMENSIONS", "FINDINGS (4)", "CLUSTER 3", "TEAM PARAMETERS".

### SeverityDot

Small filled circle. Default 10px, 8px in dimension table rows. Colour matches severity. Blocker dots get box-shadow: 0 0 8px in severity colour. Other severities have no glow. Shrink-0.

### SeverityBadge

Pill-shaped (fully rounded). Padding: 12px horizontal, 4px vertical. Inline-flex, items centred, 6px gap.

Contents: 6px filled circle (dot) with box-shadow 0 0 6px in severity colour, then severity label text.

Text: 11px uppercase, medium weight, wide tracking. Colour matches severity.

Background: severity colour at ~8% opacity (hex + "15").
Border: 1px solid, severity colour at ~25% opacity (hex + "40").

Colour mapping: BLOCKER = #FF6B6B, WARNING = #F5A623, NOTE = #4ADE80, PASS = #4ADE80.

### Breadcrumbs

"Overview / Cluster Name" format. Muted text. "Overview" is a link, current page is plain text.

---

## Page: Cluster drill-down

**Pattern:** Master-detail.
**Decision source:** ADR 011, D2.
**Interaction model:** Option B -- single-select row with chevron for detail navigation.

### Layout

Two panels side by side below the page header. Proportions match the overview page: dimensions table takes the width of the "Overall System Readiness" card (~60-65%), findings panel takes the width of the "Top Critical Blockers" card (~35-40%).

Both panels have a fixed height filling the remaining viewport below the header. Both scroll independently.

### Page header

- Breadcrumb: "Overview / [Cluster Name]"
- LabelCaps: "CLUSTER [N]"
- Title: cluster name, cluster-title size, colour white
- Score: top-right, score-large size, colour mapped to severity range (under 50% blocker, under 75% warning, 75%+ pass)
- LabelCaps "Cluster Score" below the score number
- Narrative card: full-width, surface-raised background, radius-surface, 32px padding. Body text at 80% opacity.

### Left panel -- Dimensions table

LabelCaps "DIMENSIONS" above the table.

Table container: surface-raised background (#161616), radius-surface (24px), overflow hidden.

**Table header:** Row with border-bottom border-medium. Columns in label-caps style at 50% opacity.
- Dimension (left-aligned)
- Score (centred, ~80px)
- Severity (centred, ~112px)
- Chevron column (right-aligned, ~64px, no header text)

**Table body rows:** border-bottom border-subtle. Padding 16px all cells.
- Dimension cell: SeverityDot (8px) + 12px gap + dimension name in body-small
- Score cell: centred, body-small, colour matches severity
- Severity cell: centred, SeverityBadge
- Chevron cell: chevron-right SVG, 14px, 30% opacity. Secondary action: navigates to dimension detail page

**Row interaction:**
- Clicking the row selects it and shows its findings in the right panel
- Selected row gets a subtle highlight (implementation to refine in Cursor -- options include left border accent, background shift, or opacity change)
- Chevron is the navigation action to the full dimension detail page
- These are two separate touch targets: row = select, chevron = navigate

**Row ordering:**
- Grouped by tier. Tier 1 (scored 0-4, structural measurable dimensions) first. Tier 2 (scored 0-2, heuristic quality dimensions) second.
- Tier separator between them. Design treatment TBD -- to be refined in Cursor. Must communicate "structural" vs "heuristic" without splitting the table into two disconnected pieces.
- Within each tier: dimensions with findings sort to the top, then by severity (blocker first, then warning, then note, then pass), then alphabetical.
- If more than 3 dimensions in a tier have no findings, they collapse behind a "Show all" text button.

**Default state:** First dimension with findings is pre-selected.

### Right panel -- Findings

LabelCaps "FINDINGS" (with count, e.g. "FINDINGS (3)") above the panel.

Panel header shows: selected dimension name, its score, and findings count.

Finding cards stack vertically with 16px gap. Card style matches Top Critical Blockers from overview: surface-raised background, radius-surface, border border-subtle, 24px padding.

Each card:
- Top row: SeverityDot + finding ID in mono-id style + SeverityBadge right-aligned
- Summary: body-small, 8px below ID row
- Description: caption style, 8px below summary. Truncated at 200 characters with ellipsis.

**Empty state:** When a dimension with no findings is selected, show the dimension's narrative text in caption style. No cards.

**Finding IDs:** Internal IDs (CDC-001, etc.) are visible in this panel. Per ADR 011 D1, these should eventually be replaced with sequential numbers for the client-facing view. For now, keep internal IDs.

---

## Page: Impact Calculator

**Decision source:** ADR 011, C1-C5. Impact model: Thinking-track/Frameworks/impact-model.md.
**Status:** Complete redesign from previous version.

### Purpose

The client enters their team context. The page projects the annual cost of unresolved design system gaps across four impact categories, using formulas driven by audit scores and client inputs. All calculations update in real time.

### Layout

To be refined in Cursor. Two candidate layouts:
- (a) Input panel as a left sidebar, results on the right
- (b) Inputs at the top (compact/collapsible), full-width results below

### Client input panel

Inputs grouped into three sections:

**Your team:**
- Designers: number input, range 1-500, default 5
- Engineers: number input, range 1-500, default 8

**Your workflow:**
- Components used per sprint per designer: slider, 5-50, default 20
- Minutes per correction cycle: slider, 3-30, default 10
- Sprints per year: number input, default 26
- Theme changes per year: slider, 0-6, default 2
- Releases per year: number input, default 12

**Your costs:**
- Blended hourly rate: number input, range 30-300, default 80, currency EUR

Control type rule: sliders for narrow ranges where approximate is fine. Number inputs (text field with optional stepper) for wide ranges or where the client knows their exact number.

### Total projected savings

Hero section. Large number showing total annual projected savings in euros. Below it:
- Progress bar: current audit score vs target (85%+)
- Status label: "Projected Estimate" (replaces the previous "High Confidence Estimate")
- "View Remediation Plan" action button

### Four impact category cards

Arranged in a row (grid or flex). Each card: surface background (#111111), radius-card (32px), border border-default.

**Card 1 -- Correction Cycles (speed)**
- Icon: rotation/refresh icon, colour #FF6B6B
- Projected annual cost (large number)
- Title: "Correction Cycles"
- Description: editorial value framing from Cluster 3, or default: "Projected hours spent on human corrections when AI agents lack component intent documentation."
- Optionally: top related blocker from audit

**Card 2 -- Theme Rework (cost)**
- Icon: grid/layout icon, colour #FFB84C
- Projected annual cost (large number)
- Title: "Theme Rework"
- Description: editorial value framing from Cluster 1, or default: "Projected cost of manual updates when token architecture lacks semantic layers."
- Optionally: top related blocker

**Card 3 -- Parity Defects (quality)**
- Icon: code brackets icon, colour #4C8BFF
- Projected annual cost (large number)
- Title: "Parity Defects"
- Description: editorial value framing from Cluster 6, or default: "Projected cost of bugs from undocumented Figma-to-code mismatches surfacing in QA or production."
- Optionally: top related blocker

**Card 4 -- Token Efficiency (sustainability)**
- Icon: leaf or efficiency icon, colour TBD (suggest a green or teal distinct from pass green)
- **No cost number.** Instead, show a qualitative label: "Emerging Category" or "Pending Validation"
- Title: "Token Efficiency"
- Description: "Token consumption is an operational and environmental cost -- compute, energy, water for cooling. This category becomes quantifiable after the token efficiency experiment."
- Visual treatment: intentionally staged. Present and accounted for, not broken or empty. Distinct from the three quantified cards -- consider reduced opacity, a dashed border, or a "coming soon" badge. Must not look like an error.

### Formulas

All formulas run client-side in pure functions. Source of truth for formulas: impact-model.md. Key formulas:

**Correction cycles:**
```
correction_minutes_per_sprint =
  components_used_per_sprint × designers × undocumented_rate × minutes_per_correction

annual_correction_hours =
  correction_minutes_per_sprint × sprints_per_year / 60

annual_correction_cost = annual_correction_hours × hourly_rate
```
`undocumented_rate` derived from dimension 3.1 score. `designers` is the designer count input.

**Theme rework:**
```
manual_updates_per_theme_change =
  flat_token_count × avg_components_using_each_token

annual_theme_cost =
  manual_updates × minutes_per_update × hourly_rate / 60 × theme_changes_per_year
```
`flat_token_count` derived from token architecture audit data.

**Parity defects:**
```
estimated_defects_per_release =
  undocumented_gap_count × probability_of_surfacing

annual_defect_cost =
  defects_per_release × avg_hours_to_fix × hourly_rate × releases_per_year
```
`undocumented_gap_count` from parity audit data. `engineers` count input drives `avg_hours_to_fix` scaling.

**Token efficiency:** No formula yet. Placeholder until experiment data is available.

### Which headcount input drives which category

- Correction cycles: designer count (designers are re-specifying intent)
- Theme rework: both (designers and engineers both touch theme changes)
- Parity defects: engineer count (engineers fix code mismatches)
- Token efficiency (when live): both

---

## Page-level decisions not yet implemented

### D1 -- Finding IDs

Internal IDs (CDC-001, REM-003) are currently visible. For client-facing display, replace with sequential numbers generated at render time, sorted by severity_rank descending. IDs remain in the data for internal linking. Front-end only change. Deferred until editorial pass.

### D3 -- Methodology note

`report.methodology_note` is empty in both editorial JSONs. Needs 2-3 sentences: what the audit measures, how scores work, what blocker/warning/pass means. Editorial content -- to be drafted during the editorial pass with Eeva, not a code task.

---

## Open topics

### severity_rank on RemediationItem

Currently the remediation sort uses two keys: `priority_tier` ascending, then `effort_estimate` ascending. A third key (`severity_rank` descending) would improve visual hierarchy on the remediation page and in the drill-down. This requires a schema change to remediation-schema.json: add `severity_rank: number` (max severity_rank from linked findings) to `RemediationItem`. Deferred to the next audit engine session. When implemented, the front-end sort becomes a one-line addition.

**Impact on front-end design:** Sort order drives card prominence, visual hierarchy, and how the remediation roadmap reads. This is not just a data concern.

### Tier separator design

The visual treatment for tier separators in the dimensions table is TBD. Must communicate "structural" vs "heuristic" without splitting the table. To be refined in Cursor with a visual reference.

### Responsive behaviour

This release targets desktop only (MacBook 13" max, ~1440px). Responsive behaviour is deferred.

### DESIGN-SPEC.md scope

This file covers layout, interaction patterns, and design decisions. It does not cover:
- Prose content (editorial pass with Eeva)
- Visual design refinement (spacing, typography tuning -- Diana's layer)
- Score recalculation or audit methodology
