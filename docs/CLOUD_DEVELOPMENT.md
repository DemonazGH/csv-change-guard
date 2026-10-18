# Cloud development

Use the existing checkout at `/workspace/csv-change-guard`. Each cloud task is
already isolated; do not create an additional Git worktree unless requested.
The application stays a local, read-only comparison tool. No API keys, store
credentials, backend services, or npm package installation are needed.

## Prepare or refresh this cloud image

```bash
cd /workspace/csv-change-guard
bash scripts/setup-cloud.sh
```

This uses the image's Node/npm, Python, and `/usr/bin/chromium`, installs the
pinned optional Playwright dependency into
`/workspace/.csv-change-guard-tools/venv`, checks Python dependencies, runs the
engine suite, and rebuilds the standalone application. Re-running it preserves
source files and reuses installed dependencies. Browser downloads and OS package
installation are unnecessary on this image. Package access uses `pypi.org` and
`files.pythonhosted.org`, already allowed by its package-manager network preset.

For engine-only development, `npm test` and `npm run build` are sufficient.

## Start and verify

```bash
cd /workspace/csv-change-guard
npm run dev
```

The server binds only to loopback port 8080; `PORT` can select another free port.
Keep it in a managed terminal and stop only the server you started when done.
Processes must be restarted in a new cloud task. In a second terminal:

```bash
cd /workspace/csv-change-guard
export XDG_CONFIG_HOME=/workspace/.csv-change-guard-browser/config
export XDG_CACHE_HOME=/workspace/.csv-change-guard-browser/cache
export CHROMIUM_PATH=/usr/bin/chromium
/workspace/.csv-change-guard-tools/venv/bin/python tests/browser_test.py \
  --url http://127.0.0.1:8080/ --no-sandbox
```

The explicit `--no-sandbox` flag is specific to synthetic checks in this isolated
cloud container: its Chromium SUID helper is not owned by root, so sandboxed
launch fails. The harness enables Chromium sandboxing by default. Omit this
flag on hosts where sandboxed Chromium works; do not use the opt-out to browse
untrusted sites or process merchant data. No browser administrator policies are
changed. A local address is used internally for testing, not as a shareable cloud
preview.

The runner requires the served bytes to match `dist/index.html`, exercises all
browser check groups, and rejects HTTP requests beyond the initial page navigation.
Fresh results, screenshots, and synthetic exports go to a unique run directory
under ignored `.local-test-artifacts/browser/`. Failures and blocked navigation
exit nonzero and receive their own result file; old success files are never reused.

`--file` tests direct standalone-file navigation; this cloud browser blocks it
with `ERR_BLOCKED_BY_ADMINISTRATOR`. `--content` explicitly tests in-memory HTML
rendering, which does not validate normal navigation. There is no automatic
fallback. `--artifacts-dir` selects another output parent. Run `--help` for details.

## Other development machines

Use a supported Node version meeting `package.json`'s minimum. Optional browser
tests need Python, `python -m pip install -r tests/requirements-browser.txt`, and
either `python -m playwright install chromium` or a compatible system browser
selected by `CHROMIUM_PATH`. Chromium/Chrome on PATH is detected automatically.
Start `npm run dev` before `python tests/browser_test.py`; sandboxing stays enabled.
These installation commands describe local setup; only the cloud procedure above
was executed here. No Windows or cross-browser validation is claimed.
