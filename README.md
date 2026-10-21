# CSV Change Guard

**Version 0.1.0 · local working prototype · 18 October 2026**

Paid-beta preparation now has an [internal release package](docs/RELEASE_PACKAGE.md),
[offline customer help](release/help.html), and [local product/checkout drafts](commerce-draft/index.html).
The selected offer is a USD 29 one-time downloadable utility with local CSV
processing. These are preparation artifacts, **not an active sale**. See
[decisions and remaining launch gates](docs/PAID_BETA_PREPARATION.md) and the
[fresh preparation checks](docs/BETA_PREPARATION_VALIDATION.md). The application
and repository's `UNLICENSED` designation remain unchanged.

**22 October commercial update:** an informational prelaunch page and separate
Lemon Squeezy Test-mode checkout now exist; fake-card order/receipt checks passed,
but hosted downloads are blocked in Test mode and live sales remain disabled.
The owner approved commercial defaults for [licence/support terms](docs/COMMERCIAL_TERMS_DRAFT.md)
and [a 14-day voluntary refund](docs/REFUND_POLICY_DRAFT.md). Text is still pending
effective-contract/privacy/provider review; the existing ZIP grants no commercial
licence. See [seller details and remaining gates](docs/SELLER_DETAILS.md) and
[the bounded provenance review](docs/OWNERSHIP_REVIEW.md). Earlier preparation
records retain their dated scope; they are not evidence of live sales.

Catalog workflow validation now includes reusable synthetic fixtures and targeted
reporting and file-selection regressions. See [the current validation report](docs/SCENARIO_VALIDATION.md)
and [cloud setup instructions](docs/CLOUD_DEVELOPMENT.md) for executed checks and
environment limitations. [Windows/Chrome validation](docs/WINDOWS_VALIDATION.md)
records fresh sandboxed file and localhost checks, the owner smoke workflow,
and screenshots. [Official sample compatibility](docs/SHOPIFY_SAMPLE_VALIDATION.md)
records the later compatibility fixes and Windows rerun. The [initial baseline](docs/BASELINE_REVIEW.md) and
uploaded handoff artifacts remain historical evidence.

[Windows/Edge validation](docs/EDGE_VALIDATION.md) on 19 October 2026 passed
106 engine/scenario tests, 15 browser groups per launch route, and the synthetic
START_HERE workflow with sandboxing enabled. A separate
[guided manual owner test](docs/MANUAL_OWNER_VALIDATION.md) on 19 October 2026
records the owner's Chrome/Edge workflow and report-comprehension confirmations,
plus four Chrome scenarios. Those confirmations are distinct from automated evidence.

[Synthetic pagination validation](docs/PAGINATION_VALIDATION.md) on 20 October
2026 adds automated checks of 100 findings across three pages and complete
HTML/CSV/JSON exports while filtered, in both installed Windows browsers.

[Shopify-generated synthetic export comparisons](docs/SHOPIFY_EXPORT_VALIDATION.md)
on 21 October 2026 passed two focused checks in the **Codex in-app browser**:
an unchanged four-variant export and a local copy with three known price changes.
The record includes screenshots and downloaded reports. It is separate from the
earlier installed Chrome/Edge suites and manual owner confirmations; sandbox
launch arguments and fresh-context report reopening were not verified in this run.

The later [standalone report layout fix](docs/REPORT_LAYOUT_VALIDATION.md) on
21 October adds readable desktop columns, contained narrow-screen scrolling and
print-width checks. Fresh installed Chrome and Edge runs passed **17 browser
groups per file/localhost route**, with sandboxing enabled. The regenerated
Shopify-pair reports also reopened independently in Chrome with their contents
unchanged; this remains separate from owner usability confirmation.

A read-only review tool for two Shopify product CSV files: a current catalog and a proposed update. It compares a defined subset of fields using exact identifiers. It does not connect to a store, execute imports, charge customers, or guarantee import safety.

## Try it

Download the repository with **Code → Download ZIP** on GitHub, then **Extract
All** on Windows. Start with [START_HERE.txt](START_HERE.txt) or follow
[the local validation guide](docs/LOCAL_VALIDATION.md). The included synthetic
files let you try the workflow without a store export.

Open **`dist/index.html`** in a current desktop browser. There is no installation, account, API key, or build requirement to try the provided HTML file.

