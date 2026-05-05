# CONTENT-ARCHITECTURE.md
# ds-audit-dashboard -- Content Architecture

Last updated: 2026-04-14
Status: Active
Affects: page structure, content hierarchy, editorial schema, narrative flow
Governed by: DESIGN-PRINCIPLES.md
Related: DESIGN-SPEC.md (visual implementation), CONTENT-EDITING.md (editorial workflow)

---

## Purpose

This document defines what each page says, in what order, at what level of prominence, and for whom. It is the narrative blueprint for the dashboard. DESIGN-SPEC.md governs how things look. DESIGN-PRINCIPLES.md governs the voice and values. This document governs the story.

The problem it solves: the dashboard currently shows the methodology. It should show the story the methodology produces. Nobody needs to understand the audit engine to act on the results. They need to understand three things: what was measured, what was found, and what to do about it.

---

## The story structure

The dashboard tells one story across three pages. Each page is self-contained (a reader can land on any page and orient), but together they form a narrative arc:

**Overview** -- The diagnosis. What is this, how did you score, what is it costing you, what should you do. A complete picture in under two minutes for an executive, with enough depth for a design lead to understand the shape of the work.

**Remediation** -- The plan. What to do, in what order, why each priority level matters, what each action is worth. The design lead and practitioner page. Detailed enough to start planning work.

**Cluster detail** (and dimension detail below it) -- The evidence. How we measured each area, what we found, the specific findings and their severity. The practitioner page. Where you go when you want to understand or challenge a score.

The impact calculator is not a page. It is a tool -- an interactive panel accessible from the overview or remediation page. It lets the client enter their team context and see projected savings. It supports the story but is not a chapter in it.

---

## Page 1: Overview

The overview is the front door. It must orient a complete stranger in 30 seconds and give an executive enough to make a budget decision in under two minutes. Everything on this page answers one of four questions, in this order.

### Section 1: What is this?

**Purpose:** Orient the reader before they see any data. This section exists because every person shown the dashboard so far has not understood what they are looking at.

**Audience depth:** One (executive). Register one copy.

**Content:**

- **Report title.** The name of the audit. Example: "AI-Readiness Audit: Material UI." Rendered large enough to be the first thing read. Source: `editorial.report.title`.

- **Orientation sentence.** One sentence that explains what this audit measures and why, without jargon. This is not the executive summary (which summarises findings). This is the frame that makes findings comprehensible. Example: "This audit measures how well your design system communicates its own logic -- to your team and to AI tools. The better it communicates, the less time your team spends correcting AI output, fixing mismatches between design and code, and manually updating components when things change."

  Source: `editorial.report.methodology_note`. This field exists in the editorial schema but is currently empty in both editorial JSONs. It must be populated. It is arguably the single most important sentence in the dashboard.

