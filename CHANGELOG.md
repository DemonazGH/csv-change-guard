# Changelog

## Unreleased

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
