#!/usr/bin/env python3
"""
Compile audit-content.md back into the audit JSON.

Usage:
    python3 compile-content.py

Reads:
    src/data/audit-content.md    (Eeva's edited text)
    src/data/mui-audit-v2.1.json (the full audit JSON)

Writes:
    src/data/mui-audit-v2.1.json (updated with Eeva's text)

The script parses the markdown by looking for IDs in backticks
and field labels in bold. It only overwrites text fields — scores,
severities, and structural data are never touched.
"""

import json
import re
import sys
import os
from copy import deepcopy


def parse_markdown(md_path):
    """Parse the markdown file into structured content."""

    with open(md_path, 'r') as f:
        content = f.read()

    result = {
        'cluster_summaries': {},
        'findings': {},
        'dimension_narratives': {},
        'remediation': {},
        'data_gaps': {},
        'conditions_for_advancement': [],
    }

    lines = content.split('\n')
    i = 0
    current_section = None
    current_id = None
    current_remediation_key = None

    while i < len(lines):
        line = lines[i]

        # Detect top-level sections
        if line.startswith('## Overall verdict'):
            current_section = 'verdict'
        elif line.startswith('## Cluster summaries'):
            current_section = 'clusters'
        elif line.startswith('## Findings'):
            current_section = 'findings'
        elif line.startswith('## Dimension narratives'):
            current_section = 'narratives'
        elif line.startswith('## Remediation items'):
            current_section = 'remediation'
        elif line.startswith('## Data gaps'):
            current_section = 'data_gaps'

        # Parse conditions for advancement
        if current_section == 'verdict' and line.startswith('- '):
            result['conditions_for_advancement'].append(line[2:].strip())

        # Parse cluster summaries
        if current_section == 'clusters':
            m = re.match(r'^### `([^`]+)`', line)
            if m:
                current_id = m.group(1)
            if current_id and line.startswith('**Summary:**'):
                text = line.replace('**Summary:**', '').strip()
                # Collect continuation lines
                while i + 1 < len(lines) and lines[i + 1].strip() and not lines[i + 1].startswith('#') and not lines[i + 1].startswith('**') and not lines[i + 1].startswith('---'):
                    i += 1
                    text += ' ' + lines[i].strip()
                result['cluster_summaries'][current_id] = text

        # Parse findings
        if current_section == 'findings':
            m = re.match(r'^### `([^`]+)`', line)
            if m:
                current_id = m.group(1)
                if current_id not in result['findings']:
                    result['findings'][current_id] = {}

            if current_id and current_section == 'findings':
                for field in ['Summary', 'Description', 'Recommendation']:
                    if line.startswith(f'**{field}:**'):
                        text = line.replace(f'**{field}:**', '').strip()
                        # Collect continuation lines
                        while i + 1 < len(lines) and lines[i + 1].strip() and not lines[i + 1].startswith('#') and not lines[i + 1].startswith('**') and not lines[i + 1].startswith('---'):
                            i += 1
                            text += ' ' + lines[i].strip()
                        result['findings'][current_id][field.lower()] = text

        # Parse dimension narratives
        if current_section == 'narratives':
            m = re.match(r'^#### `([^`]+)`', line)
            if m:
                current_id = m.group(1)
            if current_id and current_section == 'narratives' and line.startswith('**Narrative:**'):
                text = line.replace('**Narrative:**', '').strip()
                while i + 1 < len(lines) and lines[i + 1].strip() and not lines[i + 1].startswith('#') and not lines[i + 1].startswith('**') and not lines[i + 1].startswith('---'):
                    i += 1
                    text += ' ' + lines[i].strip()
                result['dimension_narratives'][current_id] = text

        # Parse remediation
        if current_section == 'remediation':
            m = re.match(r'^#### Remediation (\S+)', line)
            if m:
                current_remediation_key = m.group(1)

            if current_remediation_key and line.startswith('**Action:**'):
                text = line.replace('**Action:**', '').strip()
                while i + 1 < len(lines) and lines[i + 1].strip() and not lines[i + 1].startswith('#') and not lines[i + 1].startswith('**') and not lines[i + 1].startswith('---'):
                    i += 1
                    text += ' ' + lines[i].strip()
                result['remediation'][current_remediation_key] = text

        # Parse data gaps
        if current_section == 'data_gaps':
            m = re.match(r'^### `([^`]+)`', line)
            if m:
                current_id = m.group(1)
                if current_id not in result['data_gaps']:
                    result['data_gaps'][current_id] = {}

            if current_id and current_section == 'data_gaps':
                for field in ['Description', 'Impact']:
                    if line.startswith(f'**{field}:**'):
                        text = line.replace(f'**{field}:**', '').strip()
                        while i + 1 < len(lines) and lines[i + 1].strip() and not lines[i + 1].startswith('#') and not lines[i + 1].startswith('**') and not lines[i + 1].startswith('---'):
                            i += 1
                            text += ' ' + lines[i].strip()
                        result['data_gaps'][current_id][field.lower()] = text

        i += 1

    return result


