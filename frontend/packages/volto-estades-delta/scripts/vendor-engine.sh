#!/usr/bin/env bash
# Refresh the vendored copy of @stellifyit/assistant-ui-engine.
#
# The engine's source of truth is a sibling repo (~/projects/assistant-ui-engine),
# which is OUTSIDE this addon's Docker build context. So we vendor its BUILT
# output into vendor/assistant-ui-engine/ and depend on it via a file: path that
# lives inside the context. Run this whenever the engine changes.
#
# Usage: scripts/vendor-engine.sh [path-to-engine-repo]
set -euo pipefail

ADDON_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENGINE_DIR="${1:-$HOME/projects/assistant-ui-engine}"
VENDOR_DIR="$ADDON_DIR/vendor/assistant-ui-engine"

if [ ! -d "$ENGINE_DIR" ]; then
  echo "engine repo not found: $ENGINE_DIR" >&2
  exit 1
fi

echo "Building engine at $ENGINE_DIR..."
( cd "$ENGINE_DIR" && npm run build )

echo "Vendoring dist into $VENDOR_DIR..."
rm -rf "$VENDOR_DIR/dist"
mkdir -p "$VENDOR_DIR"
cp -r "$ENGINE_DIR/dist" "$VENDOR_DIR/dist"

echo "Done. Run 'pnpm install' in the frontend to relink."
