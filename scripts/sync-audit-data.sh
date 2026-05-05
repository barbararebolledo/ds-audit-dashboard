#!/usr/bin/env bash
set -euo pipefail

# Copies audit JSON from the sibling ds-ai-audit repo into src/data/audit-data/.
# Run before committing whenever the audit data changes upstream.

SRC="${AUDIT_REPO:-../ds-ai-audit}"
DEST="src/data/audit-data"

if [ ! -d "$SRC" ]; then
  echo "error: $SRC not found. Set AUDIT_REPO=/path/to/ds-ai-audit if it lives elsewhere." >&2
  exit 1
fi

mkdir -p "$DEST/audit/material-ui/v3.2" "$DEST/audit/carbon/v3.2" "$DEST/data" "$DEST/config"

cp "$SRC/audit/material-ui/v3.2/mui-audit-v3.2.json"       "$DEST/audit/material-ui/v3.2/"
cp "$SRC/audit/material-ui/v3.2/mui-remediation-v3.2.json" "$DEST/audit/material-ui/v3.2/"
cp "$SRC/audit/material-ui/v3.2/mui-editorial-v3.2.json"   "$DEST/audit/material-ui/v3.2/"
cp "$SRC/audit/carbon/v3.2/carbon-audit-v3.2.json"         "$DEST/audit/carbon/v3.2/"
cp "$SRC/audit/carbon/v3.2/carbon-remediation-v3.2.json"   "$DEST/audit/carbon/v3.2/"
cp "$SRC/audit/carbon/v3.2/carbon-editorial-v3.2.json"     "$DEST/audit/carbon/v3.2/"
cp "$SRC/data/dimension-reference.json"                    "$DEST/data/"
cp "$SRC/config/scoring-weights.json"                      "$DEST/config/"

echo "Synced audit data from $SRC → $DEST"
