# Lemon Squeezy Test-mode checkout, refund and recovery validation

**22 October 2026, Europe/Warsaw. Available bounded checks completed; refund
outcome unverified and hosted delivery blocked. Live sales remain disabled.**
This is not an overall checkout pass, real revenue or launch clearance.

## Scope and permissions

The agent operated the existing USD 29 single-payment Test-mode product through
connected Microsoft Edge UI on the owner's Windows computer. The owner completed
sign-in privately and supplied action-time approval for the insufficient-funds
checkout and provider Buyer Terms. Those owner actions are permissions, not
independent manual confirmations of the results below.

Browser/OS versions and sandbox launch arguments were not recaptured. No browser
security or sandbox settings were changed. These observations are separate from
the maintained application browser suites, earlier installed Chrome/Edge checks,
guided owner smoke tests and the unassisted participant trials, which remain
**Not run**. No application browser-suite rerun is claimed here.

Only the existing synthetic order, synthetic checkout details, the configured
support inbox and official provider test-payment data were used. No merchant
CSV, customer file, real card or identity document was needed. The app, internal
not-for-sale ZIP, product files, public website and account settings were unchanged.
No live activation, Copy to Live, campaign or external support inquiry occurred.

## Observed results

| Case | Status | Observation and boundary |
|---|---|---|
| Store/order baseline | Passed within scope | Fresh Orders showed Test mode checked, the live-activation prompt, one existing Paid synthetic USD 29 order and zero refunds. |
| Seller-assisted receipt recovery | Passed within owner-session scope | One Re-send receipt action produced a new receipt in the support Inbox. Its order-access link opened the same Paid order and expected internal ZIP listing. Orders remained at one result. This is not independent-buyer email delivery or an isolated session. |
| Recovered-order back/reload | Partial | Back from the blocked download and reload of the recovered order retained the same Paid order; the dashboard still showed one order. This did not test a new checkout confirmation, concurrent submissions or double-click protection. |
| Unpaid checkout abandonment/reopening | Passed within scope | A fresh original product-share link opened Test checkout. With a synthetic name and Poland selected, card fields blank and Pay disabled, the tab was closed without Pay. Order count remained one. Reopening the original product link produced a fresh checkout. This is not subscription cancellation or a guarantee about delayed email. |
| Required-postcode validation | Passed within scope | The first approved Pay click stopped at **The ZIP field is required**. A synthetic Polish postcode was entered; Test mode and the USD 29 total were unchanged before continuing the same approved checkout. No payment result was observed at the validation step. |
| Insufficient-funds decline | Passed within scope | The subsequent payment-processing attempt returned **Your card has insufficient funds. Try a different card.** No success page appeared. Fresh Orders still showed only the original Paid order, one result and zero refunds. A successful retry with another card was not run. |
| Targeted mailbox follow-up | Passed within observed time/query scope | The final product-specific receipt/refund/order-subject search returned only the original receipt and the one resent receipt, both for the original order. No additional matching receipt or refund notice was observed. This is not a guarantee about future messages or every possible notification route. |
| Full simulated refund | Attempted; unverified | One full refund was submitted in Test mode. The dialog disabled its buttons and closed, but seller Orders and the recovered customer order still showed Paid after reloads; the dashboard showed zero refunds. No matching refund notice or success/error explanation was observed. The inconclusive outcome is not a passed refund or a demonstrated provider defect. No repeat refund was submitted. |
| Recovered-order download retry | Blocked by Test mode | Download displayed **Downloads are not available in test mode**. ZIP listing and order access do not establish hosted retrieval, archive integrity or extraction. |

There were **two Pay clicks but one payment-processing attempt**: the first
stopped at postcode validation and the second reached Processing before declining.
The session also had one receipt resend and one full simulated refund attempt.
There were zero verified new paid orders and zero verified new refunds; these
outcome counts must not hide the submitted attempts. Optional Link account fields
were left blank.

## Unresolved gaps and next checks

- Establish the provider-supported Test-mode refund behavior or clarification,
  then verify the actual outcome and notice. Do not repeat an inconclusive refund
  blindly or call the current result a provider defect.
- Hosted ZIP retrieval, post-download checksum and extraction remain blocked in
  Test mode. Any later live-money/delivery check needs separate authorization;
  do not activate sales merely to obtain evidence.
- Independent-buyer and fresh-session receipt/recovery remain unverified. Test
  receipts route to the owner/team regardless of the entered buyer email, so
  another synthetic checkout would not close that delivery gap.
- New checkout-confirmation reload/back, concurrent/double-click submission
  behavior and a successful retry after decline were not tested.
- File-version updates, live payment/tax behavior, final supplier disclosures,
  privacy, withdrawal/consent and durable delivery of versioned terms remain open.
- Intended-user trials and representative merchant-workflow validation remain
  separate release gates; no new usability, merchant-data or import evidence is
  supplied by these purchase checks.

Use the remaining cases in [checkout acceptance](CHECKOUT_ACCEPTANCE.md) and
[seller/release gates](SELLER_DETAILS.md). The current ZIP still grants no
effective commercial licence. Final publication and live activation remain
separate owner decisions.

## Evidence handling and documentation verification

The owner-authorized private result record and screenshots were reviewed to
prepare this summary. They remain outside Git. Account/order/customer identifiers,
signed checkout/receipt/download links, payment fields, private machine paths,
mailbox screenshots and raw account exports are intentionally excluded. This
public record contains only the bounded results and limitations; it does not
link to private evidence or reproduce account screenshots.

Documentation checks are recorded in the pull request. No app rebuild,
repackaging or new application browser-suite run was needed for this record.
Source CI remains separate evidence from provider UI behavior.

## Primary provider references

Reviewed 22 October 2026. Documentation explains supported procedures and limits;
it does not prove that an account action succeeded.

- [Test mode](https://docs.lemonsqueezy.com/help/getting-started/test-mode):
  official fake-payment methods, owner/team receipt routing and disabled downloads.
- [Resend receipt](https://docs.lemonsqueezy.com/help/orders/resend-receipt):
  seller-assisted receipt recovery; observed recovery remains scoped above.
- [Refund order](https://docs.lemonsqueezy.com/help/orders/refund-order):
  full/partial dashboard refunds; this page does not establish successful
  Test-mode simulation or notification in the inspected account.
- [Sharing products](https://docs.lemonsqueezy.com/help/products/sharing-products):
  original product-share links versus customer-specific cart links. The
  abandonment/reopening check used the original share link.
