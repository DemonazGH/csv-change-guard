# Checkout and delivery acceptance — partial Test-mode evidence

## Current status — 22 October 2026

The owner authorised a separate Lemon Squeezy **Test-mode** rehearsal. Connected
Windows Edge UI checks passed the USD 29 single-payment fake-card checkout,
matching paid test order, buyer receipt and seller notification in the support
Gmail Inbox. Receipt reply-to matched `csvchangeguard.support@gmail.com`.
The customer order listed the internal ZIP, but its Download action returned
**Downloads are not available in test mode**. This is an expected provider
restriction, not a passed delivery/extraction check. Live activation and actual
sales remain disabled. Private screenshots, IDs and signed access URLs are
outside Git; this summary is separate from the earlier app/browser suites.

Refunds, decline/cancel, duplicate submission, resend/recovery, updates,
independent-buyer receipt access, statutory disclosures and live tax handling
remain unverified. The owner approved preparation of the
[licence](COMMERCIAL_TERMS_DRAFT.md) and [refund policy](REFUND_POLICY_DRAFT.md),
not an effective contract or live release. See [release gates](SELLER_DETAILS.md).

A later 22 October read-only review inspected a **prepared Poland Test-mode
checkout without submitting Pay**, the existing test order and provider Design
panels. It found provider terms/privacy links but no separate supplier privacy
link, immediate-delivery consent or withdrawal-loss acknowledgement in that
state. No withdrawal function was observed on the inspected existing-order page.
This is a bounded observation, not a finding about all configurations or live
behavior. See the [privacy/consent review](PRIVACY_AND_CONSENT_REVIEW.md) and
[non-effective notice draft](PURCHASE_PRIVACY_DRAFT.md). No new order was created.

The local [draft checkout](../commerce-draft/checkout.html) is an inert copy/layout
preview. Opening it, following the sample confirmation link or viewing screenshots
does not verify a transaction. That local layout is not the separate real
Test-mode provider checkout described above.

The [later owner settings and purchase follow-up](PRIVACY_SETTINGS_FOLLOWUP.md)
verified owner-disabled abandoned-cart emails after reload and re-inspected the
Poland Test-mode checkout with card fields blank and Pay disabled. Provider links
were visible, but no separate supplier notice or delivery/withdrawal choice was
observed in that state. Receipt/confirmation customisation fields were blank.
No new Pay submission, order, receipt, download, refund or delivery evidence was
created. This is not a test of controls that might appear after payment details
or submission, nor an independent-buyer session or final tax check.

## Proposed provider configuration

- Single-payment digital download named CSV Change Guard paid beta; USD 29 base
  price, no subscription or quantity upsell. Confirm tax-inclusive display and
  final buyer total for the actual buyer markets before publication.
- Provider-hosted checkout and receipt/download delivery; no custom webhook
  backend, client-side entitlement check or runtime license activation.
- Final approved ZIP uploaded as a product file, with its version/checksum and
  matching license/help. Do not upload the current not-for-sale candidate as a
  live paid product.
- Support contact, seller disclosures, privacy, final refund/terms links and
  digital-delivery conditions reviewed before enabling sales.
- No CSV fields, uploads, store credentials, marketing opt-ins or catalog values
  in checkout, receipt parameters, purchase metadata or support templates.

## Test-mode evidence to record

Use only a provider-approved test method. Label every record test mode and keep
payment/customer identifiers, credentials and private URLs out of Git/screenshots.
An owner-approved live purchase would be a separate, later check.

| Case | Expected behavior | Evidence to retain |
|---|---|---|
| Successful single payment | Test checkout/order and receipt passed on 22 October; displayed subtotal/total USD 29 with no separate tax line. Live tax and delivery remain unverified | Mode/version and observed total; private account evidence outside Git |
| Declined or cancelled checkout | Clear next step; no success claim or delivered entitlement for a failed order | Redacted result and retry outcome |
| Reload/back/duplicate submit | No unintended duplicate purchase; verify actual provider order state | Order count and provider behavior, without IDs |
| Receipt and fresh session | Receipt reached owner/support Gmail; independent buyer/fresh-session access still untested | Access result; no private download token |
| Delivery/extraction | Blocked in Test mode; a separately authorised delivery check must verify ZIP hash, extraction and app/demo/report with sandboxing | Artifact hash, browser/OS and actual result; do not count local candidate tests as provider delivery |
| Lost receipt/download retry | Provider can resend access; retry does not create a new charge | Support/provider recovery steps and observed result |
| Refund | Provider test mode supports a documented refund test or case is explicitly not run; no claim downloaded copies are remotely revoked | Financial state and refund notice result |
| New file version | Existing buyer access and fresh buyer delivery are understood; version, help and terms agree | Old/new version behavior |
| Purchase privacy | Required purchase data goes only through disclosed seller/provider flows; no catalog data enters them | Field/notice review and redacted observations |
| Regional disclosures | Buyer sees correct seller/terms, tax-inclusive final amount and any required digital-content consent before ordering | Applicable test region and reviewed copy |
| Express delivery consent / withdrawal acknowledgement | Where relied on for the paid digital-content exception, actual prior choice and required durable confirmation are established separately from generic provider terms or optional Link account creation | Exact wording/version, affirmative action, timestamp and buyer confirmation; not verified by the prepared checkout |
| Online withdrawal function | If applicable under current law, accessible function, distinct confirmation and durable receipt acknowledgement work | Applicability/provider confirmation first; function not observed on the inspected test-order page |
| Versioned supplier documents | Approved licence, refund and privacy text available before purchase and delivered through the required durable confirmation | Exact versions received by buyer; not merely links to mutable pages |
| Marketing separation | Automatic purchaser subscriber record does not cause unauthorised marketing; optional signup/tracking handled deliberately | Owner saved abandoned-cart emails off and assistant verified after reload. Other subscriber/consent/retention questions remain; no campaign/export/signup to obtain evidence |

A downloadable unmetered app cannot erase or disable an existing local copy
after refund. Any license consequences belong in reviewed terms and provider
operations; do not advertise technical revocation. The provider's test mode may
not reproduce all taxes, email delivery, payout or refund behavior. Mark such
limits explicitly and obtain separate authorization for any live-money check.

## Release decision

Review observed results, remaining merchant-validation gaps and all unresolved
placeholders. Final launch needs explicit authorization for the exact public
destination and checkout activation. A green source CI run or a local draft
screenshot is not a passed checkout/delivery test or evidence of paid demand.
