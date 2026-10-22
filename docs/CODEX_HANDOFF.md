# CSV Change Guard — Codex handoff

Prepared: **18 October 2026**. Product remains **v0.1.0**.

**Latest 22 October preparation while provider answers are pending:** a fresh
support-inbox check found only the sent inquiry in the original thread and
subject search across all folders; a related Lemon Squeezy privacy/consent/
withdrawal message search found no reply. No follow-up message was sent.
The [unassisted synthetic trial protocol](UNASSISTED_BETA_TRIAL.md) and separate
[participant task card](UNASSISTED_BETA_TASK_CARD.md) prepare the next usability
check. Status is **Prepared; trials Not run**. No participant was contacted,
package distributed or new test result claimed. App, ZIP, public website,
repository licensing and disabled live-sales state remain unchanged.

**Latest owner settings follow-up, 22 October:** the owner saved Gmail external
images to Ask first, disabled all three inspected smart-feature controls, and
disabled Lemon Squeezy abandoned-cart emails. The assistant verified the saved
states, including a full reload of Recovery. The [follow-up record](PRIVACY_SETTINGS_FOLLOWUP.md)
also covers a bounded, unsubmitted Poland Test-mode checkout and blank receipt
customisation fields. No new payment, order, receipt, delivery, privacy-policy
publication or live activation occurred. Provider answers and purchase gates
remain open; no assistant privacy/security switches were operated.

**Latest 22 October privacy decision:** domain and paid email are postponed.
The owner approved a manual monthly review/deletion of routine support emails
after about three months from closure. Use the [current website/Gmail notice](CURRENT_WEBSITE_GMAIL_PRIVACY.md)
and [setup record](CURRENT_PRIVACY_SETUP.md), which supersede earlier purchase
and routine-retention proposals below. Consumer Gmail is not described as a
contracted processor. Optional Gmail privacy controls remain owner-operated;
no assistant security/privacy change, automatic deletion or live activation.

**22 October current status:** public informational prelaunch page and support
inbox exist; Lemon Squeezy Test-mode checkout/order/receipt passed, while hosted
downloads are blocked there. Live sales remain disabled. Commercial defaults
are owner-approved but licence text is not effective; personal supplier details
are held outside Git. Start with [seller details and release gates](SELLER_DETAILS.md),
[terms](COMMERCIAL_TERMS_DRAFT.md), [refund policy](REFUND_POLICY_DRAFT.md) and
[ownership review](OWNERSHIP_REVIEW.md). Older no-account/no-deployment statements
below are historical. App, repository licensing and the internal ZIP are unchanged.

The [purchase privacy draft](PURCHASE_PRIVACY_DRAFT.md) and
[consent/implementation review](PRIVACY_AND_CONSENT_REVIEW.md) now record a
bounded, unsubmitted Poland Test-mode checkout inspection. Consumer Gmail has
no DPA/processor role; automatic purchaser subscriber records do not establish
marketing consent. Production email, retention/transfers, withdrawal controls
and durable confirmation remain open. That earlier inspection changed no account
privacy settings or public policy; the later owner actions are recorded above.
No live activation is authorised.

Production email is now [specified for approval](PRODUCTION_EMAIL_SETUP.md),
with a [proposed privacy handling procedure](SUPPORT_PRIVACY_OPERATIONS.md).
Workspace and the domain are not active; the current Gmail contact remains in
use. The owner-approved provider inquiry was sent and verified in Sent. Purchase,
owner-operated account/security steps, delivery tests and final privacy copy
remain pending. Do not present draft procedures as settings already applied.

**21 October update:** the owner selected preparation of a USD 29 one-time
downloadable beta, local CSV processing, asynchronous support, commercial terms
for review and the working name CSV Change Guard. The internal allowlisted ZIP,
help and inert commerce drafts are described in [paid-beta preparation](PAID_BETA_PREPARATION.md).
There is no live checkout or public deployment. Repository licensing remains
`UNLICENSED`. The baseline and proposed sequence below are historical; use the
README and linked validation records for current tests and completed work.

## What the owner is trying to build

The owner chose CSV Change Guard as a first small remote-business experiment.
The preferred operating model is self-service discovery, purchase, onboarding,
and delivery with minimal ongoing manual intervention. The initial goal is
approximately $1,000/month profit, then growth; no sales or income is established.
Avoid turning this into a consulting engagement, managed service, or oversized
platform. Paid demand and a usable report matter more than the number of features.

Saved strategic idea: turn a useful repeated workflow into a reusable component
that can later be licensed to partners. This is a later option, not a reason to
add Microsoft ERP functionality to this prototype.

## Product hypothesis

A catalog operator may pay for an independent review of a proposed bulk product
update without giving the tool store credentials. Version 0.1 takes a current
Shopify product CSV and a proposed update in a documented subset and generates
findings. It is not a Shopify import simulator or certified safety checker.

Working promise: **Review the changes before the import.**

Pay-per-report, credits, a downloadable license, and recurring plans were
considered as hypotheses. The downloadable direction is now selected for
preparation, but no payments are implemented. A local freely
delivered engine cannot be reliably protected by a superficial paywall.

## What is implemented

- Dependency-free browser application, distributed as a standalone HTML file.
- Separate readable HTML/CSS/JavaScript sources and a simple Node build script.
- Supported UTF-8 comma-delimited CSV parsing and explicit header aliases.
- Exact handle + non-empty SKU comparison, with duplicate/missing-key diagnostics.
- Price changes and thresholds, explicit blanks, selected option/visibility
  changes, coverage disclosures, and incomplete-comparison diagnostics.