def apply_to_json(json_path, parsed):
    """Apply parsed markdown content back into the JSON."""

    with open(json_path, 'r') as f:
        data = json.load(f)

    original = deepcopy(data)
    changes = []

    # Apply conditions for advancement
    if parsed['conditions_for_advancement']:
        old = data['summary']['phase_readiness_detail']['conditions_for_advancement']
        data['summary']['phase_readiness_detail']['conditions_for_advancement'] = parsed['conditions_for_advancement']
        if old != parsed['conditions_for_advancement']:
            changes.append('conditions_for_advancement')

    # Apply cluster summaries
    for cluster_key, summary in parsed['cluster_summaries'].items():
        if cluster_key in data['clusters']:
            old = data['clusters'][cluster_key].get('cluster_summary', '')
            if old != summary:
                data['clusters'][cluster_key]['cluster_summary'] = summary
                changes.append(f'cluster_summary: {cluster_key}')

    # Apply findings
    for finding in data['findings']:
        fid = finding['id']
        if fid in parsed['findings']:
            pf = parsed['findings'][fid]
            for field in ['summary', 'description', 'recommendation']:
                if field in pf and finding.get(field) != pf[field]:
                    finding[field] = pf[field]
                    changes.append(f'finding {fid}.{field}')

    # Apply dimension narratives
    for cluster_key, cluster in data['clusters'].items():
        for dim_key, dim in cluster['dimensions'].items():
            if dim_key in parsed['dimension_narratives']:
                old = dim.get('narrative', '')
                new = parsed['dimension_narratives'][dim_key]
                if old != new:
                    dim['narrative'] = new
                    changes.append(f'narrative: {dim_key}')

    # Apply remediation actions
    for tier in ['quick_wins', 'foundational_blockers', 'post_migration_improvements']:
        items = data.get('remediation', {}).get(tier, [])
        for idx, item in enumerate(items):
            key = f'{tier}_{idx + 1}'
            if key in parsed['remediation']:
                old = item.get('action', '')
                new = parsed['remediation'][key]
                if old != new:
                    item['action'] = new
                    changes.append(f'remediation: {key}')

    # Apply data gaps
    for gap in data.get('data_gaps', []):
        gid = gap['id']
        if gid in parsed['data_gaps']:
            pg = parsed['data_gaps'][gid]
            for field in ['description', 'impact']:
                if field in pg and gap.get(field) != pg[field]:
                    gap[field] = pg[field]
                    changes.append(f'data_gap {gid}.{field}')

    return data, changes


def main():
    # Find paths relative to script location or current directory
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Check if we're in the repo root or src/data
    for base in [script_dir, os.getcwd()]:
        md_path = os.path.join(base, 'src', 'data', 'audit-content.md')
        json_path = os.path.join(base, 'src', 'data', 'mui-audit-v2.1.json')
        if os.path.exists(md_path) and os.path.exists(json_path):
            break
    else:
        print("Error: Could not find src/data/audit-content.md and src/data/mui-audit-v2.1.json")
        print("Run this script from the dashboard repo root.")
        sys.exit(1)

    print(f"Reading markdown: {md_path}")
    print(f"Reading JSON:     {json_path}")
    print()

    parsed = parse_markdown(md_path)

    print(f"Parsed from markdown:")
    print(f"  Cluster summaries:  {len(parsed['cluster_summaries'])}")
    print(f"  Findings:           {len(parsed['findings'])}")
    print(f"  Narratives:         {len(parsed['dimension_narratives'])}")
    print(f"  Remediation items:  {len(parsed['remediation'])}")
    print(f"  Data gaps:          {len(parsed['data_gaps'])}")
    print(f"  Conditions:         {len(parsed['conditions_for_advancement'])}")
    print()

    data, changes = apply_to_json(json_path, parsed)

    if not changes:
        print("No changes detected. JSON is already up to date.")
        return

    print(f"Changes to apply ({len(changes)}):")
    for c in changes:
        print(f"  - {c}")
    print()

    # Write updated JSON
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    print(f"Updated: {json_path}")
    print("Done. Review the changes and commit.")


if __name__ == '__main__':
    main()
