# Paid beta preparation — 21 October 2026

**22 October update:** the informational prelaunch page is public on Cloudflare
Pages; support is configured; a separate Lemon Squeezy Test-mode checkout/order/
receipt passed. Provider downloads are blocked in Test mode. Live activation is
still disabled. The owner approved one-business licensing, 12 months of support/
maintenance and a full 14-day voluntary refund. See [current seller/release gates](SELLER_DETAILS.md),
[review-ready terms](COMMERCIAL_TERMS_DRAFT.md) and [refund policy](REFUND_POLICY_DRAFT.md).
The historical preparation statements below describe 21 October; they do not
override this update. The original ZIP remains not for sale and unchanged.

**Internal candidate, not for sale.** The owner selected the recommended defaults
for preparation. This records the chosen direction; it does not announce a launch.
The application remains v0.1.0, with local CSV processing and unchanged behavior.

## Offer to test

| Decision | Selected direction |
|---|---|
| First user | English-speaking Shopify merchants and catalog operators who regularly update prices and have stable, non-empty SKUs |
| Delivery | Downloadable browser utility; extract the ZIP and open the HTML locally |
| Scope | The existing supported comparison subset, identifiers and limits; no new importer or store integration |
| Price experiment | USD 29 once for the beta, unlimited local comparisons within the limits; no subscription or per-report metering |
| Support | csvchangeguard.support@gmail.com; first-response target two Polish business days; 12 months of email support/maintenance from purchase approved for preparation |
| License | One business, staff/contractors solely for that business, its own stores/devices and backups; no agency/multiclient, resale or redistribution grant |
| Refund | Full voluntary refund requested within 14 calendar days, no reason required even after download; mandatory rights unaffected |
| Name | CSV Change Guard as the working name; availability has not been checked |

The five defaults concern scope, price, support, commercial-license drafting and
working name. Earlier decisions to use English, target international merchants
and keep all CSV processing local also apply. No testimonials, paid demand or
representative merchant validation are claimed.

The full engine is already inspectable in the public source repository. Selling
the official package, convenience and a commercial license is the experiment;
neither source secrecy nor enforceable client-side pay-per-report billing is
offered. The repository's `UNLICENSED` designation and visibility remain unchanged.

## Prepared artifacts

- [Offline help](../release/help.html) and [customer start instructions](../release/START_HERE.txt).
- An explicit-allowlist ZIP builder, manifest and SHA-256 checksums. See
  [release procedure](RELEASE_PACKAGE.md).
- [Local product-page, checkout and confirmation drafts](../commerce-draft/index.html),
  with purchase controls disabled and no payment or customer-data collection.
- [Commercial terms and refund/support copy for review](COMMERCIAL_TERMS_DRAFT.md).
- [Checkout and delivery acceptance plan](CHECKOUT_ACCEPTANCE.md).

The ZIP is marked `internal-preview-not-for-sale`. It contains the app, help, three
synthetic samples and the optional localhost server, without development history,
screenshots, merchant data, commerce drafts or tentative legal terms. Its
`0.1.0-beta.1` identifier describes this packaging candidate; it does not change
the app version or grant a paid license.

## Payment and delivery recommendation

Use a provider-hosted single-payment checkout with provider-hosted ZIP delivery,
initially Lemon Squeezy as a candidate. This avoids building an account system,
payment webhook service or entitlement backend for a downloadable utility.
CSV files never enter checkout; purchase data and support correspondence are a
separate data flow requiring their own accurate notice before launch.

Lemon Squeezy documents [hosted checkout links](https://docs.lemonsqueezy.com/help/checkout/hosted-checkout)
and [digital product files](https://docs.lemonsqueezy.com/help/products/adding-products).
Its [published ecommerce pricing](https://www.lemonsqueezy.com/pricing) lists no
monthly ecommerce fee and a base 5% + USD 0.50 transaction fee; additional fees
can apply. These are provider terms checked on 21 October 2026, not a fee quote
or a promise of account approval.

An approved live store requires the provider's
[activation and identity/business review](https://docs.lemonsqueezy.com/help/getting-started/activate-your-store).
The provider describes handling sales tax/VAT on its orders as merchant of record;
the owner's income/accounting obligations remain a separate matter. See its
[tax explanation](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat).
No provider account, product, test checkout, live checkout or payout setup has
been configured by this preparation.

## Release blockers, in order

1. An unassisted synthetic-file trial with several intended users. Record whether
   they can start, understand incomplete coverage and interpret the standalone
   report. Previous owner confirmations and browser automation are different evidence.
2. Authorized representative workflow validation, including multi-variant/image
   continuation cases and expected in-scope changes. Controlled importer behavior
   remains unverified. Do not market the app as an import simulator.
3. Final seller identity, contact details, support email, working-name availability
   and commercial terms. Review required digital-content remedies, applicable
   withdrawal rules, update obligations, price/tax presentation and business
   disclosures with the actual seller/provider arrangement. Do not enter identity
   documents or banking details into repository files.
4. Provider approval and an authorized test-mode checkout/delivery rehearsal using
   the acceptance plan. Replace every draft placeholder and reconcile the public
   product page, checkout, receipt, downloadable terms and help.
5. An explicitly authorized final release: versioned terms, tested package checksum,
   accurate privacy/support pages, approved public destination and live checkout.

These are release gates, not blockers to drafting or local technical tests. Do
not silently turn the internal ZIP into a paid release by removing its banner.
There is no public deployment, purchase, outreach or account change in this work.

## Next small task

Have an intended user run the packaged synthetic demo without live coaching.
Use the help and record completion time, misunderstood findings and requests
for support. Prepare provider test-mode setup in parallel once the seller and
support details are available; no real payment is needed for that rehearsal.
