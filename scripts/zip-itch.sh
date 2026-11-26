#!/usr/bin/env bash
# Build dist/ then zip for itch.io HTML5 upload.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build
rm -f itch.zip
(cd dist && zip -r ../itch.zip .)
echo "Wrote $ROOT/itch.zip"
