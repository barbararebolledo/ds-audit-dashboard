# DESIGN-PRINCIPLES.md
# ds-audit-dashboard -- Design Principles and Tone of Voice

Last updated: 2026-04-09
Status: Active
Affects: all pages, all copy surfaces, editorial pass, agent voice
Referenced by: DESIGN-SPEC.md, CONTENT-EDITING.md

---

## Purpose

A tool that drives action. The viewer finishes reading and knows what matters, what to do about it, and in what order.

---

## Design principles

### 1. Earned trust

Trust is earned through precision and honesty, not decoration or softening.

Applies to: layout, colour, typography, data display, all copy surfaces.

Rules:
- Severity colour (blocker red, warning amber, pass green) is the only chromatic signal. No other decorative colour.
- Surface hierarchy does spatial work: background (#0B0B0B), surface (#111111), surface-raised (#161616). Three levels, no gradients, no illustrations.
- Scores display to one decimal place. No rounding to friendly numbers.
- Findings reference specific artefacts by name (e.g. "the Button component description"), never generics (e.g. "some components").
- Tone is direct but never punitive. State the gap and the path forward together.

Do: "Component descriptions are present but lack purpose statements. Adding them would bring this dimension from 1.5 to 3.0."
Don't: "BLOCKER: missing purpose statements across 14 components."
Don't: "Your descriptions could be a little more detailed."

### 2. Clarity builds competence

The tool leaves the reader more capable than it found them. Every finding teaches one thing about how design system quality affects AI.

Applies to: dimension descriptions, cluster narratives, impact category cards, finding summaries.

Rules:
- Every dimension description includes a "what should happen vs what does happen" framing.
- Cost framing connects the gap to team time or budget, not to abstract quality.
- No onboarding flows, tooltips, or glossaries. The teaching is in the framing itself.
- Do not assume the reader has a mental model for AI readiness. Do not explain what AI is.

Do: frame each description so that after reading three or four, the reader intuits the logic.
Don't: front-load the report with explanatory content the reader must absorb before the findings make sense.

### 3. Three depths, one story

Three audiences read the same report at different depths. Each depth is self-contained.

Applies to: information architecture, layout density, typography scale, copy register.

| Depth | Audience | Time | Question answered | Visual density |
|---|---|---|---|---|
| One | Executive | Under 2 min | How ready are we, what would closing the gap save? | Spacious. Large type. Few elements. |
| Two | Design lead | 10-15 min | Where are the gaps, what kind of work do they need? | Moderate. Narrative alongside data. |
| Three | Practitioner | 30-60 min | What exactly do I fix, and how? | Highest. Tables, cards, action steps. |

Rules:
- A reader can stop at any depth and have a complete, actionable understanding for their role.
- Each depth maps to a copy register (see Tone of voice, principle 1).
- Layout density signals reading mode: depth one is the most spacious, depth three is the most compact.
- No depth requires reading a previous depth to make sense.

### 4. Opportunity first

Organise by what is most worth doing, not by what is most broken.

Applies to: sort order on all pages, narrative framing, impact calculator, action plan structure.

Rules:
- Action tiers are the primary sort. Tier 1: necessary for AI readiness. Tier 2: high impact, low effort. Tier 3: important, heavy effort.
- Severity is a secondary sort within tiers, not the primary organiser.
- Impact numbers frame what resolution would save, not what gaps cost.
- Severity colour still appears on findings and badges. It is informational. But structure, sort order, and narrative all lead with the opportunity.

Do: "Resolving documentation gaps in this cluster would save an estimated EUR X annually."
Don't: "Documentation gaps in this cluster cost your organisation EUR X annually."

---

## Tone of voice

### Voice character

A knowledgeable colleague walking you through the findings. Not a consultant performing expertise. Not a tool generating a report. Not a sales pitch. A peer who respects what you built and is specific about where to improve it. Warm but not casual. Direct but not blunt. Confident but not condescending.

### 1. One story, three registers

Every gap is one story told at three levels, matched to the three interface depths.

| Register | Depth | Rule | Max length |
|---|---|---|---|
| One | Overview, impact calculator | What it costs the team. No jargon, no mechanism. | One sentence. |
| Two | Cluster narrative, dimension description | What should happen vs what does happen. Recognisable experience. | Two sentences. |
| Three | Findings, action steps | Specific evidence, cause, and action. Domain terms allowed. | As needed. |

Register one example: "Every theme change costs your team manual work it shouldn't."
Register two example: "Theme changes should be a single update. Right now, they require changing values across every component, one by one."
Register three example: "42 component tokens reference raw hex values rather than semantic aliases. Action: rework. Map component tokens to semantic aliases so that theme switching requires updating only the semantic layer."

Rule: register one is the hardest to write. Start from the human experience. Never water down jargon; find the sentence that makes the technical concept unnecessary at this depth.

### 2. The system is the subject

Findings describe the artefact, not the team.

Applies to: all finding summaries, dimension descriptions, cluster narratives.

Do: "Component descriptions lack purpose statements."
Don't: "Your team has not written purpose statements."

Exception: the impact calculator, where the subject is the team's time and cost. "Your designers spend an estimated X hours per sprint on corrections" is acceptable because the point is to make consequences tangible.

### 3. Actions speak in verbs

Every action step starts with what to do. Three types, used consistently, never swapped for synonyms.

| Type | Meaning | Effort |
|---|---|---|
| Move | Content exists, wrong place. | Lightest. |
| Rework | Content exists, needs restructuring or completing. | Medium. |
| Create | Content does not exist, must be authored. | Heaviest. |

Rules:
- Action steps always start with a verb.
- The three type labels are fixed vocabulary. Never use "relocate," "refactor," "rebuild," "migrate," "transfer," or any synonym.
- The type label appears before the action description. Format: "Move: [what to do]."

### 4. Describe what happens, not the name for what happens

At registers one and two, explain through cause and effect, not terminology. Domain terms appear at register three.

Applies to: dimension descriptions, cluster narratives, overview copy, impact calculator descriptions.

Rules:
- If a concept has a technical name, describe what the reader would see or experience instead of naming it.
- The reader who knows the term recognises the concept. The reader who does not still understands it.
- At register three, use the domain term because the reader needs it to execute.

Do: "Theme changes should be a single update. Right now, they require changing values across every component, one by one."
Don't: "Without semantic token layers, theme changes require manual updates across every component referencing a raw value."
Don't: "Your tokens aren't set up optimally for theming." (too vague, no useful information)

### 5. Honest, not harsh

Severity is informational, not emotional. A blocker is a structural gap, not a failure or a crisis.

Applies to: all copy surfaces, especially finding summaries and severity labels.

Rules:
- No exclamation marks.
- No hedging: "unfortunately," "it's worth noting," "there may be."
- No editorialising: "critical," "urgent," "concerning."
- No false softening: "some room for improvement," "could be enhanced."
- State the finding. State the path forward. Stop.

Do: "This dimension scores 1.5. Adding purpose and structure to component descriptions would bring it to 3.0."
Don't: "This dimension scores a critical 1.5 and urgently needs attention."
Don't: "This dimension has some room for improvement."

---

## How these principles connect to the other documents

This file defines the voice, values, and structural model (three depths, four principles, five tone rules). Three companion documents implement them:

- `CONTENT-ARCHITECTURE.md` -- the story structure. Defines what each page says, in what order, at what level of prominence, and for whom. The three-depth model above maps to pages and sections in that document. Read it to understand how the principles become a page-by-page content plan.
- `CONTENT-EDITING.md` -- the editorial brief. Defines what each content field is for, what register to write in, what good and bad copy looks like, and maximum lengths. Uses the tone of voice rules from this document as the quality standard.
- `DESIGN-SPEC.md` -- the visual implementation. Tokens, components, layout, interaction patterns. Governed by the design principles above. Read it for how things look; read CONTENT-ARCHITECTURE.md for what things say.

Source references:
- `Thinking-track/Frameworks/impact-model.md` -- source of truth for impact calculator formulas and category definitions.
- `Thinking-track/Thesis/core-hypothesis.md` -- the intellectual foundation: why intent documentation matters for AI readiness.