- **What we looked at.** A brief, human-readable list of the evidence sources. Not "Figma REST API + MCP" (that's for auditors). Something like: "We examined the Figma component libraries, the published code packages, and the public documentation site." Source: derived from `audit.meta.evidence_sources`, but rewritten into plain language. This may need a new editorial field or a rendering helper that translates evidence source labels into plain language.

**Visual weight:** This section should be prominent but compact. It is not the hero -- the score is the hero. But it must be read before the score makes sense. Consider placing it above the score card, or as a distinct header area that the score card sits below.

### Section 2: How did you score?

**Purpose:** The headline result. A single number and what it means.

**Audience depth:** One (executive), transitioning to two (design lead) in the supporting detail.

**Content:**

- **Overall score.** The number, large, unmissable. As currently implemented.

- **Readiness status.** The badge ("Not AI ready" / "Conditionally ready" / "Ready for AI-assisted workflows"). As currently implemented, but the label text should be reviewed. "Not AI ready" is blunt without framing. Consider whether the status label should include a forward-looking element: "Not yet ready -- structural gaps need addressing first" rather than just "Not AI ready."

- **Executive summary.** Two to four sentences summarising the audit state and the single most important finding or action. This is the most important prose on the page after the orientation sentence. It must be written at register one -- no jargon, no mechanism, just what matters and what to do.

  Currently this renders in 13px text at the bottom of the score card. It needs to be visually promoted -- larger text, more prominent position. It should feel like the lead paragraph of a report, not a footnote.

  Source: `editorial.report.executive_summary`.

- **Score context.** What does 63.6 mean? The number alone is meaningless without a reference frame. Options include: a benchmark comparison ("The median score across audited systems is X"), a threshold explanation ("Systems scoring above 75 can support AI-assisted workflows with minimal correction"), or a plain-language translation ("Your system's documentation covers about a third of what AI tools need to work reliably"). This may need a new editorial field.

### Section 3: What is it costing you?

**Purpose:** Translate the score gap into business terms. This is where the impact model enters the story.

**Audience depth:** One (executive).

**Content:**

- **Headline impact number.** Total projected annual savings if the remediation plan is completed. Large, paired with the score. The score says "how ready." The impact number says "what the gap costs." Together they answer the executive question.

  This number currently lives on a separate Impact page. It belongs here, next to the score. The overview should show the headline; the calculator (accessible as a tool) lets the client explore the inputs.

  Source: computed from impact model formulas using default team parameters. The defaults should be reasonable for a mid-size team (the current defaults of 5 designers, 8 engineers, EUR 80/hour are reasonable). A link or button opens the full calculator so the client can enter their own numbers.

- **Impact category summary.** Below the headline number, a compact view of the four impact categories (correction cycles, theme rework, parity defects, token efficiency) showing the per-category projected saving. Not the full cards from the current impact page -- a summary row or compact card set. Enough to show where the cost concentrates.

  Token efficiency renders as the staged "emerging category" treatment defined in DESIGN-SPEC.md.

- **Calculator access.** A clear affordance to open the full impact calculator (the interactive tool with sliders). This could be a button ("Explore with your team's numbers"), a link, or an expandable panel. The calculator is depth two content -- optional for the executive, useful for the design lead who needs to build a business case.

### Section 4: What do you do about it?

**Purpose:** The path forward, at summary level. Not the full remediation plan -- that's the remediation page. Just enough to show that there is a plan and that it's prioritised.

**Audience depth:** One (executive), transitioning to two (design lead).

**Content:**

- **Remediation summary with framing.** The three tiers, each with a label, a value framing sentence, the item count, and the effort estimate. This replaces the current remediation summary widget, which shows tier labels and counts but no framing.

  The value framing sentence per tier is the key missing piece. It answers "why this tier first" in business terms:

  - **Tier 1 value framing:** What the consequence of inaction is. Without these changes, AI tooling cannot parse your system at all -- every downstream workflow that depends on AI understanding your components is blocked. (This is the "necessary for agent readability" tier from ADR 009.)

  - **Tier 2 value framing:** What the return on investment is. These are the highest-ROI actions -- they improve the quality and accuracy of AI output at low cost, typically within days. (This is the "high leverage, low effort" tier.)

  - **Tier 3 value framing:** What the long-term value is. These are investments in design quality that compound over time -- they require cross-functional effort but build the foundation for a system that improves with use. (This is the "important but high effort" tier.)

  Source: new editorial field on tiers (see Schema changes below).

- **Top priorities.** The current "Top Priorities" section showing the three most important blockers. This stays, but needs framing -- a sentence above the cards that says something like "These three gaps have the highest impact on AI tool reliability. Addressing them is the first step in the remediation plan." Currently the section has a label ("Top Priorities") and a count, but no framing sentence.

- **Action to go deeper.** A clear path to the remediation page. "View the full remediation plan" or equivalent.

### Section 5: What was measured?

**Purpose:** The cluster overview. This is the "methodology made visible" section -- but framed as areas of measurement, not as technical categories.

**Audience depth:** Two (design lead).

**Content:**

- **Cluster cards.** The seven clusters, each with name, score, and narrative. As currently implemented, but with two adjustments:

  1. **Cluster names need plain-language companions or replacements for the overview.** "Token and Variable System" means nothing to a business stakeholder. Each cluster card should lead with what the cluster measures in experience terms, not methodology terms. Examples: "How your system handles visual changes" (tokens), "How well components are built" (component quality), "How clearly your system explains itself" (documentation readiness). The technical name can appear as a subtitle or label. This may be an editorial override on cluster names for the overview context, or it could be a `display_name` field on clusters.

  2. **The distinction between readability clusters and design quality clusters should be visible.** Not as separate sections or meta-clusters (the seven-cluster structure stays flat), but as a subtle visual or textual signal. The cluster narrative or a label could indicate whether this cluster measures "can AI read your system" (clusters 0, 1, 3, 5, 6) or "is the design complete and well-governed" (clusters 2, 4). This is the distinction you keep having to explain verbally.

---

## Page 2: Remediation

The remediation page is the plan. It answers: what do I do, in what order, why does each step matter, and what is it worth. This is the design lead and practitioner page. Someone should be able to read this page and start planning sprint work.

### Page header

- **Title.** "Remediation Plan" or "Action Plan" (current title is "Remediation Roadmap" -- "roadmap" may over-promise sequencing that doesn't exist). Consider "Action Plan" as simpler and more direct.

- **Orientation sentence.** One sentence framing what this page is. Example: "A prioritised set of actions to improve your design system's readiness for AI-assisted workflows. Start with Tier 1 -- everything else depends on it."

- **Headline impact.** The total projected savings number, repeated from the overview. Reinforces the value framing. Optionally with a "Customise with your team's numbers" link to the calculator.

- **Filters.** Ownership filters (All / Design / Engineering / Both) as currently implemented.

### Tier sections

Each tier is a section on the page. The current layout (Tier 1 at 5 columns, Tier 2 at 7 columns, Tier 3 full-width and muted) is a reasonable density hierarchy but needs content additions.

**Per-tier content:**

- **Tier label.** The updated label from the editorial JSON. Not "Tier 1" alone. The full label with the strategic meaning. Examples:
  - Tier 1: "Make it readable" or "Enable AI to read your system"
  - Tier 2: "Improve accuracy" or "Raise the quality of AI output"
  - Tier 3: "Build long-term quality" or "Complete the design foundation"

  The exact labels need writing. They should be short (two to five words), action-oriented, and jargon-free. They appear alongside the tier number, not replacing it. Format: "Tier 1: Make it readable."

- **Tier value framing.** A two-sentence explanation of why this tier matters and what happens if you skip it. This is the narrative the current page lacks entirely. Examples (draft, to be refined in editorial pass):

  - Tier 1: "Without these changes, AI tools cannot reliably identify or select your components. Every AI-assisted workflow requires manual intervention at every step. These actions make the system legible to AI for the first time."

  - Tier 2: "These actions improve the accuracy and consistency of AI output. They are the highest return on effort -- most can be completed in days and reduce the correction cycles your team currently absorbs."

  - Tier 3: "These are investments in design quality that compound over time. They require cross-functional coordination and design capacity, but they build a system that gets better with use rather than accumulating debt."

  Source: new editorial field on tiers (see Schema changes below).

- **Tier impact subtotal.** The projected savings attributable to this tier's actions. Shows the aggregate value of completing the tier. Source: computed from impact model, summing the projected improvements of items in the tier.

- **Remediation items.** As currently rendered, with action type label (Move / Rework / Create), action description, ownership badge, effort estimate, and impact badge. The current implementation is solid here.

  **Addition per item:** The `value_framing` field on each remediation item should render if present. Currently the schema supports it, but it's not clear whether it renders on the page. This is the "why fix this" sentence -- the operational consequence of not fixing this specific item. It should appear below the action description in a secondary text style.

### Empty state

If all items in a tier are filtered out, the current "No actions match this filter" message is fine.

### Calculator access

A button or link to open the impact calculator, positioned near the headline impact number. Same treatment as on the overview.

---

## Impact calculator

The impact calculator moves from being a standalone page to being an interactive tool accessible from the overview and remediation pages.

**Trigger:** A button or link on both the overview and remediation pages. Text like "Customise with your team's numbers" or "Explore projected savings."

**Rendering:** The calculator can be a slide-out drawer, a modal, or an expandable panel. Implementation decision for DESIGN-SPEC.md. The key requirement is that it does not break the reading flow -- the reader should be able to open it, adjust numbers, close it, and continue reading with the updated numbers reflected in the headline impact and tier subtotals.

**Content:** As currently specified in DESIGN-SPEC.md. Team inputs, workflow inputs, cost inputs. Four category cards. Real-time calculation. No changes to the calculator itself -- only to where it lives.

**State persistence:** When the reader adjusts numbers in the calculator, the headline impact on the overview and remediation pages should update to reflect the custom inputs. If the calculator is closed and reopened, it should remember the inputs from this session. No persistence across sessions needed.

---

## Pages 3+: Cluster and dimension detail

These pages are the evidence layer. They are less broken than the overview and remediation pages because they serve a narrower audience (practitioners who want to understand or challenge a score) and a narrower purpose (show the measurement and the findings).

Two adjustments to align with the story structure:

### Cluster detail

- **Cluster narrative.** Should follow the "what should happen vs what does happen" framing from DESIGN-PRINCIPLES.md (tone of voice principle 4). The narrative should orient a reader who landed directly on this page without seeing the overview. Currently the cluster narrative is a one-paragraph editorial override -- this is fine structurally, but the content itself needs to follow the register two pattern.

- **Value framing.** The cluster-level `value_framing` from the editorial JSON should render on this page. It connects the cluster score to an operational consequence. Currently the field exists in the schema and may render, but its prominence and placement should be deliberate -- it belongs near the cluster score, not buried below the dimensions table.

### Dimension detail

- **Dimension narrative.** Same "what should happen vs what does happen" pattern. This is where register two copy does its teaching work -- after reading three or four dimension descriptions, the reader should intuit the logic of the audit without anyone explaining it.

- **Connection to remediation.** Each dimension detail page should show the remediation items that affect this dimension. Currently the data supports this (remediation items have `affected_dimensions`), but the render path needs to exist. The reader who digs into a dimension score should see not just the findings but the path forward.

---

## Schema changes required

This content architecture requires the following changes to the editorial schema:

### 1. Tier-level value framing (new field)

Add `value_framing` to the tier definition in the editorial schema. This is the strategic narrative explaining why this tier matters and what happens if the client skips it.

**Recommended structure:** A single string per tier. Keep it simple. The `cost_of_deferral` as a separate field adds complexity without adding a distinct render surface -- the value framing sentence can incorporate the deferral cost. If a richer structure is needed later, it can be added in a schema revision.

```json
"tiers": {
  "1": {
    "label": "Make it readable",
    "effort": "Hours--Days",
    "value_framing": "Without these changes, AI tools cannot reliably identify or select your components. Every AI-assisted workflow requires manual intervention at every step."
  }
}
```

**Connection to impact model:** The tier value framing is independent editorial content, not computed from the impact model. The impact model provides the numbers (projected savings per tier). The value framing provides the narrative (why this tier matters). They complement each other but are authored separately.

### 2. Methodology note (populate existing field)

`editorial.report.methodology_note` exists but is empty. It needs two to three sentences:

- What the audit measures (documentation quality and information architecture across Figma, code, and online docs)
- How scores work (56 dimensions across 7 areas, scored 0-4, weighted and aggregated to a percentage)
- What the result means (a spectrum from "AI tools cannot work with this system" to "AI tools can work reliably and efficiently")

This is register one copy -- no jargon, no methodology terminology.

### 3. Report title (populate existing field)

`editorial.report.title` exists but may not be populated or rendered. Populate it with the client-facing audit name.

### 4. Score context (consider new field)

A field for contextualising the score -- benchmark comparison, threshold explanation, or plain-language translation. Could be added to `report` as `score_context: string`. Optional for v1; can be deferred if editorial bandwidth is limited.

### 5. Cluster display names (consider new field)

If cluster names are too technical for the overview ("Token and Variable System"), an editorial override on the cluster name or a `display_name` field could provide plain-language alternatives for the overview page while preserving the technical name in the cluster detail. Alternatively, this could be handled purely in copy -- the cluster card shows the plain-language name and the detail page shows the technical name.

---

## Relationship to other documents

- **DESIGN-PRINCIPLES.md** governs the voice, the three-depth model, and the four principles. This document implements those principles as a page-by-page content plan.
- **DESIGN-SPEC.md** governs the visual implementation -- tokens, components, layout. The spec should be updated to reflect the structural changes in this document (section ordering, impact calculator placement, new render surfaces for tier value framing and methodology note).
- **CONTENT-EDITING.md** governs the editorial workflow. The editorial pass should use this document as the content checklist -- every field referenced here that says "currently empty" or "needs writing" is a task for the editorial pass.
- **impact-model.md** (Thinking Track) provides the formulas and category definitions. The impact data referenced in this document comes from that model.
- **ADR 009** (ds-ai-audit) defines the tier structure and remediation types. The tier labels and value framings in this document are the client-facing expression of those definitions.

---

## What this document does not cover

- Visual design (see DESIGN-SPEC.md)
- Tone of voice rules (see DESIGN-PRINCIPLES.md)
- Editorial workflow and field-level content budgets (see CONTENT-EDITING.md)
- Audit methodology and scoring (see ds-ai-audit repo)
- Client customisation and branding layer (deferred -- flagged as an open thread)
