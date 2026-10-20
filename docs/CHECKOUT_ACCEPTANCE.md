# Checkout and delivery acceptance — not yet executed

The local [draft checkout](../commerce-draft/checkout.html) is an inert copy/layout
preview. Opening it, following the sample confirmation link or viewing screenshots
does not verify a transaction. No checkout or provider-delivery tests have run.

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
| Successful single payment | Correct product, currency, total/tax and no renewal; exactly one order with receipt/download access | Redacted mode/version/result and expected/observed total |
| Declined or cancelled checkout | Clear next step; no success claim or delivered entitlement for a failed order | Redacted result and retry outcome |
| Reload/back/duplicate submit | No unintended duplicate purchase; verify actual provider order state | Order count and provider behavior, without IDs |
| Receipt and fresh session | Receipt reaches test inbox; download is available independently of the marketing page | Access result; no private download token |
| Delivery/extraction | Received ZIP hash equals approved artifact; Windows Extract All works; app/demo/report work with sandboxing enabled | Artifact hash, browser/OS and test result |
| Lost receipt/download retry | Provider can resend access; retry does not create a new charge | Support/provider recovery steps and observed result |
| Refund | Provider test mode supports a documented refund test or case is explicitly not run; no claim downloaded copies are remotely revoked | Financial state and refund notice result |
| New file version | Existing buyer access and fresh buyer delivery are understood; version, help and terms agree | Old/new version behavior |
| Purchase privacy | Required purchase data goes only through disclosed seller/provider flows; no catalog data enters them | Field/notice review and redacted observations |
| Regional disclosures | Buyer sees correct seller/terms, tax-inclusive final amount and any required digital-content consent before ordering | Applicable test region and reviewed copy |

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
