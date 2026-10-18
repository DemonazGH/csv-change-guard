#!/usr/bin/env bash
set -euo pipefail

# This cloud image already supplies Node/npm, Python, and system Chromium.
# Keep optional browser dependencies and caches outside the checkout.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ccg_tools_dir=/workspace/.csv-change-guard-tools
mkdir -p "$ccg_tools_dir" /workspace/.csv-change-guard-browser/config /workspace/.csv-change-guard-browser/cache
node --version
npm --version
python --version
command -v chromium
python -m venv "$ccg_tools_dir/venv"
"$ccg_tools_dir/venv/bin/python" -m pip install --disable-pip-version-check \
  --index-url https://pypi.org/simple --cache-dir "$ccg_tools_dir/pip-cache" \
  -r tests/requirements-browser.txt
"$ccg_tools_dir/venv/bin/python" -m pip check

# No npm install: the application and engine tests have no dependencies.
npm test
npm run build
