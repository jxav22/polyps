#!/usr/bin/env bash
# Build a relative-base dist and zip for itch.io HTML5 upload.
# Default vite.config base is /polyps/ (GitHub Pages); itch needs ./ paths.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building itch dist with base=./ …"
npx vite build --base=./

if [ ! -f dist/index.html ]; then
  echo "dist/index.html missing after build" >&2
  exit 1
fi

OUT="${1:-polyps-itch.zip}"
rm -f "$OUT"
(cd dist && zip -r -q "../$OUT" .)
echo "Wrote $OUT ($(du -h "$OUT" | awk '{print $1}')) — upload as HTML5 on itch.io (entry: index.html)"
echo "Note: npm run build still uses base=/polyps/ for GitHub Pages."