Click **Try the built-in demo**. The demo uses synthetic data and produces findings immediately. Alternatively, choose the two CSV files in `samples/` and click **Compare files**. Results can be filtered and exported as HTML, CSV, or JSON. Open the exported HTML report in a browser for a standalone, printable view.

Some managed browsers block local HTML files. An optional localhost server is included:

```powershell
# From the extracted project directory, with Node.js installed:
npm run dev
# Open the localhost address printed by the command; Ctrl+C stops the server.
```

No `npm install` is required: the application, build script, server, and engine tests have no package dependencies.

## What works now

- UTF-8, comma-delimited CSV parsing, including quoted commas, escaped quotes and multiline fields.
- Explicit aliases for selected current and legacy Shopify product-export headers.
- Exact, case-sensitive **handle + non-empty SKU** matching. This is the tool's comparison key, NOT a statement that Shopify imports match variants using that key.
- Price differences, configurable absolute percentage thresholds, zero-price changes, and selected malformed-price checks.
- Blanked product fields and changes to supported option/visibility fields.
- Duplicate and missing identifier diagnostics, without guessed matches.
- Product-level first-row handling; blank continuation cells do not become false erased-description alerts.
- Detection and exclusion of image-only continuation records; images themselves are not assessed.
- Separate treatment of absent rows, omitted columns, and explicitly blank cells.
- Explicit overwrite-enabled/disabled report assumption.
- Search, severity filters, pagination, and full report exports independent of the current filter.
- No network calls, analytics, cookies, AI API calls, store writes, or local-storage persistence in this build. Clear files removes the loaded data and report content from application state/DOM; this is not a cryptographic memory-erasure guarantee.

## Supported scope and deliberate limits

Both files must contain a recognized **handle**, **Title**, and **SKU** column. Non-empty SKUs are a prototype requirement, not a universal Shopify requirement. Complete supported variant data should include Option1 name/value. Both files must represent the same store and currency; currency is not inferred.

Blank Option1/2/3 names on later variant rows use the clear first product row's
name for that handle within the same input file. Values are never inherited,
omitted columns remain unassessed, and populated names are not overwritten.
The official template spelling `Active` is equivalent to `active`; other status
capitalization or surrounding whitespace is not silently normalized. Genuine
status changes retain original text in findings and exports.

This prototype accepts up to **5,000 data records and 10 MiB per file**, with at most 200 columns. These are prototype limits, not Shopify's platform limits.

Price comparisons use non-negative dot-decimal values with up to 12 integer digits and 6 decimal places. No currency symbols, locale guessing, negative prices, or scientific notation. Decimal arithmetic is exact for threshold comparisons; displayed percentages are truncated to two decimal places. In JSON, `percentChange` is normally a number, an exact decimal string when numeric rendering would lose precision, or `null` when no percentage can be calculated.

Images, inventory, taxes, shipping, market-specific prices, metafields, arbitrary supplier files and unrecognized columns are not compared. It is not a full validator of Shopify's schema, dependencies, defaults, option combinations, encoding requirements, or importer behavior. Missing or duplicated keys make matching incomplete. A changed SKU or handle is not inferred from row order.

**An absent row is not a deletion prediction. A report with no findings is not an import approval.** Make an appropriate backup and test the actual workflow separately before any real import.

## Sample files

| File | Purpose |
|---|---|
| `samples/current-catalog.csv` | Synthetic baseline: seven variant candidates plus one image-only row |
| `samples/proposed-update.csv` | Synthetic risky update: price changes, blank description, option change, duplicate identifier, unmatched records |
| `samples/unchanged-update.csv` | Identical to the baseline; image-coverage warnings still appear |
| `samples/legacy-current.csv` | Same baseline data using selected legacy header names |
| `samples/demo-report.html` | Pre-generated readable demo report |
| `samples/demo-report.json` | Full structured demo report |

Expected risky-demo results: **4 compared variants, 4 price changes, 6 priority findings (1 blocking + 5 high), 4 unpaired update rows, 15 total findings**. Findings are not a count of unique products; a record may generate more than one finding.

For manual testing, [synthetic catalog scenarios](samples/scenarios/README.md)
provide nine CSV files with expected outcomes for partial updates, explicit
clearing, reordered variants, invalid identifiers, and unusual prices. Their
automated suite also generates a 5,000-record update with selective changes.

## Project structure

```text
src/                 Readable HTML, CSS, comparison engine, interface and demo inputs
 dist/index.html     Built standalone application (no external assets)
samples/             Synthetic inputs and sample reports
 tests/              Engine tests and optional browser checks
 docs/               Scope, validation plan, privacy/security notes and test report
 build.cjs           Single-file packager
 server.cjs          Optional localhost-only server
 package.json        Commands; no dependency installation
```

