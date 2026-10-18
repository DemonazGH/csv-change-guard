# Test report — v0.1.0

Run date: 18 October 2026.

This is the original prototype report, retained as historical evidence. For
fresh sandboxed Windows/Chrome results at commit `99ca694` (92 engine/scenario
tests, 14 browser groups in each of file and localhost modes, owner smoke checks
and screenshots), see [WINDOWS_VALIDATION.md](WINDOWS_VALIDATION.md). The original
11 in-memory browser checks below are not the Windows run.
The subsequent [official-sample compatibility validation](SHOPIFY_SAMPLE_VALIDATION.md)
adds focused regressions and records the current 106-test/15-group Windows run.

## Engine tests

**66 passed, 0 failed.** Node.js 22.16.0, dependency-free `node:test` runner.

Coverage includes parser quoting, UTF-8 BOM handling, malformed records, delimiter/header rejection, byte/column/record limits, legacy/current aliases, exact identifier matching, duplicate keys, missing identifiers, product continuation handling, image-only rows, omitted columns, missing baseline columns, unsupported columns, selected option dependencies, disabled overwrite mode, exact monetary thresholds, zero and invalid prices, visibility checks, export escaping/formula precautions, stable demo results, and a 5,000-record comparison.

Run with `npm test`. Raw output: `test-artifacts/engine-test-output.txt`.

## Browser checks

**11 grouped checks passed.** Chromium controlled with Python Playwright.

1. Exact standalone HTML renders and compare is disabled before input.
2. Demo metrics and incomplete-comparison verdict match expected results.
3. Severity filtering and text search work together.
4. HTML, CSV and JSON downloads work and are not restricted by active filters.
5. Settings changes invalidate old results and recompute correctly.
6. Disabled overwrite suppresses changes for baseline handles.
7. Actual file selection works across legacy/current headers; clearing removes old report content.
8. Unsupported delimiters are rejected and prior results cleared.
9. Invalid UTF-8 is rejected by the file loader.
10. The 390-pixel responsive layout has no page-level horizontal overflow; the results table scrolls independently.
11. No network requests or JavaScript page errors were observed; the build contains no localStorage.setItem calls.

Machine-readable result: `test-artifacts/browser-test-results.json`.

## Important test-environment qualification

Managed Chromium policy in this environment blocks both `file://` and localhost page navigation. Those routes were not bypassed or claimed successful. The exact built standalone HTML was rendered through Playwright's in-memory `set_content` method, with normal file inputs and download events exercised from that document.

Therefore the tests establish browser-rendered interface behavior, not a completed Windows double-click launch, deployed HTTPS smoke test, browser-matrix certification, or successful Shopify import. Those remain release checklist items.

## Screenshots

`test-artifacts/desktop-start.png`, `desktop-results.png`, and `mobile.png` show the actual rendered interface, not a generated mockup. Layouts were visually reviewed. All data is synthetic.

## Not tested

Real merchant data, live Shopify import round trips, payments, refund/webhook handling, external acquisition, customer willingness to pay, public hosting, recurring income, full security hardening and all field/dependency combinations in Shopify's importer.
