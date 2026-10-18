# Continuous integration

The `CI` workflow runs on pushes to `main`, pull requests, and manual dispatch.
One Ubuntu 24.04 job uses Node 24 and Python 3.12 to:

1. Run the engine and synthetic catalog scenario suites with `npm test`.
2. Rebuild `dist/index.html` and fail if it differs from the committed artifact.
3. Install the pinned optional Playwright dependency and select the runner's
   packaged Google Chrome explicitly.
4. Start the actual development server and run all browser smoke groups over
   localhost with Chromium sandboxing enabled.

If the build check fails after a source change, run `npm run build` and commit the
updated `dist/index.html` alongside the source. Do not edit the generated HTML
directly or weaken the check.

`scripts/ci-browser.sh` starts and waits for its own server, preserves the browser
runner's exit status, and stops that server on success, failure, or interruption.
It rejects a port already occupied by another process. Readiness is followed by
the browser suite's exact served-build check and functional assertions; a port
opening alone does not count as a passing test.

## Browser sandbox and evidence

The runner selects packaged Google Chrome explicitly with `CHROMIUM_PATH`, rather
than its separately downloaded Chromium snapshot. The Chrome package includes
Ubuntu sandbox integration; see [Chromium's documented guidance](https://github.com/chromium/chromium/blob/main/docs/security/apparmor-userns-restrictions.md).
The browser version is printed during setup and recorded in each result because
it can change with the hosted runner image. Playwright remains pinned. CI does
not disable Chromium sandboxing or change AppArmor/sysctl settings. If Chrome is
unavailable or sandboxed launch fails, the job fails without a fallback.

Each browser run writes a fresh JSON result, screenshots, and synthetic exports.
The `browser-results` artifact retains them and the server log for seven days,
including when the smoke step fails. Check that the current JSON says `passed`,
`rendering_mode: url`, `sandbox_enabled: true`, and `checks_passed` equal to
`checks_expected`. Historical files under `test-artifacts/` are not used as CI
evidence. If an earlier step fails
before the server starts, there may be no browser artifact; read that step's log.

Actions are pinned to immutable commits. The workflow's token is read-only,
checkout credentials are not persisted, and no repository secrets are required.
The workflow tests synthetic data only. It does not deploy, publish a release,
or change branch-protection settings.

## Run the same checks locally

```bash
npm test
npm run build
git diff --exit-code -- dist/index.html
python -m pip install -r tests/requirements-browser.txt
python -m playwright install --with-deps chromium
bash scripts/ci-browser.sh
```

Select a compatible browser with `CHROMIUM_PATH` if necessary; the CI workflow
forces packaged Google Chrome rather than relying on system autodetection.
`CCG_PYTHON` selects a Python virtual-environment interpreter, and `PORT` selects
the server port. Local results are ignored under `.local-test-artifacts/ci/`.

In the cloud container described in [CLOUD_DEVELOPMENT.md](CLOUD_DEVELOPMENT.md),
use its prepared interpreter and explicit sandbox exception:

```bash
XDG_CONFIG_HOME=/workspace/.csv-change-guard-browser/config \
XDG_CACHE_HOME=/workspace/.csv-change-guard-browser/cache \
CHROMIUM_PATH=/usr/bin/chromium \
CCG_PYTHON=/workspace/.csv-change-guard-tools/venv/bin/python \
bash scripts/ci-browser.sh --no-sandbox
```

That local exception does not prove sandboxed GitHub execution. Only a successful
run in the repository's Actions tab confirms the hosted workflow passed. CI is
Linux/Chromium coverage, not a Windows, browser-matrix, or Shopify-import guarantee.
