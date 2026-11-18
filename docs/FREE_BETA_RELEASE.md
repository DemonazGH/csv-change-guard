# Full free-beta release — 18 November 2026

The owner selected free access to the full existing utility, replacing the
earlier proposed paid beta for this package. Package **0.1.0-beta.2** contains
the unchanged **v0.1.0** app, three synthetic CSVs, offline help, a local-only
optional server and version-specific [free-use terms](../release/free-beta-terms.html).
Live sales remain disabled. No account, checkout, activation, telemetry, CSV
upload, store connection or runtime dependency was added.

This record covers the source changes and fresh local validation on Windows,
based on `10501bc` on `codex/free-beta-download`. Merge, exact-head CI and public
HTTPS publication follow-up are recorded in the release PR linked from this
branch's history; a local passing test is not evidence of public delivery.

## Visitor and licence changes

The website leads to a direct ZIP download and extraction/opening instructions.
The free-use terms are visible before downloading and included byte-for-byte
as `FREE_BETA_TERMS.html`. The full utility selects users' own supported files
after opening locally; the separate online demo still uses fixed synthetic
inputs. The native download link works without JavaScript, an email address,
signup or payment. A native disclosure provides an optional SHA-256 check.

The grant covers indefinite personal/own-business use of this delivered
version, including that business's staff/contractors and stores. Agency work for
separate client businesses, resale, rehosting, modification and public
redistribution are not granted. Users retain their report/data rights. Free
distribution is not an open-source licence: repository `UNLICENSED` is unchanged.
Future versions may have separate terms; there is no automatic charge or
retroactive removal of this version's permitted use. Best-effort assistance
replaces the inactive paid-support promise. Necessary statutory rights remain.

The privacy notice now describes technical ZIP download requests through the
existing Cloudflare host. It preserves optional Gmail feedback and the existing
manual retention procedure. No new data-collection mechanism was introduced.
The previous paid price/licence/refund/checkout drafts remain historical,
excluded from the download and public build. Any later paid offer must resolve
its separate provider, delivery, privacy and consent gaps.

## Reproducible artifacts and safeguards

- Public build: **17 allowlisted files**, including `_headers`; only the new ZIP,
  its checksum file and the canonical terms are added to the 14 prior assets.
- ZIP: `csv-change-guard-0.1.0-beta.2.zip`, **104,173 bytes**, 10 regular files.
- Tested Windows ZIP SHA-256:
  `76cafb2c6981fc0b4d2c7062846bb6b7c832a027ff417af3009301a6715a62e4`.
- Packaged app SHA-256:
  `585ce2008f2bab0005f2ba2cc9b00c43cae1ffb3fb8d5c954e698a919e35e1b8`.
- The manifest hashes eight payloads; nine checksum entries cover those payloads
  and the manifest. The public checksum covers the complete ZIP. These detect
  changes, not publisher authenticity or import safety.

The website builder uses the same release builder/metadata as `package:beta`,
injects the actual ZIP name, size and fingerprint, and copies the packaged terms.
Unknown output files and linked output roots/ancestors/destinations are refused;
regressions preserve an outside sentinel. Private inputs, development history,
credentials, old internal markers and commerce drafts are excluded. Existing
package outputs are never overwritten. Identical input bytes produce identical
ZIPs; Git line-ending settings can change inputs between checkouts/platforms.

## Fresh automated Windows evidence

Windows 11 build 26100, Node **24.12.0**, Python **3.14.0**, Playwright **1.62.0**.
Fresh headless instances of installed **Chrome 157.0.8103.79** and
**Edge 157.0.4341.60** were launched with `chromium_sandbox=True`; command-line
inspection rejected security-disabling flags. Only synthetic bundled files
were used. Evidence is under [test-artifacts/free-beta-2026-11-18](../test-artifacts/free-beta-2026-11-18/).