- Search, severity filtering, pagination, reset, and HTML/CSV/JSON exports.
- Synthetic demo and sample files.
- Optional localhost server and automated engine/browser tests.

The product has no store connection, backend, checkout, accounts, telemetry,
model calls, customer-file uploads, or public deployment. The prototype does not
require an OpenAI API key. Codex account usage is separate from product runtime.

## Files to know

| Path | Role |
|---|---|
| `src/engine.js` | Parser, comparison rules, findings, exports |
| `src/app.js` | File loading, interface events, report rendering |
| `src/index.html` and `src/styles.css` | Page structure and visual design |
| `src/demo.js` | Synthetic built-in demo |
| `build.cjs` | Standalone bundle generation |
| `dist/index.html` | Generated application; preserve the standalone use case |
| `server.cjs` | Local development fallback; serves the bundle |
| `tests/engine.test.cjs` | Node built-in tests |
| `tests/browser_test.py` | Optional Python/Playwright smoke suite |
| `samples/` | Synthetic inputs and example reports |
| `docs/PRODUCT_SCOPE.md` | Detailed behavioral contract |
| `docs/SECURITY_AND_PRIVACY.md` | Security/privacy decisions and review areas |
| `docs/TEST_REPORT.md` | Original verification and limitations |
| `docs/LAUNCH_PLAN.md` | Validation, monetization, and launch decisions |
| `test-artifacts/` | Original outputs/screenshots; historical, not fresh proof |

## Reproduced baseline

For this handoff, on Node v22.16.0 and npm 10.9.2:

```text
npm test          66 passed; 0 failed; 0 skipped
npm run build    succeeded; dist/index.html = 59,624 bytes
```

The regenerated application is byte-for-byte identical to the original package.
All original archive files are retained unchanged. Only handoff documentation
and verification metadata have been added. There is no Git history in this ZIP;
the owner should make the first commit after extraction.

The browser suite was not re-run during this handoff. Its original 11 grouped
checks rendered the exact standalone HTML using Playwright `page.set_content`.
This was an environment workaround, not verification of normal `file://`,
localhost, public HTTPS, or Windows double-click navigation.

Expected synthetic risky demo: 4 compared variants, 4 price changes, 6 priority
findings, 4 unpaired update rows, and 15 total findings. Multiple findings can
refer to one record. Use the actual test suite and fixture contract, not just
these counts, to reason about correctness.

## Constraints that must not disappear during refactoring

The product supports a subset, not every Shopify CSV behavior. Current limits
are documented in the README: 5,000 records, 10 MiB per file, 200 columns, and a
restricted decimal format. These are our prototype limits, not platform limits.

Current matching requires a SKU even though this is not a universal Shopify
requirement. SKU changes, handle changes, missing keys, and duplicates are not
resolved through guessing. This deliberate restriction may limit addressable
usage and should be evaluated with authorized data, not silently broadened.

Both files must concern the same store/currency; the application does not infer
currency. Images, inventory, taxes, shipping, market-specific prices, metafields,
arbitrary supplier formats, and unrecognized columns remain outside coverage.

Never imply that zero findings means an import is approved or safe. Changes to
assumptions/coverage should update code, tests, reports, and user documentation.

## Known gaps and proposed sequence (not implemented)

**First: baseline review.** Independently inspect source, run engine tests/build,
and record what is verified, blocked, or untested. See `CODEX_FIRST_TASK.md`.

**Next: portable browser verification.** The current suite needs Python,
Playwright, and Chromium but has no pinned test dependency manifest. It uses
in-memory HTML and an unconditional `--no-sandbox`. Define a reproducible local
and CI setup, add ordinary navigation checks where policies permit, and keep
any in-memory fallback explicit. Do not weaken host/browser security to pass.

**Then: small CI change.** Add a reviewed build/test workflow on pull requests,
with no production deployment and no secrets. Choose currently supported runtime
versions after checking official release information. Do not claim a Windows
run passed when only Linux was executed.

**Then: focused correctness/security review.** Review CSV edge cases, exact
arithmetic, field coverage, escaping, export handling, size limits, and ambiguous
keys. Add regression tests for evidence-backed problems. Passing existing tests
is not a proof of full Shopify compatibility or security.

**Then: authorized real-workflow validation.** Test with synthetic or expressly
authorized de-identified exports. Actual importer behavior needs a controlled,
authorized test environment; no production-store experimentation.

**After technical evidence: beta and purchase experiment.** Select the privacy,
delivery, and monetization architecture first. Public deployment, payment setup,
spend, and outreach require the owner's explicit direction.

## Remaining commercial decisions

- Initial segment and delivery/price experiment are recorded in the paid-beta plan.
- Unassisted user trials, representative merchant validation and acquisition evidence.
- Final support contact, effective terms, refund policy and purchase privacy notice.
- Hosting/domain, provider approval and test-mode delivery, and trademark/name checks.

Do not settle these by implementing whatever infrastructure is easiest for an
agent to generate. Present the smallest useful option and its tradeoffs.

## Documentation references

These official Codex pages were checked on 18 October 2026:

- [Project guidance with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex IDE extension](https://learn.chatgpt.com/docs/codex/ide)
- [Codex CLI](https://learn.chatgpt.com/docs/codex/cli)
- [Cloud environment setup](https://learn.chatgpt.com/docs/environments/cloud-environments)
- [Codex account access](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)

Original project documents contain the primary Shopify references used when the
prototype was created. Check current primary documentation before changing a
platform-specific rule; do not treat a legacy link as exhaustive evidence.
