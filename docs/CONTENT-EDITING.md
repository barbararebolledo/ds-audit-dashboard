# CONTENT-EDITING.md
# ds-audit-dashboard -- Editorial Brief and Content Specification

Last updated: 2026-04-14
Status: Active
Affects: all prose surfaces in the dashboard
Governed by: DESIGN-PRINCIPLES.md (voice and values), CONTENT-ARCHITECTURE.md (story structure)
Related: DESIGN-SPEC.md (visual implementation)

---

## Purpose

This document is the editorial brief for every piece of prose in the dashboard. It defines what each content field is for, who reads it, what register to write in, what good and bad copy looks like, and how long it should be. It replaces the previous version which covered only mechanical editing instructions.

Anyone writing or rewriting dashboard copy -- whether that is a content designer, a UX writing skill, or Bárbara herself -- follows this document. The voice and tone rules come from DESIGN-PRINCIPLES.md. The story structure and section purposes come from CONTENT-ARCHITECTURE.md. This document connects the two: it tells you what to write in each field to serve the story.

---

## The three registers

Every prose field in the dashboard is written in one of three registers. The register is determined by where the text appears, not by the writer's preference. See DESIGN-PRINCIPLES.md for the full register definitions and examples.

**Register one -- Overview and impact.** What it costs the team. No jargon, no mechanism. One sentence maximum. The reader is an executive or business stakeholder who will not drill into detail. If you have to use a technical term, you are in the wrong register.

**Register two -- Cluster and dimension level.** What should happen vs what does happen. Recognisable experience, not mechanism. Two sentences maximum. The reader is a design lead who manages a system but may not think about it in AI terms. After reading three or four of these, they should intuit the logic without anyone explaining it.

**Register three -- Findings and actions.** Specific evidence, cause, and action. Domain terms allowed because the reader needs them to execute. As long as needed. The reader is a practitioner who will plan sprint work from this.

---

## The voice

A knowledgeable colleague walking you through the findings. Not a consultant performing expertise. Not a tool generating a report. Warm but not casual. Direct but not blunt. Confident but not condescending.

Five rules (from DESIGN-PRINCIPLES.md):

1. **The system is the subject.** "Component descriptions lack purpose statements." Not "Your team has not written purpose statements."
2. **Actions speak in verbs.** Every action starts with what to do. Three fixed types: Move, Rework, Create. Never synonyms.
3. **Describe what happens, not the name for what happens.** At registers one and two, explain through cause and effect. Domain terms only at register three.
4. **Honest, not harsh.** No exclamation marks. No hedging. No editorialising. No false softening. State the finding and the path forward.
5. **One story, three registers.** The same gap told three ways for three audiences.

---

## Content specification per field

Each field below includes: where it appears, what register, what it does, how long it should be, and an example of good and bad copy. Fields are grouped by where they sit in the editorial JSON.

### Report-level fields

These fields appear on the overview page. They orient someone who has never seen this dashboard before. They are the most important copy in the entire product.

#### `report.title`

**Appears:** Top of overview page, largest text after the score.
**Register:** One.
**Purpose:** Name the audit so the reader knows what they are looking at.
**Length:** Under 10 words.
**Source:** Editorial JSON, `report.title`.

Good: "AI-Readiness Audit: Material UI"
Good: "Design System Readiness Report: Carbon"
Bad: "Comprehensive AI-Readiness Assessment of the Material UI Design System v5"
Bad: "Audit Results"

#### `report.methodology_note`

**Appears:** Overview page, Section 1 ("What is this?"). This is the orientation sentence. It is read before the score.
**Register:** One.
**Purpose:** Explain what the audit measures and why, in one to two sentences. No jargon. A business stakeholder reads this and understands why an audit of their design system matters.
**Length:** One to two sentences. Maximum 50 words.
**Source:** Editorial JSON, `report.methodology_note`.

Good: "This audit measures how well your design system communicates its own logic -- to your team and to AI tools. The better it communicates, the less time your team spends correcting AI output and manually updating components."

Bad: "This report evaluates 56 dimensions across 7 clusters using a weighted scoring methodology aligned with the six-level documentation hierarchy framework."

Bad: "We audited your design system for AI readiness."

The first bad example uses methodology language that means nothing to the reader. The second is too vague -- it tells you nothing about what was measured or why it matters.

#### `report.executive_summary`

**Appears:** Overview page, Section 2 ("How did you score?"), directly below the score and readiness badge.
**Register:** One.
**Purpose:** Summarise the audit state and name the single most important action. This is the lead paragraph of the report. Two to four sentences.
**Length:** Two to four sentences. Maximum 80 words.
**Source:** Editorial JSON, `report.executive_summary`.

Good: "Material UI's documentation is extensive but not structured for AI consumption. Component descriptions are present in code but absent from Figma, where AI design tools operate. The single highest-impact action is adding functional descriptions to the 20 most-used components in Figma -- this alone would move the system from 'not ready' to 'conditionally ready.'"

