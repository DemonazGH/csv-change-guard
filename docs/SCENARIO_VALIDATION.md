# Catalog workflow validation

Executed on 18 October 2026 using synthetic data only. The suite now passes
**80 engine tests, 12 catalog scenario tests, and 14 grouped browser checks**.
These checks exercise the documented comparison subset, not Shopify imports.

A later [Windows/Chrome run](WINDOWS_VALIDATION.md) at commit `99ca694` passed
the same 92 engine/scenario tests and 14 browser groups through both direct-file
and localhost navigation with sandboxing enabled. It also checked the
`START_HERE.txt` workflow and all nine scenario pairs through browser file inputs.
That report contains the Windows evidence and screenshots; the environment and
commands below describe the earlier cloud run.

## Reusable scenarios

[Nine CSV fixtures and their expected outcomes](../samples/scenarios/README.md)
cover a small catalog with three products, six variants, an image continuation
record, and a multilingual, multiline description. Scenarios exercise partial
price updates, explicit clearing, reordered rows, changed identifiers, missing
or spaced identifiers, duplicate keys, mixed header aliases, and unusual prices.
Additional cases cover ambiguous baseline keys, conflicting product fields,
and the overwrite-disabled assumption.

The largest scenario generates 5,000 records in memory with eight selective
price changes and four excluded update rows. It asserts 4,996 compared variants,
four unpaired update rows, and eight price changes. It includes exact threshold
boundaries, zero transitions, maximum-width prices, and a one-millionth change.
This validates the record limit and selective matching; it is not a performance
benchmark or a promise about every file within the 10 MiB limit.

Assertions check affected identifiers, exact values, logical record numbers,
exclusions, and coverage findings. They do not depend on timestamps, generated
finding IDs, or whole-report snapshots. Run all engine and scenario cases with
`npm test`, or just the scenarios with `node --test tests/scenarios.test.cjs`.

## Confirmed defects corrected

| Trigger | Previous behavior | Corrected behavior |
|---|---|---|
| An ordinary price change below the alert threshold, or only informational coverage findings | The verdict said “No findings” | The verdict explicitly identifies informational findings and coverage |
| Update rows with missing or invalid handles | Rows were excluded but missing from the unpaired-row metric | The metric includes them, without counting missing SKUs twice or including invalid baseline rows |
| A very small price increases to a very large supported price | Floating-point conversion rounded the displayed percentage | The truncated percentage retains its exact decimal representation |
| A file or setting changes during the comparison's rendering yield | A stale report could appear, or file replacement could cause an internal error | The pending run is cancelled; the user explicitly compares the new inputs |
| Clear files follows a rejected file | The hidden error still contained its filename | Error text and the filename are removed from the DOM |

Focused regressions reproduced these failures before the fixes. Browser tests
hold and release the rendering yield and file read deliberately, so cancellation
checks do not depend on machine speed. Exact threshold arithmetic is unchanged.

For JSON consumers, `percentChange` remains a number for ordinary values. It is
an exact decimal string when converting to a number would change the displayed
value, or `null` when the percentage is undefined. For example, the supported
change `0.000001` to `999999999999.999999` exports
`"99999999999999999800"`, preserving the percentage through HTML, CSV, and JSON.
Consumers should accept the documented number/string/null representation.

## Executed checks and limits

- `npm test`: 92 passed, zero failures or skipped tests.
- `npm run build`: regenerated the standalone application from readable sources.
- `bash scripts/ci-browser.sh --no-sandbox`, with the interpreter and browser
  environment in [CI.md](CI.md): 14 browser groups passed through actual localhost
  navigation, including file selection, all three exports, settings, cancellation,
  clearing, and the narrow-screen layout. No JavaScript errors or application
  HTTP requests beyond the initial document navigation were observed.
- `git diff --check`: passed.

Local runtime: Node 24.19.0, Python 3.12.14, Playwright 1.62.0, and Chromium
154.0.8037.57. The cloud container requires the explicit sandbox exception
documented in [CLOUD_DEVELOPMENT.md](CLOUD_DEVELOPMENT.md). GitHub Actions runs
the same suites with sandboxing enabled; the Actions run for a given commit is
the source of hosted CI evidence. Fresh local browser results are ignored under
`.local-test-artifacts/`; uploaded historical artifacts are unchanged.

No real merchant data, store connection, or Shopify import round trip was used.
Direct-file navigation remains blocked by this cloud browser's administrator
policy. Windows double-click launch, other browsers, and real merchant workflows
remain manual validation tasks before a broader release. No public deployment,
billing, or change to repository visibility is part of this work.
