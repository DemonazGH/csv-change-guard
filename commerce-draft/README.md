# Product-page and checkout drafts

These are local, static review pages, prepared on 21 October 2026. They are not
a public offer, payment integration, entitlement system, or deployed website.
Every page is marked **Draft — not for sale**. Payment and download controls are
disabled. Following a link never simulates an order or grants a license.

Open `index.html` directly in a browser, or, from the repository root, preview
the directory with a local development command:

```powershell
python -m http.server 8091 --bind 127.0.0.1 --directory commerce-draft
```

Open `http://127.0.0.1:8091/`; stop the server with Ctrl+C. Python is only a
convenient preview tool. The draft pages and the app do not require Python to
run. Do not disable browser sandboxing or device protections to preview them.

| File | Review purpose |
| --- | --- |
| `index.html` | Product promise, target customer, scope, limits, proposed offer and FAQ |
| `checkout.html` | Proposed purchase summary, fit disclosure, draft commercial/support/privacy/refund terms |
| `confirmation.html` | Sample delivery instructions and cancellation, pending-payment, missing-download and device-blocking states |
| `styles.css` | Shared responsive styles; no imported fonts or assets |

The proposed offer is **$29 USD once, plus applicable tax finalized by the
payment provider**, for a downloadable utility licensed to one business and its
staff using it for that business. Unlimited local comparisons remain subject
to the app's input limits. Beta updates are proposed; future major versions
are not promised. There is no subscription or per-report payment gate.

These pages have no JavaScript, purchase/contact forms, external resources,
analytics, tracking, CSV selectors, or network integration. Their CSP disables
connections and form submission. All styles and navigation are local. The
application's local-processing behavior is unchanged. Actual purchase data
would be handled separately by a future provider; the provider does not need
catalog files.

Lemon Squeezy is a candidate, not an activated or approved checkout. The static
checkout layout previews copy and information order; it is not a replica or
promise about the provider's final interface. No account, live product,
payment link, credentials, order, receipt, or delivery link has been created.
The success/failure wording must be matched to verified provider states before
activation. A static confirmation URL is never proof that someone paid.

Before publication or sales, the owner must supply/review:

- Legal seller identity and contact details, actual support address and final
  support commitment. The proposed response target is two business days.
- Commercial license, refund process, privacy disclosure, applicable consumer
  information and digital-delivery consent wording where required. Existing
  repository/package UNLICENSED status remains unchanged; draft terms grant no
  commercial license.
- Product-name availability, final price/tax presentation, beta update scope,
  representative workflow fit and the purchase offer.
- Provider approval, hosted checkout and file delivery; verified purchase,
  pending/failure/cancel states, receipts, refunds and download recovery.
- A separate decision to publish, activate payments, or change any account or
  service. This preparation performs none of those actions.

No seller identity, customer story, paid-demand result, endorsement, or support
address has been invented. Windows browser evidence on the product draft is
explicitly dated and limited to the tested versions/routes. It is separate
from owner confirmations and does not establish broad merchant compatibility.
