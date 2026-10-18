# Cloud import and baseline review

Date: 18 October 2026. Source: the owner's `csv_change_guard_v0_1_codex_ready.zip`.
The repository was intentionally empty. All 37 uploaded files were imported;
historical handoff reports and screenshots remain historical evidence.

## Architecture and scope

`src/engine.js` parses and compares the supported Shopify CSV subset and generates
reports. `src/app.js` connects browser file inputs, filtering, and local downloads.
`build.cjs` embeds HTML/CSS/JavaScript into one standalone `dist/index.html`.
`server.cjs` is an optional static loopback server, not an upload backend.

Identity is exact, case-sensitive handle plus non-empty SKU. Missing or ambiguous
keys stay unassessed. Absent rows, omitted columns, explicit blanks, product
continuations, and image-only records remain distinct. Both inputs must concern
the same store and currency. Images, inventory, tax/shipping, markets, metafields,
full importer compatibility, and payment enforcement remain outside this prototype.

## Confirmed issue and fix

The original engine rounded the configured percentage threshold to four decimal
places before comparison. With a baseline price of `100`, update `130.00006`, and
threshold `30.000051`, it incorrectly classified the change as below threshold.
Rounding in the other direction could also produce a false alert.

The engine now compares exact BigInt ratios of the validated numeric threshold's
canonical decimal value, including exponent notation. Six regression cases cover
fractional boundaries, increases/decreases, tiny thresholds, and supported range
endpoints. Four failed against the original implementation and all six pass with
the fix. The report shape and zero-price behavior are unchanged.

## Development improvements

The browser runner now supports actual localhost and standalone-file navigation,
with in-memory rendering only when explicitly selected. It preserves the original
11 check groups, enables sandboxing by default, pins Playwright, and writes fresh
per-run artifacts and truthful pass/fail/blocked status. The cloud setup script
and [development instructions](CLOUD_DEVELOPMENT.md) reproduce the verified workflow.

## Executed validation

Environment: Debian 13 x86_64, Node 24.19.0, npm 11.9.0, Python 3.12.14,
Playwright 1.62.0, system Chromium 154.0.8037.57.

| Check | Result |
|---|---|
| Original `npm test` | 66 passed, 0 failed, 0 skipped |
| Original `npm run build` | 59,624 bytes; byte-identical to uploaded artifact |
| Updated `npm test` | 72 passed, 0 failed, 0 skipped |
| Updated `npm run build` | 60,098 bytes; includes the threshold fix |
| Localhost browser run | All 11 groups passed, including actual file selection and all three exports |
| Explicit in-memory browser run | All 11 groups passed; separate from navigation evidence |
| Direct file navigation | Blocked by browser administrator policy; 0 groups ran, exit 1 |
| Sandboxed Chromium launch | Failed: SUID helper is not owned by root |
| Static server | Exact build served; GET/HEAD 200, missing path 404, POST 405 |

The successful browser runs used the documented explicit sandbox opt-out with
synthetic fixtures inside this isolated container. Browser policy was not changed.
The localhost run observed only the initial document HTTP request and no page
errors. Mobile layout at 390 pixels had no page-level horizontal overflow.

The focused source review found no confirmed injection issue in the current
render/export paths. This is not a comprehensive security audit. Live Shopify
imports, real merchant data, Windows double-click launch, public HTTPS hosting,
and other browsers were not tested.

## Next small development step

Add a separate CI change that runs the engine suite, checks the generated build,
and executes the portable browser smoke suite with sandboxing enabled on its
runner. Keep deployment and commercial decisions separate. Acceptance should
require nonzero test counts, current-run artifacts, no unexpected network calls,
and a failing build when checked-in `dist/index.html` is stale.
