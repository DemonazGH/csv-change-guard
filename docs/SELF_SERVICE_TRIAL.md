# Self-service synthetic trial preparation

Prepared on **18 November 2026**, Europe/Warsaw. This website update is in the
local working tree on `codex/simplify-synthetic-trial`, based on `b3a698c`.
It has not been pushed or publicly deployed. The public
[24 October deployment](PUBLIC_SYNTHETIC_DEMO.md) retains its historical scope.
Live sales are disabled.

## Visitor experience

The homepage leads directly to the fixed synthetic browser comparison. Starting
the trial requires no email, screening or arranged session. Visitors can run the
example, read the findings and save a report. Feedback through the existing
support email is optional. File selection in the downloadable utility remains
a separate workflow.

The short demo is a user-paced interactive walkthrough, estimated at about one
minute. It runs the actual comparison, shows the engine-produced lamp price
change, explains the duplicate-key exclusion and offers the complete HTML
report. Back, Next, Finish and Restart controls allow exploration at the
visitor's own pace. Ordinary comparison, filters and reset remain available.

The new [price-change guide](../website/shopify-csv-price-changes.html) covers
baseline/update preparation, the tool's exact comparison key, percentage
thresholds, four synthetic price examples, incomplete coverage and report
handling. Its Shopify platform references were checked against the official
import and CSV-format documentation on 18 November. The comparison engine's
rule-review date remains the one carried in the report.

The [website/support privacy notice](CURRENT_WEBSITE_GMAIL_PRIVACY.md) now
describes immediate browser access and optional feedback. The change introduces
no new provider or data collection mechanism. Purchase policies remain separate.

## Fresh automated Windows evidence

Windows 11, build 26100 as reported by Python. Node **v24.12.0**, Python
**3.14.0**, Playwright **1.62.0** in the ignored test virtual environment.
Browser contexts were fresh, headless instances of the installed executables.
These are automated local website checks. They are separate from earlier
manual owner confirmations, in-app-browser checks and the downloadable-app suite.

| Check | Result |
| --- | --- |
| `npm.cmd test` before changes | 114 passed |
| `npm.cmd test` after website changes | 114 passed |
| `npm.cmd run build:website` | 14 allowlisted files, including `_headers` configuration |
| `node --check website/demo.js` | Passed |
| Virtual-environment `pip check` | No broken requirements |
| Chrome **157.0.8103.79**, 1440 × 1000 and 390 × 1000 | Passed |
| Edge **157.0.4341.60**, 1440 × 1000 and 390 × 1000 | Passed |
| Sandboxing | Enabled explicitly and command-line checked for security-disabling flags |
| Downloaded report after closing demo context | Opened through `file://` in a fresh context in each browser and viewport |
| Independent intended-user trial | Not run |
| New public HTTPS deployment/check | Not run |

Each browser run checked homepage-to-tour and guide-to-tour navigation,
keyboard activation and heading focus, three tour steps, Back/Finish/Restart,
filtering, reset, ordinary comparison after reset, and report download while the
priority filter was active. The report reopened with all 15 findings, the
incomplete verdict and expected filenames. A JavaScript-disabled page and an
intentionally blocked engine load both retained the static report fallback.

The results retained **4 compared variants, 4 price changes, 6 priority findings,
4 unpaired update rows and 15 total findings**. The verdict was
**Incomplete comparison — blockers need review**. Excluded identifiers received
no guessed price comparison.

The checked pages had no horizontal page overflow at either viewport. The
homepage, guide and first tour step were also visually inspected. No error-level
console entry or page exception occurred in the normal trial/guide checks.
Observed requests from those application pages were same-origin GETs. This
bounded observation does not measure browser background or hosting-provider
traffic. The localhost server does not apply Cloudflare's `_headers` rules.

Initial harness attempts needed the explicit `--enable-automation` argument
already used by the repo's browser checks. Edge also exposes its internal
download hub as a separate page. The final harness scopes request evidence to
the visited website page. No sandbox, CSP or web-security protection was
disabled to obtain the passing runs.

Final machine-readable evidence and selected synthetic-only screenshots are in
[the evidence folder](../test-artifacts/self-service-trial-2026-11-18/).

- [Chrome homepage at 390 px](../test-artifacts/self-service-trial-2026-11-18/chrome-home-390.png)
- [Chrome walkthrough at 390 px](../test-artifacts/self-service-trial-2026-11-18/chrome-tour-390.png)
- [Chrome guide at 1440 px](../test-artifacts/self-service-trial-2026-11-18/chrome-guide-1440.png)
- [Edge guide at 390 px](../test-artifacts/self-service-trial-2026-11-18/edge-guide-390.png)

## Reproduce

Build the public-only output and run the optional browser check with one installed
browser. The check starts and stops its own loopback-only server.

```powershell
npm.cmd test
npm.cmd run build:website
python -m venv .local-test-artifacts/website-venv
.local-test-artifacts/website-venv/Scripts/python.exe -m pip install --requirement tests/requirements-browser.txt
.local-test-artifacts/website-venv/Scripts/python.exe -m pip check
.local-test-artifacts/website-venv/Scripts/python.exe tests/website_browser_test.py `
  --site-dir .local-test-artifacts/public-site `
  --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' `
  --artifacts-dir .local-test-artifacts/trial-chrome-2026-11-18
.local-test-artifacts/website-venv/Scripts/python.exe tests/website_browser_test.py `
  --site-dir .local-test-artifacts/public-site `
  --browser-executable 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' `
  --artifacts-dir .local-test-artifacts/trial-edge-2026-11-18
```

The tests serve only the allowlisted build. Public deployment should use those
14 files, excluding surrounding test evidence, the virtual environment and any
internal release package. A preview server used for this task was stopped at
teardown.

## Remaining work

The next publication step requires the owner's explicit push/deployment
instruction under `AGENTS.md`. Once published, verify the public links and
Cloudflare response headers against the reviewed build.

This work supplies educational and automated evidence. It establishes no
independent usability result, merchant-file compatibility, paid demand or
purchase/delivery/refund compliance. Earlier paid-release gaps remain open.
Record exposure to the guide and tour when interpreting later usability trials,
because these explain some of the same findings as the participant tasks.