Bad: "The system scores 63.6/100 with 4 blockers across clusters 1, 3, and 6. Remediation is recommended across tiers 1 and 2 with an estimated effort of 2-4 weeks."

Bad: "There are several areas where the design system could be improved to better support AI-assisted workflows. Documentation coverage is inconsistent and some components lack the necessary metadata for reliable AI tool integration."

The first bad example restates data that's already visible on the page. The second is vague and hedging -- it says nothing specific.

### Tier-level fields

These appear on both the overview (summary) and remediation (full) pages.

#### `tiers.[n].label`

**Appears:** Overview remediation summary, remediation page tier headers.
**Register:** One.
**Purpose:** Name the tier in action terms. Not just "Tier 1" -- what this tier does.
**Length:** Two to five words after the tier number.
**Source:** Editorial JSON, `tiers.[n].label`.

Good: "Tier 1: Make it readable"
Good: "Tier 2: Improve accuracy"
Good: "Tier 3: Build long-term quality"

Bad: "Tier 1: Agent Readability" (methodology term, not action)
Bad: "Tier 1: Quick Wins" (retired label, does not describe what or why)
Bad: "Tier 1: Critical Structural Remediation Items" (jargon)

#### `tiers.[n].effort`

**Appears:** Overview remediation summary, remediation page tier headers.
**Register:** One.
**Purpose:** Effort range for the tier overall.
**Length:** Two to three words.
**Source:** Editorial JSON, `tiers.[n].effort`.

Values: "Hours--Days", "Days--Weeks", "Weeks--Months". No other formats.

#### `tiers.[n].value_framing`

**Appears:** Remediation page, below each tier header. May also appear on the overview remediation summary if space allows.
**Register:** Two.
**Purpose:** Explain why this tier matters and what happens if the client skips it. Two sentences: one about what completing the tier achieves, one about the consequence of deferral.
**Length:** Two sentences. Maximum 40 words.
**Source:** Editorial JSON, `tiers.[n].value_framing`. (New field -- see CONTENT-ARCHITECTURE.md, Schema changes.)

Good (Tier 1): "These changes make your system legible to AI tools for the first time. Without them, every AI-assisted workflow requires manual intervention at every step."

Good (Tier 2): "These are the highest-return actions -- most take days and directly reduce the correction cycles your team absorbs. Skipping them means AI output stays inconsistent even after Tier 1."

Good (Tier 3): "These build the design quality foundation that compounds over time. They require cross-functional effort but prevent the system from accumulating new debt."

Bad (any tier): "This tier contains items classified as priority level 1 based on the remediation framework scoring methodology."

Bad (any tier): "It would be beneficial to address these items when resources allow."

### Cluster-level fields

#### `clusters.[key].narrative`

**Appears:** Overview page cluster cards, cluster detail page header.
**Register:** Two.
**Purpose:** Summarise this cluster's state in "what should happen vs what does happen" terms. The reader should understand the gap and its consequence without knowing the dimension names.
**Length:** Two sentences. Maximum 40 words.
**Source:** Editorial JSON, `clusters.[key].narrative`. Falls back to `cluster_summary` in the audit JSON if not overridden.

Good: "Theme changes should be a single update. Right now, flat token values mean every component needs manual adjustment whenever the visual language changes."

Bad: "The token and variable system scores 58.3/100 with gaps in alias chain integrity and token architecture depth."

Bad: "There are some opportunities to improve the token architecture for better AI readability and theme scalability."

The first bad example restates data. The second is vague and hedging.

#### `clusters.[key].value_framing`

**Appears:** Cluster detail page, near the cluster score. Impact screen (when it existed as a page -- now woven into overview and remediation).
**Register:** Two.
**Purpose:** What this cluster's current state means operationally. Connects the score to a cost or workflow consequence.
**Length:** One to two sentences. Maximum 30 words.
**Source:** Editorial JSON, `clusters.[key].value_framing`.

Good: "Token architecture gaps mean every theme change requires manual updates across all components using flat values."

Bad: "Improving token architecture would enhance the system's AI readiness score in this cluster."

### Dimension-level fields

#### `dimensions.[key].narrative`

**Appears:** Dimension detail page.
**Register:** Two.
**Purpose:** Explain what this dimension measures through the "what should happen vs what does happen" lens. After reading three or four of these, the reader should intuit the audit's logic.
**Length:** Two to three sentences. Maximum 60 words.
**Source:** Editorial JSON, `dimensions.[key].narrative`. Falls back to the `narrative` field in the audit JSON dimension entry.

Good: "Every component should have a description that says what it does and when to use it. In this system, 96% of component descriptions are code import snippets -- useful for developers copying a package name, but invisible to AI tools selecting components by purpose."

Bad: "Dimension 3.1 measures functional intent coverage across published components. The current score of 1/4 indicates minimal coverage with blocker-level severity."

The bad example restates methodology data. The good example describes a concrete, recognisable situation.

### Finding-level fields

