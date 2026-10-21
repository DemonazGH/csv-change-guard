# Seller/licence/refund preparation checks - 22 October 2026

These are documentation and inert-page checks, not a legal compliance opinion,
effective licence, hosted delivery result or live-sales approval. The owner
approved the commercial defaults and confirmed their own AI-assisted project
without employer/client/copied-asset claims. Private registration details and
the PDF are outside Git. See [seller gates](SELLER_DETAILS.md).

## Fresh checks

- `npm.cmd test` before/after: **112 passed, 0 failed**.
- `git diff --check`: passed. `git diff --exit-code -- src dist release scripts
  tests package.json .github`: passed; application, candidate templates, test
  assertions, packaging and repository licensing are unchanged.
- Existing `node scripts/build-release.cjs --output <fresh validation parent>`
  built a diagnostic-only candidate from this checkout. It was not uploaded,
  distributed or substituted for the earlier Lemon Squeezy test attachment.
- Existing `tests/beta_preview_test.py`, with explicit installed executable,
  archive, package and artifact paths: passed in **Chrome 155.0.8059.85** and
  **Edge 155.0.4283.62**, Windows, Python 3.14.0, Playwright 1.62.0. Four pages
  (three commerce drafts and unchanged packaged help), 1440x1000/390x844 viewports
  in each browser. Sandbox enabled; no security-disabling launch arguments.
- Local links/assets/anchors, draft notices, disabled controls, viewport fit,
  ZIP membership/CRCs/checksums and app identity passed. Zero page/console errors
  and zero HTTP requests from those local preview pages. Reviewed the checkout
  desktop/mobile screenshots. These are browser preview checks, not a fresh run
  of the 17-group application suite or an owner usability confirmation.
- Relative Markdown targets and a targeted private-identity/order-token preflight
  passed. An independent review found no blocking inconsistency or effective
  grant; contractor/agency wording was clarified after that review.

## Strict initial failure and unchanged historical ZIP

Both first preview attempts stopped **before browser launch** at `Help bytes
changed`: the frozen candidate's help uses LF and this checkout uses CRLF.
Normalised text was identical. Assertions were not weakened and no source,
test or historical archive was changed to pass. The separately built diagnostic
archive matched current checkout bytes and the original payloads after newline
normalisation. The distinction must remain visible:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Historical ZIP attached in Test mode; unchanged | 96,591 | `6c0224bd1487c0b897638ef97689a4e7d4fa2fb489a86ebeb99e7bff938c1277` |
| Local diagnostic candidate; not uploaded | 96,825 | `5a305b9dc6012de251b3a563ecd69fbf57423138c6ac82e0465b28d44b5354a1` |

Both are internal `0.1.0-beta.1` artifacts in separate output parents; neither
contains effective commercial terms. Identical visible text is not identical
archive bytes. A future paid package needs a deliberately new revision and
approved documents, rather than reuse of either test hash. `npm run build` was
not needed for these copy-only edits; CI separately verifies the generated app.

## Evidence and limits

- [Chrome result](../test-artifacts/seller-terms-2026-10-22/chrome-preview-results.json)
  and [Edge result](../test-artifacts/seller-terms-2026-10-22/edge-preview-results.json).
- [Desktop checkout screenshot](../test-artifacts/seller-terms-2026-10-22/checkout-desktop.png)
  and [mobile screenshot](../test-artifacts/seller-terms-2026-10-22/checkout-mobile.png).
- JSON uses UTC on 21 October; these runs occurred after midnight on **22 October
  in Europe/Warsaw**. User-facing date is the local date.

The real provider Test-mode order/receipt record is separate in
[checkout acceptance](CHECKOUT_ACCEPTANCE.md). No live activation, real charge,
refund, public terms publication, AI-agreement/title certification or statutory
withdrawal-flow validation was performed by this change. All CSV processing
remains local. The existing frozen help/contact wording must be reconciled only
when deliberately preparing a new commercial package.
