# Launch and validation plan

**Status:** functioning local prototype, not a public or paid launch.

## Goal

Validate a self-service product whose ordinary customer cycle can be automated. Start with paying demand and low support effort; work toward approximately USD 1,000 monthly operating profit before scaling. Personal after-tax income is a separate measure.

## Completed in this delivery

- [x] One bounded product scope and an explicit comparison contract.
- [x] Working browser prototype with synthetic examples.
- [x] Deterministic comparison, incomplete-match diagnostics and exportable reports.
- [x] Search, filters, responsive layout and no runtime third-party dependencies.
- [x] 66 engine tests and 11 grouped browser checks.
- [x] Source package, build command, optional local server, and known limitations.

## Gate 1 — Owner smoke test

- [ ] Open the provided standalone HTML on the owner's Windows computer.
- [ ] Run the built-in demo and examine all six priority findings.
- [ ] Export a full HTML report and confirm it explains the findings without assistance.
- [ ] Test actual file-selection behavior and the supported legacy/current headers.
- [ ] Test on both current Chrome and Edge before promising compatibility.

## Gate 2 — Representative data, before publicity

- [ ] Use several authorized, anonymized product exports from real workflows, including multi-variant and image-continuation cases.
- [ ] Compare alerts with a human's expected results; track false alarms and missed in-scope changes.
- [ ] Check current platform schemas and complete a controlled development-store import comparison with suitable authorization.
- [ ] Add regression fixtures for observed differences.
- [ ] Decide whether the SKU requirement excludes too much of the target workflow. Expand matching only with an explicit, tested identity contract.
- [ ] Confirm the output solves a problem beyond existing import tools and spreadsheets.

Do not import the intentionally risky demo CSV into a real store. No live-store action has been performed or authorized here.

## Gate 3 — Distribution and commercial model

Choose one model before implementing checkout:

**A. Paid local/downloadable utility.** Sell access to the actual utility or a license; files stay local. A sample-only public demo can be separate from paid delivery. Copy protection and recurring revenue are not automatic, and license checks cannot make browser source secret.

**B. Hosted pay-per-report service.** Requires a real server-side payment/entitlement boundary and idempotent delivery. If files move to a server, the present “no uploads” promise must change; design retention, deletion, security, support and privacy disclosures before accepting data.

**C. Free local utility with later paid capabilities.** Can test usability and acquire relevant users, but free usage does not validate willingness to pay.

The previous USD 9–19/report and USD 29–49/month figures are pricing hypotheses, not verified prices or implemented plans. Do not force a subscription before observing repeated need.

- [ ] Select a model and a price experiment.
- [ ] Check name availability and select a domain only after owner approval.
- [ ] Select a repository owner and visibility; no public code publication by default.
- [ ] Deploy a clearly labelled HTTPS test site with an accurate data-handling statement.
- [ ] For a paid launch, configure seller/payment details, approved terms and support/refund process.
- [ ] Test checkout, server-verified payment events, duplicate events, failed payment, delivery retry, refunds and revocation as appropriate to the selected model.

No domain, paid hosting, seller account, ads, subscription or external publication has been created by this work.

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