#### `findings.[id].summary`

**Appears:** Finding cards (cluster detail, finding list), top priorities on overview.
**Register:** Three.
**Purpose:** One-line overview. Scannable in a list. Names the specific gap.
**Length:** One sentence. Maximum 20 words.
**Source:** Editorial JSON, `findings.[id].summary`. Falls back to audit JSON `summary`.

Good: "Component descriptions in Figma contain code snippets, not functional purpose."
Bad: "Insufficient functional intent documentation across component library."

#### `findings.[id].description`

**Appears:** Finding detail view, expanded finding cards.
**Register:** Three.
**Purpose:** Full detail. What the problem is, with evidence. Self-contained.
**Length:** One to three sentences.
**Source:** Editorial JSON, `findings.[id].description`. Falls back to audit JSON `description`.

Good: "Of 1,034 published components, 14 have descriptions that explain what the component does. The remaining 1,020 have auto-generated code import snippets ('import Button from @mui/material/Button'). AI tools reading Figma metadata receive no functional information."

Bad: "Many components lack adequate descriptions for AI consumption."

#### `findings.[id].recommendation`

**Appears:** Finding detail view.
**Register:** Three.
**Purpose:** What to do to fix it. Starts with a verb. Specific and actionable.
**Length:** One to two sentences.
**Source:** Editorial JSON, `findings.[id].recommendation`. Falls back to audit JSON `recommendation`.

Good: "Write functional descriptions for the 20 highest-usage components first. Each description should state what the component does, when to use it, and when to use an alternative."

Bad: "Improve component descriptions to better support AI tooling."

### Remediation-level fields

#### `remediation.[id].action`

**Appears:** Remediation page, remediation items on cluster detail.
**Register:** Three.
**Purpose:** The action to take. Prefixed with the action type label (Move / Rework / Create).
**Length:** One to two sentences.
**Source:** Editorial JSON, `remediation.[id].action`. Falls back to remediation JSON `action`.

Good: "Rework: Add functional descriptions to the 20 highest-usage components in Figma. Each description states purpose, primary use case, and what to use instead."

Bad: "Rework: Improve component documentation quality in Figma library."

The bad example is not actionable -- it does not say what to do or what the result looks like.

#### `remediation.[id].value_framing`

**Appears:** Remediation page, below the action description.
**Register:** Two.
**Purpose:** Why fixing this matters. The operational consequence of leaving it unfixed.
**Length:** One sentence. Maximum 25 words.
**Source:** Editorial JSON, `remediation.[id].value_framing`. Falls back to remediation JSON `value_framing`.

Good: "Without functional descriptions, AI tools select components by name-matching alone -- every selection requires human verification."

Bad: "This item has high impact on the overall readiness score."

---

## How to edit

The editorial JSON files live at `audit/[system]/[version]/[system]-editorial-[version].json`. Each field is an override -- if present, it replaces the corresponding field from the audit or remediation JSON. If absent, the dashboard falls back to the generated text.

When editing:

1. Open the editorial JSON for the system and version you are working on.
2. Find the field you want to override by its key (finding ID, cluster key, dimension key, tier number).
3. Write or rewrite the prose following the specification above.
4. Save. The dashboard picks up changes on next build or hot reload.

Do not change:
- IDs (finding IDs, remediation IDs, cluster keys, dimension keys)
- Field names in the JSON
- Any structural data (scores, severity, effort estimates, ownership)

If a field does not exist in the editorial JSON yet, add it following the schema structure. See `audit/schema/editorial-schema.json` for the full schema.

---

## Quality checklist

Before finalising any editorial pass, check every field against these questions:

1. **Is it in the right register?** Overview fields are register one. Cluster and dimension fields are register two. Findings and actions are register three. If a register one field uses a domain term, rewrite it.

2. **Does it describe experience or mechanism?** At registers one and two, the reader should recognise what you describe from their own work, not from a methodology document. "Every theme change requires manual updates" is experience. "Token alias chain integrity is incomplete" is mechanism.

3. **Is the system the subject?** "Component descriptions lack purpose statements." Not "Your team has not written purpose statements." Exception: impact framing, where the team's time is the subject.

4. **Does it state the gap and the path forward together?** Never just the problem. Never just the solution. Both, in that order. "Component descriptions contain code snippets, not functional purpose. Adding purpose statements to the 20 highest-usage components would move this dimension from 1 to 3."

5. **Is it specific?** Names components, counts, percentages, actions. Never "several," "some," "various," "a number of." If you do not have the specific number, find it in the audit JSON.

6. **Is it within length?** Check against the maximum word count for the field. If you are over, cut. The constraint is not arbitrary -- it reflects the reading context. An overview field that runs to four sentences is not being read on the overview.

7. **Does it avoid the banned patterns?** No exclamation marks. No hedging ("unfortunately," "it's worth noting"). No editorialising ("critical," "urgent," "concerning"). No false softening ("some room for improvement"). No methodology jargon at registers one and two.
