# Shopify compatibility validation — 18 October 2026

Fresh evidence for the two compatibility fixes built on base `efa88c7`.
See [the report](../../docs/SHOPIFY_SAMPLE_VALIDATION.md) for behavior, runtime,
source/hash, before/after results and limitations. The run summary records the
base commit and engine/build hashes of the modified working tree tested.

- `regressions-before-fix.txt`: 9 failing new regressions against the old engine.
- `engine-tests.txt`: all 106 tests passing after the fix.
- `sample-source.json` and `sample-comparison.json`: official input provenance
  and aggregate before/after results; the input CSV itself is not committed.
- `browser/file-*` and `browser/url-*`: 15 passing groups per route, screenshots
  and synthetic exports, including the new offline compatibility regression.
- `official-file/` and `official-localhost/`: actual official-sample file selection,
  report downloads/reopening, launch flags, metrics and screenshots.
- `start-here/`: demo/sample/clear/download workflow and nine synthetic scenarios.
- `run-summary.json` and console logs: commands, exit codes, build hashes and timing.
- `*.py.txt`: archived supplemental scripts, with paths replaced. These are source
  records, not maintained runnable test commands; restore paths and use a fresh
  destination to reproduce them.
- `artifact-manifest.json`: original and published SHA-256 values for 58 captured
  files. Screenshots and exports are unchanged; metadata/log paths are normalized.

`<repository>`, `<validation-artifacts>`, `<codex-task>` and `<user-profile>` replace
machine-specific paths, including inside recorded file URIs. JSON whitespace may
also be normalized. Counts, timestamps, versions, errors and sandbox flags retain
their values. Whitespace-only diagnostic lines in the failing Node log have
their trailing spaces removed; this is recorded in the manifest. The original
evidence and public input remain local outside these
tracked artifacts. Historical Windows evidence in the neighboring directory is
unchanged. Future runs belong in fresh ignored `.local-test-artifacts/` directories.

Inputs are synthetic project fixtures or Shopify's public template. No real
merchant data, store connection or import was used. The separately downloaded
public CSV is deliberately not distributed here as a project fixture.
