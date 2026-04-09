# Audit Dashboard — Visual Redesign Spec

## Context

This spec is for Claude Code working in the `ds-audit-dashboard` repo (Vite + React + Tailwind 4).
The dashboard displays AI-readiness audit results for design systems.
The current code is functional and structurally sound. This redesign addresses visual design only.

Run `npm run dev` to preview changes live.

---

## Design principles (governing)

1. **Assist with judgement, not just information** — hierarchy must guide the eye to what matters most
2. **Be a companion** — calm, not clinical
3. **Calm by default** — reduce visual noise, let whitespace do the work
4. **Prove intelligence without explanation** — show the right thing at the right level, no need for labels that say "this is important"
5. **Embed growth quietly** — remediation should feel like a path forward, not a list of failures

## Four information levels

Each screen should support progressive disclosure:
- **Glance (5 sec):** readiness verdict + overall score. One sentence.
- **Scan (30 sec):** cluster scores, top blockers. Pattern recognition.
- **Diagnose (5 min):** dimension-level detail, findings, evidence.
- **Remediate (working session):** actionable roadmap with effort/ownership.

---

## Visual reference

The reference design (a museum analytics onboarding dashboard) establishes these characteristics.
Translate them into the audit context — do not copy the museum content or layout literally.

### From the reference, extract these visual qualities:

1. **Card treatment:** Large border-radius (28–32px), generous padding (32–40px), no visible borders on white cards, subtle box-shadow (`0 8px 32px rgba(0,0,0,0.04)`) instead
2. **Hero block:** Full-width, gradient background (deep colour), white text, large type for the headline (36–48px), supporting text at 14px. The hero carries the single most important message.
3. **Step/section cards:** White background, same large radius, content-first layout with a small coloured label at the top (11px uppercase, accent colour), title at 20–24px, description at 14px in muted grey
4. **Grid layout:** 12-column grid with 24px gap, cards spanning columns. NOT single-column — use the grid to create visual rhythm
5. **Background:** Light warm grey (#F2F2F6 or similar), not pure white
6. **Typography:** System sans-serif stack, tight letter-spacing on headings (-0.02em), 11px uppercase labels with 0.05em tracking for metadata
7. **Action affordances:** Circular buttons (56px) with icon, dark fill, placed bottom-right of cards
8. **Overall feel:** Spacious, confident, slightly editorial. Not a dense data table.

---

## Changes to make

### 1. Global layout and background

**Current:** `bg-[#fafafa]`, single column, `max-w-[960px]`, `px-6 py-10`
**Target:** `bg-[#F2F2F6]`, 12-column grid available, `max-w-[1200px]`, `px-10 py-10`

- Change body/root background to `#F2F2F6`
- Increase max-width to 1200px
- The Overview screen uses the grid; drill-down screens (cluster, dimension) stay single-column at max-w-[800px]
- Increase horizontal padding to 40px

### 2. Card system

**Current:** No cards. Sections separated by `border-b`, `divide-y`, and spacing.
**Target:** Content lives in cards with large radius and subtle shadow.

Create a reusable card style:
```css
.audit-card {
  background: #FFFFFF;
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
}
```

Dark mode consideration: not required for v1, but use CSS custom properties so it can be added later.

**Where cards apply:**
- Each cluster block on the Overview → individual card
- Top blockers section → one card containing the list
- Remediation summary on Overview → one card
- Cluster detail header → card
- Dimension detail header → card

**Where cards do NOT apply:**
- The hero/verdict block (has its own treatment)
- Tables within cards (they inherit the card background)
- Breadcrumbs (float above cards)

### 3. Hero / verdict block (Overview)

**Current:** A header with date, readiness text at 20px, score at 32px, and a bar.
**Target:** Full-width hero card with deep accent background.

```
Background: linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%)
Text: white
Border-radius: 28px
Padding: 40px
Min-height: 280px (let content dictate, do not force)
```

Layout (flexbox, space-between):
- **Left side:**
  - Small label: audit date, 11px uppercase, white at 80% opacity
  - Readiness verdict: 32–36px, font-weight 600, letter-spacing -0.02em
    - Use the full READINESS_COPY text, e.g. "Not ready for AI-assisted workflows"
  - One-line summary: 14px, white at 90% opacity, max-width 440px
    - Use the `phase_readiness_detail.conditions_for_advancement[0]` as context,
      or write a static sentence: "10 blocking dimensions across documentation, motion, and parity."
- **Right side:**
  - Small label: "Overall score", 11px uppercase, white at 80% opacity
  - Score: 56–72px, font-weight 600, tabular-nums
  - The horizontal bar sits below the score, full width of the right column

Remove the current `ClusterScoreBar` from the hero — the score number is sufficient at glance level. If you keep a bar, make it 3px tall and white at 30% opacity for the track, white at 90% for the fill.

### 4. Cluster section (Overview)

**Current:** Vertical stack of full-width button blocks.
**Target:** Grid of cards, 2 or 3 columns.

Use `grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))` with `gap: 20px`.

Each cluster card:
- `.audit-card` base
- Top: cluster name at 17px semibold + score at 17px semibold tabular-nums, on the same line (flexbox, space-between)
- Below: horizontal score bar, 3px tall, full card width, semantic colour
- Below bar: `cluster_summary` text at 14px, colour `#666666`, max 3 lines
- Bottom: findings/blockers count at 12px, uppercase, muted
- Entire card is clickable (keep the button wrapper)
- The prerequisite caution message stays, styled as a small amber pill/badge at the bottom of affected cards

### 5. Top blockers (Overview)

**Current:** `divide-y` list with severity badge + summary + cluster/dimension text.
**Target:** Single card containing the list. Remove horizontal dividers. Use 24px vertical gap between items instead.

Each blocker item:
- Severity as a small coloured dot (8px circle, not text) — red for blocker
- Summary at 15px semibold
- Cluster · Dimension at 13px muted, below
- Entire item clickable

### 6. Score bars

**Current:** `h-2` (8px), `max-w-[200px]` on dimension bars, `bg-neutral-200` track.
**Target:** `h-[3px]`, no max-width constraint (fill available space), track colour `#E8E8EC`.

Semantic fill colours stay:
- `--color-fail: #b91c1c` (scores 0–1)
- `--color-partial: #b45309` (score 2)
- `--color-pass: #166534` (scores 3–4)

Add `border-radius: 2px` to both track and fill for a softer look.

### 7. Typography adjustments

**Current type scale is mostly correct. Adjustments:**

- Section headings (CLUSTERS, TOP BLOCKERS, etc.): keep 11px uppercase tracking-wide, but change colour from `text-neutral-500` to `#8E8E93` and weight to 600
- Remove some section headings entirely where the content is self-explanatory:
  - "Data gaps" heading can stay (it is important context)
  - "Remediation summary" on Overview — the content (quick wins count, etc.) speaks for itself; remove the heading or make it part of the card title
- Add `letter-spacing: -0.02em` to all `h1`, `h2`, `h3` elements
- Card titles: 20px (not 17px) for cluster detail and dimension detail page titles

### 8. Header / navigation

**Current:** Flex row, border-bottom, system name + nav links + no avatar.
**Target:** Keep the structure but update styling:

- Remove `border-b` — use spacing to separate from content
- System name: 14px, weight 700, letter-spacing 0.1em, uppercase
- Nav links: 14px, weight 500, inactive in `#8E8E93`, active in `#1A1A1A`
- Add a 36px dark circle on the right (avatar placeholder or settings icon)
- Increase bottom margin to 32px

### 9. Breadcrumbs

**Current:** `/` separator, 14px, neutral-600.
**Target:** `›` separator, 13px, same colours. Add `margin-bottom: 24px` (reduce from current 32px to tighten with content).

### 10. Remediation view

**Current:** Three sections (quick wins, foundational, post-migration) that look identical.
**Target:** Visual differentiation by tier:

- **Quick wins:** Each item gets a small green-tinted left border (3px, rounded, `#166534` at 40% opacity)
- **Foundational blockers:** Small amber-tinted left border (`#b45309` at 40% opacity)
- **Post-migration:** No left border, lighter text treatment (the "someday" tier)

Each remediation item should be in its own mini-card (white background, 20px radius, 24px padding) within the section. Remove `border-b` between items.

The ownership filter buttons:
- Inactive: `bg-transparent`, `border: 1px solid #E8E8EC`, `border-radius: 20px` (pill shape), 13px
- Active: `bg-[#1A1A1A]`, `text-white`, same pill shape

### 11. Dimension detail — score scale

**Current:** Plain `<ul>` listing all levels.
**Target:** Highlight the current score level. The active level gets a left accent bar (3px, semantic colour) and slightly bolder text. Other levels stay muted.

### 12. Comparison placeholder

**Current:** Grey box with centred text.
**Target:** Same card treatment as the rest. White card, 28px radius, centred content, a simple illustration-style icon (optional — even just a `—` or empty state text is fine).

### 13. index.css updates

```css
@import 'tailwindcss';

@theme {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --color-fail: #b91c1c;
  --color-partial: #b45309;
  --color-pass: #166534;
  --color-accent: #1e3a5f;
  --color-muted: #8E8E93;
  --color-line: #E8E8EC;
  --color-bg: #F2F2F6;
  --color-card: #FFFFFF;
  --radius-card: 28px;
  --radius-sm: 16px;
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.04);
}

body {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 15px;
  line-height: 1.5;
  color: #1A1A1A;
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-weight: 600;
  letter-spacing: -0.02em;
}

#root {
  min-height: 100vh;
}

a, button {
  transition: none;
}
```

Drop Inter from Google Fonts in `index.html`. Use the system font stack throughout. This is faster, feels more native, and aligns with the reference.

---

## What NOT to change

- **Data layer:** All imports, types, helpers, JSON files stay untouched
- **Navigation logic:** The `AppView` state machine and all `onCluster`/`onDimension`/`onOverview` handlers stay the same
- **Semantic colour logic:** `scoreBarTone()` and the fail/partial/pass mapping stays
- **Content:** All text comes from the audit JSON — do not hardcode content
- **Component structure:** Keep the same component breakdown (Header, Overview, ClusterDetail, DimensionDetail, RemediationView, ComparisonView). Refactor visual presentation within them.

---

## Implementation order

1. `index.css` — update theme variables, fonts, background
2. `index.html` — remove Google Fonts link
3. `App.tsx` — Header component
4. `App.tsx` — Hero/verdict block
5. `App.tsx` — Cluster grid cards
6. `App.tsx` — Top blockers
7. `App.tsx` — Score bars (ScoreBar, ClusterScoreBar)
8. `App.tsx` — Remediation view
9. `App.tsx` — Breadcrumbs
10. `App.tsx` — Cluster detail + Dimension detail
11. `App.tsx` — Comparison placeholder

Preview after each step with `npm run dev`. Commit after step 7 (core overview done) and again after step 11.
