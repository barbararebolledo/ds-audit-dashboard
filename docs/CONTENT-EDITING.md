# Editing audit content

This guide is for editing the text content of audit results.
You don't need to touch any code or JSON files directly.

## What you are editing

The file `src/data/audit-content.md` contains all the readable
text from the audit. This includes:

- **Cluster summaries** — one sentence per cluster, shown on the
  overview screen
- **Findings** — each has a summary (one line), a description
  (full detail), and a recommendation (what to do)
- **Dimension narratives** — the explanatory text on each
  dimension detail screen
- **Remediation items** — the action text for each remediation step
- **Data gaps** — explanations of what evidence was missing

## How to edit

1. Open `src/data/audit-content.md` in any text editor or in
   Cursor
2. Find the text you want to change
3. Edit the text after the bold label (e.g. after `**Summary:**`)
4. Keep the bold labels exactly as they are
5. Do not change the IDs in backticks (e.g. `CDC-001`)
6. Do not change headings that start with `#`
7. Save the file

## What NOT to change

- Anything in backticks (these are IDs that link to the JSON)
- The bold field labels (`**Summary:**`, `**Description:**`, etc.)
- The section headings
- The effort and ownership fields on remediation items

## Seeing your changes in the dashboard

After editing, ask Bárbara to run the compile script. This merges
your text back into the audit JSON, and the dashboard will show
your updated content.

If the dashboard is deployed to Vercel, your changes will appear
at a preview URL after pushing to GitHub.

## Tips

- Keep summaries to one sentence. They appear in compact views
  and need to scan quickly.
- Descriptions can be longer. They appear when someone drills
  into a specific dimension.
- Recommendations should be actionable: what to do, not just
  what is wrong.
- Write for someone who manages a design system. They know what
  tokens and components are. You don't need to explain basics.
