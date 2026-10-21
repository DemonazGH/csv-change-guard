# Launch and validation plan

**Status:** functioning local prototype with internal paid-beta preparation,
not a public or paid launch. See [the selected offer and prepared artifacts](PAID_BETA_PREPARATION.md).

**22 October update:** an informational prelaunch page is public; support and
Lemon Squeezy Test-mode checkout/order/receipt are configured and partially
verified. Live sales remain disabled. Hosted downloads are blocked in Test mode.
Commercial defaults are owner-approved, with effective terms/privacy and provider
checks still pending in [seller details and release gates](SELLER_DETAILS.md).

## Goal

Validate a self-service product whose ordinary customer cycle can be automated. Start with paying demand and low support effort; work toward approximately USD 1,000 monthly operating profit before scaling. Personal after-tax income is a separate measure.

## Completed technical preparation

- [x] One bounded product scope and an explicit comparison contract.
- [x] Working browser prototype with synthetic examples.
- [x] Deterministic comparison, incomplete-match diagnostics and exportable reports.
- [x] Search, filters, responsive layout and no runtime third-party dependencies.
- [x] 106 engine/scenario tests and 17 grouped browser checks per route in Windows Chrome and Edge, with sandboxing enabled; see [current report-layout evidence](REPORT_LAYOUT_VALIDATION.md).
- [x] Official public sample compared with itself after focused compatibility fixes; coverage limitations remain explicit.
- [x] Automated Windows/Edge synthetic checks on 19 October 2026: 15 browser groups per route, demo/sample selection, clearing, report reopening and nine scenarios, with sandboxing enabled; see [Edge evidence](EDGE_VALIDATION.md).
- [x] Source package, build command, optional local server, and known limitations.
- [x] [Owner validation instructions](LOCAL_VALIDATION.md) and a blank results sheet.

Automated owner-machine checks and the official public sample have recorded
evidence. The [guided manual owner test](MANUAL_OWNER_VALIDATION.md) now records
the owner's synthetic workflow and report-comprehension confirmations for
Chrome and Edge. Representative merchant workflow validation remains open.

## Gate 1 — Owner smoke test

- [x] Open the provided standalone HTML on the owner's Windows computer.
- [x] Run the built-in demo in Chrome and Edge; inspect all six priority findings in Chrome.
- [x] Export a full HTML report in each browser; owner confirms it makes sense on its own after closing the app tab.
- [x] Test actual Windows file-selection behavior with the supplied sample pair in Chrome and Edge, and clear the selected files.
- [x] Complete the basic manual workflow on the recorded Chrome and Edge versions.
- [ ] Manually select a separate legacy/current-header pair; existing alias coverage is automated.

Checked manual items above are owner confirmations from a guided exercise, not
new automated evidence or an unassisted usability study. Four further synthetic
scenarios passed manually in Chrome; they were not repeated manually in Edge.
See the manual report for exact versions, counts and checks not run. These
results are not a browser support matrix or proof of Shopify import behavior.

## Gate 2 — Representative data, before publicity

- [ ] Use several authorized, anonymized product exports from real workflows, including multi-variant and image-continuation cases.
- [ ] Compare alerts with a human's expected results; track false alarms and missed in-scope changes.
- [ ] Check current platform schemas and complete a controlled development-store import comparison with suitable authorization.
- [ ] Add regression fixtures for observed differences.
- [ ] Decide whether the SKU requirement excludes too much of the target workflow. Expand matching only with an explicit, tested identity contract.
- [ ] Confirm the output solves a problem beyond existing import tools and spreadsheets.

Do not import the intentionally risky demo CSV into a real store. No live-store action has been performed or authorized here.

## Gate 3 — Distribution and commercial model

The owner selected a **paid downloadable utility**, with all CSV processing
local, and a **USD 29 one-time beta** price experiment. Local comparisons remain
unmetered within the existing scope. This is an offer to validate, not evidence
of paid demand. Browser source is inspectable; copy protection is not promised.
Hosted pay-per-report and subscription infrastructure are outside this beta.

- [x] Select a model and a price experiment for preparation.
- [x] Prepare an internal allowlisted ZIP, offline help and inert product/checkout drafts.
- [ ] Check name availability and select a domain only after owner approval.
- [x] Existing source repository is owned by DemonazGH and public; preserve its visibility and `UNLICENSED` designation during drafting.
- [x] Publish the informational HTTPS prelaunch page, with local CSV-processing scope and no live checkout.
- [ ] For a paid launch, configure seller/payment details, approved terms and support/refund process.
- [ ] Complete the [purchase privacy notice](PURCHASE_PRIVACY_DRAFT.md) and
  [privacy/withdrawal gates](PRIVACY_AND_CONSENT_REVIEW.md): production email terms,
  provider roles/transfers, retention, marketing separation and durable confirmation.
- [ ] Test provider-hosted single-payment checkout, duplicate/failed attempts,
  receipts, download retry and refunds using the [acceptance plan](CHECKOUT_ACCEPTANCE.md).
  No custom webhook/backend is proposed. Downloaded copies cannot be remotely revoked.

The source is published to the owner's GitHub repository. The informational
Cloudflare Pages site and a Lemon Squeezy Test-mode store now exist. No live
activation, real charge, paid hosting, purchased domain, ads or subscription is
part of this setup. A fake-card test order is not evidence of paid demand.

## Gate 4 — One acquisition experiment

Use one legitimate acquisition channel rather than spreading effort across many. Candidate: a precise product page, a useful sample result and a narrowly targeted search experiment. All ad budgets need separate approval; prior USD 150–300 suggestions are not spending authorization.

Avoid unsolicited mass outreach, fake reviews, fabricated customer logos and unhelpful generated SEO pages. No sales calls are required by the product design. Asynchronous feedback still matters.

## Proposed validation milestones

| Milestone | Evidence |
|---|---|
| Technical usefulness | Representative in-scope files produce understandable, reproducible reports |
| First demand | Five unrelated paying customers; distinguish them from free users and friends |
| Repeat value | Repeat purchases or renewal over the workflow's natural usage interval |
| Low operational effort | Measure owner-intervention minutes per job; provisional target below one intervention per 20 jobs |
| USD 1,000/month | Observed revenue minus actual payment, acquisition, refund, support and infrastructure expenses |

These are experiment targets, not industry benchmarks or predictions. Monthly subscriptions require active paying customers; one-time purchases require fresh sales each month.

## Measure before scaling

Record qualified visits, demo use, supported-file success, purchase attempts, completed purchases, delivered reports, refunds, repeat usage, false alerts and intervention time. The prototype currently contains no telemetry; choose a privacy-appropriate measurement method before a public test.

No relevant traffic is a distribution result, not proof of no demand. Relevant users trying and rejecting the tool is a different result. A profitable but support-heavy product can still fail the founder's low-touch objective.

## Next expansion only after evidence

Saved local profiles; larger supported files; additional exact schema adapters; a batch CLI; a paid API or partner license. Preserve the reusable core. Do not add autonomous store edits, ten integrations or a subscription dashboard before customer evidence supports them.
