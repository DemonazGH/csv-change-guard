# Changelog

## Unreleased

- Add reusable synthetic catalog scenarios for partial updates, explicit clearing,
  reordered variants, ambiguous identifiers, mixed headers, and large updates.
- Distinguish informational findings from a report with no findings and include
  invalid-handle update rows in the unpaired-row count.
- Preserve exact displayed percentages when values exceed numeric display precision.
- Cancel pending comparisons when files/settings change and remove old error
  content when clearing files.
- Add GitHub Actions checks for engine tests, generated-build freshness, and
  sandboxed Chromium smoke tests, with failure artifacts and server cleanup.
- Import the complete v0.1.0 prototype into the cloud repository.
- Fix rounded percentage thresholds that could create or miss price alerts;
  add six regression tests for exact boundaries and small thresholds.
- Make browser checks portable across localhost, direct-file, and explicit
  in-memory modes, with sandboxing enabled by default and fresh result artifacts.
- Pin optional browser-test dependencies and document reproducible cloud setup.

## 0.1.0 — 2026-10-18

Initial local prototype: deterministic Shopify CSV subset comparison, conservative matching, selected risk checks, browser UI, synthetic demo, HTML/CSV/JSON exports, tests and launch documentation. No public deployment or paid business cycle yet.
