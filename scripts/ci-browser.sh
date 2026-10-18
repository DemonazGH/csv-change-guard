#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
export PORT="${PORT:-8080}"
ccg_python="${CCG_PYTHON:-python}"
ccg_artifacts_dir=.local-test-artifacts/ci
mkdir -p "$ccg_artifacts_dir"

node server.cjs > "$ccg_artifacts_dir/server.log" 2>&1 &
ccg_server_pid=$!
cleanup() {
  local ccg_status=$?
  trap - EXIT
  kill "$ccg_server_pid" 2>/dev/null || true
  wait "$ccg_server_pid" 2>/dev/null || true
  exit "$ccg_status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

ccg_ready=false
for ((ccg_attempt = 0; ccg_attempt < 30; ccg_attempt++)); do
  if ! kill -0 "$ccg_server_pid" 2>/dev/null; then
    cat "$ccg_artifacts_dir/server.log"
    exit 1
  fi
  # Require our server's listening message before accepting a response. A
  # different process already using PORT must not make the smoke check pass.
  if grep -q '^CSV Change Guard:' "$ccg_artifacts_dir/server.log" \
      && curl --fail --silent --connect-timeout 1 --max-time 1 \
        --output /dev/null "http://127.0.0.1:$PORT/"; then
    ccg_ready=true
    break
  fi
  sleep 1
done
if [[ "$ccg_ready" != true ]]; then
  cat "$ccg_artifacts_dir/server.log"
  echo 'Development server did not become ready after 30 attempts.' >&2
  exit 1
fi

# CI supplies no extra arguments: sandboxing remains enabled. A developer may
# explicitly pass the documented container-only --no-sandbox option locally.
"$ccg_python" tests/browser_test.py \
  --url "http://127.0.0.1:$PORT/" \
  --artifacts-dir "$ccg_artifacts_dir/browser" "$@"