## Develop and test

GitHub Actions runs the engine tests, verifies the committed standalone build,
and checks the browser workflow on pushes to `main` and pull requests. See
[CI commands and diagnostics](docs/CI.md) for the runner configuration and artifacts.

```powershell
npm test
npm run build
npm run dev
```

Node.js 18 or later is the declared engine minimum; the uploaded baseline used
Node.js 22.16.0 and the cloud workflow was verified on Node.js 24.19.0. Do not infer
a complete cross-version test matrix.

The optional browser checks require Python, the pinned Playwright test dependency,
and Chromium; they are not product runtime dependencies. In a Python virtual
environment, install `tests/requirements-browser.txt` and provide Chromium via
`python -m playwright install chromium` or `CHROMIUM_PATH`. Start `npm run dev`
in one terminal, then run in another:

```powershell
python tests/browser_test.py
```

The default verifies actual localhost navigation. `--file` checks the standalone
file, and `--content` explicitly checks in-memory rendering. Failures are not
silently replaced by another mode. Fresh artifacts go into ignored
`.local-test-artifacts/`; `test-artifacts/` holds the original historical run.
Sandboxing is enabled by default. The cloud container's documented opt-out and
blocked direct-file navigation are explained in [cloud development](docs/CLOUD_DEVELOPMENT.md).

Current verification passed **106 engine/scenario tests and 17 grouped browser
checks per route** through file and localhost navigation in Windows Chrome and
Edge with sandboxing enabled; see [report layout validation](docs/REPORT_LAYOUT_VALIDATION.md).
The later [beta preparation checks](docs/BETA_PREPARATION_VALIDATION.md) add six
package tests (**112 Node tests total**), repeat the 17 groups against the extracted
package in both browsers/routes, and check the offline help and inert commerce drafts.
The earlier unchanged official sample compared 16 variants with zero changes
or blocking/high findings and four coverage warnings. See
[official sample validation](docs/SHOPIFY_SAMPLE_VALIDATION.md) for evidence.
The `START_HERE.txt` workflow and nine linked synthetic scenarios also passed.
Earlier [scenario validation](docs/SCENARIO_VALIDATION.md) and
[Windows/Chrome evidence](docs/WINDOWS_VALIDATION.md) retain their original
92-test/14-group results and tested source versions.
The uploaded historical run had 66 engine tests and 11 in-memory browser checks.
Other browser/version combinations, representative merchant workflows, public
HTTPS deployment and Shopify import round trips remain separate release checks.

## Before a commercial launch

The application is deliberately unmetered and has no payment boundary. **A client-side “pay to unlock” button would not securely enforce pay-per-report billing when the full engine is already delivered to the browser.** The owner selected a paid downloadable utility/licence with local CSV processing. The external Test-mode checkout remains separate from the utility; no runtime activation or account backend is added.

See [the launch plan](docs/LAUNCH_PLAN.md) and [current commercial gates](docs/SELLER_DETAILS.md).
Source publication, the informational website, the provider test and a paid
product launch are separate states. Live sales remain disabled; purchase/support
privacy and effective terms still need completion. Customer CSV processing stays
local and the app has no file-upload endpoint.

The [purchase privacy notice draft](docs/PURCHASE_PRIVACY_DRAFT.md) and
[privacy/withdrawal review](docs/PRIVACY_AND_CONSENT_REVIEW.md) distinguish local
CSV processing from hosting, checkout and support data. They record unresolved
production email, retention, transfers and consent/confirmation requirements;
they are not effective policies or a passed legal-compliance check.

## Rule sources

Selected rules were checked against these primary sources on 18 October 2026. The implementation covers a subset; links are not an endorsement or certification.

1. [Shopify: Importing products with a CSV file](https://help.shopify.com/en/manual/products/import-export/import-products) — overwrite behavior, blanks versus omitted columns, option-value changes, and deletion cautions.
2. [Shopify: Using CSV files to import and export products](https://help.shopify.com/en/manual/products/import-export/using-csv) — current headers, legacy compatibility, variant dependencies, and product/image continuation records.

Working name only. Name/trademark availability has not been checked. This is an independent prototype, not affiliated with Shopify. No third-party font files or externally sourced visual assets are bundled. No public open-source license has been selected.