| Check | Actual result |
| --- | --- |
| Baseline `npm.cmd test` | 114 passed |
| Final Node engine/scenario/package/website tests | 119 passed |
| `npm.cmd run build` | Succeeded; `src/` and `dist/` diff empty |
| Website build | 17 allowlisted files; matching ZIP/checksum/terms |
| Package/draft preview in each installed browser | Passed; help/terms fit desktop/mobile; old commerce controls inert |
| Native download, JS disabled, keyboard Enter | Passed in Chrome and Edge over temporary localhost HTTP |
| Downloaded ZIP | CRCs, exact membership, safe scripted extraction, manifest, nine checksums and app identity passed |
| Packaged built-in demo and selected risky samples | 4 compared / 4 prices / 6 priority / 4 unpaired / 15 findings; incomplete verdict |
| Packaged unchanged sample | 7 compared / 0 prices / 0 priority / 0 unpaired / 2 image-coverage warnings |
| Clear files | Inputs, filenames, results, findings, coverage and errors clear; Compare disabled |
| Filtered export and independent report | All 15 findings reopened after closing the entire app context |
| Extracted app/help/terms and reopened report | Zero observed HTTP(S) requests and browser errors |
| Existing online demo/tour/guide/fallback suite | Passed in Chrome and Edge, 1440/390 px |
| Five pages, including new terms | 320/1440 px at 1×/2× CDP-emulated OS text scale; reflow and skip-link/focus checks passed |
| Preferences | Emulated reduced motion and forced-colors focus passed |

The unchanged sample has seven compared variants; earlier six-variant manual
scenarios used different fixtures. The 15 risky-demo findings overlap by row
and do not represent 15 unique products. No excluded identifier was guessed.

## Commands actually run

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run package:beta -- --output .local-test-artifacts/free-beta-release-final
npm.cmd run build:website
git diff --exit-code -- src dist
.local-test-artifacts/website-venv/Scripts/python.exe -m py_compile tests/beta_preview_test.py tests/free_beta_download_test.py
```

The three optional Python suites were run separately with each installed
browser, using the existing ignored virtual environment:

The preview suite used the separately prepared `free-beta-browser-package`
directory; its ZIP hash matches the final `package:beta` output above.

```powershell
.local-test-artifacts/website-venv/Scripts/python.exe tests/free_beta_download_test.py --site-dir .local-test-artifacts/public-site --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' --artifacts-dir .local-test-artifacts/free-beta-download-chrome-2026-11-18
.local-test-artifacts/website-venv/Scripts/python.exe tests/website_browser_test.py --site-dir .local-test-artifacts/public-site --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' --artifacts-dir .local-test-artifacts/free-beta-website-chrome-2026-11-18
.local-test-artifacts/website-venv/Scripts/python.exe tests/beta_preview_test.py --package-dir .local-test-artifacts/free-beta-browser-package/0.1.0-beta.2/CSV-Change-Guard --archive .local-test-artifacts/free-beta-browser-package/0.1.0-beta.2/csv-change-guard-0.1.0-beta.2.zip --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' --artifacts-dir .local-test-artifacts/free-beta-preview-chrome-2026-11-18
```

For Edge, the executable was
`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`, with separate
`edge` artifact folders. Test servers shut down in `finally` blocks.
CI now builds the free package/website and runs these checks in its own Linux
Chrome environment, separately from this Windows evidence.

## Guidance and remaining limits

Google Modern Web Guidance **v1.0.0** was searched/retrieved with per-process
CLI telemetry disabled (`html`, `accessibility`, `privacy`). Native navigation
and download anchors preserve keyboard/JS-disabled access; the optional
checksum uses native `details`/`summary`. Terms/help use scalable text, H1 skip
targets and visible focus. There is no forced personal-data collection.
Relevant guide rules: “use `<a>` strictly for URL navigation”, “Use `:focus-visible`
when styling focus indicators”, and “DON'T collect data speculatively”.
The development CLI is not in the app or public bundle.

These are automated localhost/file-navigation checks with scripted extraction,
not a fresh manual Windows Extract All confirmation, connected in-app-browser
evidence, independent-user trial or representative merchant-file validation.
Existing owner confirmations retain their original dates/scope. Screen readers,
Firefox, Safari, physical mobile devices, managed-browser restrictions and every
Shopify importer dependency remain unverified. No security or legal-compliance
certification is claimed. Zero findings never establishes import approval.

Next validation: five independent catalog operators complete the supplied
synthetic workflow unaided, correctly explain incomplete coverage and save/read
a report. Record optional feedback, support effort and actual repeat use;
collect no merchant files or reports. A free download alone proves neither
usefulness nor paid demand. Keep live sales disabled.
