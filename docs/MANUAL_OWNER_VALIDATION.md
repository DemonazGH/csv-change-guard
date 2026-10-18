# Manual owner smoke test — Windows, Chrome and Edge

On **19 October 2026 (Europe/Warsaw)**, the owner completed a guided manual
smoke test using the built-in demo and supplied synthetic CSV files. The local
checkout for the session was commit
[`57b4199`](https://github.com/DemonazGH/csv-change-guard/commit/57b4199920fd2ccefdf7712ed1a466f47ed95599).
The application was opened from `dist/index.html` through local-file navigation.

## Evidence source and scope

These results transcribe the owner's explicit step-by-step confirmations in
the project chat. The agent initially opened Chrome and supplied instructions
and expected results, then waited for the owner after each step. The owner
performed the subsequent checks and reported the outcomes. This was a guided
exercise, not an independent unassisted usability study or a fresh automated run.

The owner supplied an initial-state screenshot and browser version details in
the chat. That screenshot is not copied into this documentation update. Later
manual outcomes below are owner confirmations; there are no new automated logs,
command-line captures, artifact hashes, or screenshots verifying those outcomes.
The application commit identifies session context, not a hash captured from the
browser during each manual action.

Separate [Windows/Chrome](WINDOWS_VALIDATION.md),
[sample compatibility](SHOPIFY_SAMPLE_VALIDATION.md), and
[Windows/Edge](EDGE_VALIDATION.md) reports retain their dated automated evidence.
Their test counts, screenshots and sandbox observations are not manual results.

## Owner-reported environment

| Item | Recorded value |
|---|---|
| OS | Windows 11 Version 24H2, build 26100.9711 |
| Google Chrome | 155.0.8059.80, official 64-bit Stable build |
| Microsoft Edge | 155.0.4283.62, official 64-bit build |
| Edge Chromium version | 155.0.8059.85 |
| Launch route | Standalone local HTML; subsequent instructions used Explorer Open with |
| Inputs | Built-in demo, supplied sample pair, and four supplied scenarios in Chrome |
| Comparison settings | Threshold 30%; overwrite matching handles enabled |
| Time to first understandable report | Not recorded |

The Edge version differs from the earlier automated Edge run (155.0.4283.45).
No security-setting changes were requested or reported. Sandbox flags and
network activity were not measured during this manual exercise; the separate
automated reports contain their own observations.

## Basic workflow confirmations

Every **Pass** below means **owner-confirmed**, not agent-observed automation.

| Check | Chrome | Edge | Confirmed outcome |
|---|---|---|---|
| Initial state | Pass | Pass | No files selected, threshold 30%, overwrite enabled, Compare disabled |
| Demo comparison | Pass | Pass | 4 compared, 4 price changes, 6 priority findings, 4 unpaired rows, 15 total findings; incomplete verdict |
| Inspect all six priority findings individually | Pass | Not separately confirmed | Chrome: duplicate notebook identifier, zero canvas-bag price, desk-lamp price drop and three navy-tee changes understood |
| Download and independently open HTML report | Pass | Pass | Report remained usable after closing the app tab; all 15 findings, filenames, settings, expected values and limitations present |
| Report comprehension | Pass | Pass | Owner said the saved report made sense on its own; Edge report described as readable |
| Reopen through Explorer and select files using Windows dialogs | Pass | Pass | Owner confirmed the instructed step and successful selection of the exact sample pair |
| Compare selected samples | Pass | Pass | `current-catalog.csv` + `proposed-update.csv` matched all five demo counts and the incomplete verdict |
| Clear selected files | Pass | Pass | Both names reset, results/findings disappeared, Compare disabled, no previous filename/error visible |

For the HTML report, the owner confirmed the desk-lamp change **59.00 → 5.90,
−90%**. These were fresh manual downloads, not the archived automated exports.
The owner explained the duplicate identifier in Chrome as follows:

> The duplicate identifier means the app can’t reliably match those rows, so it excludes them and the comparison is incomplete.

## Additional Chrome scenarios

The owner kept `samples/scenarios/catalog.csv` as current and selected the
following proposed files. Settings remained 30% and overwrite enabled.

| Proposed file | Compared | Price changes | Priority | Unpaired | All findings | Owner-confirmed interpretation |
|---|---:|---:|---:|---:|---:|---|
| `catalog.csv` | 6 | 0 | 0 | 0 | 2 | Both findings are image-coverage warnings; verdict still advises review before import |
| `partial-prices.csv` | 2 | 2 | 1 | 0 | 8 | Four absent variants are informational, not deletion predictions; omitted columns remain unassessed rather than cleared |
| `explicit-clears.csv` | 6 | 0 | 3 | 0 | 5 | Shirt description, mug vendor and tea-tin compare-at price explicitly cleared; two image warnings |
| `invalid-identifiers.csv` | 2 | 0 | 4 | 4 | 12 | Incomplete verdict and exclusions understood; no guessed price comparisons |

All four scenario outcomes were confirmed as passed in Chrome. They were
**not run manually in Edge** during this exercise. The other five linked
scenarios were not part of this manual run in either browser. Their separately
recorded automated coverage must not be relabeled as manual validation.

## Interpretation and remaining checks

The owner reported no confusing explanations, count mismatches, missing report
content or display problems in the completed steps. This provides a positive
guided owner usability result for these synthetic files and browser versions.
It does not establish a general browser support matrix or representative
merchant usefulness.

ZIP download/extraction, a manual localhost run, separate legacy/current-header
selection, CSV/JSON export inspection, the full nine-scenario set in both
browsers, and performance/adversarial browser checks were not completed by this
manual exercise. No Shopify connection, merchant file comparison, controlled
import, public deployment or payment was part of the test.

The next small validation step is one authorized representative current/update
pair from the same store and currency. Prepare expected changes before running
it, record whether that list is complete or sampled, and classify outcomes as
Found / Missed / False alert / Unassessed. Keep files, detailed notes and reports
outside the repository and AI workspace; share generic counts and descriptions.
Use the [local validation guide](LOCAL_VALIDATION.md) and
[results sheet](VALIDATION_RESULTS_TEMPLATE.md). A passed smoke test or zero
findings is not approval to import.
