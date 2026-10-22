# Owner privacy settings and purchase checks — 22 October 2026

This follow-up records owner actions and a limited connected Windows Edge
inspection. **Live sales remain disabled.** It does not establish legal
compliance, completed purchase consent or provider delivery. The app, internal
ZIP, public website and published privacy notice were unchanged.

## Owner actions and assistant verification

The owner made each change, saved it and reported completion. The assistant
subsequently inspected the result; it did not operate privacy/security switches.

| Control | Earlier observation | Owner action and verification |
|---|---|---|
| Gmail external images | Always display selected | Owner selected **Ask before displaying external images**; selected state verified after returning to General settings |
| Gmail, Chat and Meet smart features | On | Owner disabled and saved; unchecked state verified after returning to General settings |
| Smart features in Google Workspace | On | Owner disabled and saved; off verified by reopening the settings panel |
| Smart features in other Google products | On | Owner disabled and saved; off verified by reopening the settings panel |
| Lemon Squeezy automated abandoned-cart emails | Enabled | Owner disabled and saved; off verified again after a full page reload |

These optional settings do not stop necessary provider processing, create a
consumer Gmail DPA or settle provider roles, transfers and retention. No email
was deleted, forwarding created or automatic retention rule enabled. The approved
monthly support-email review remains an owner procedure. Domain and paid email
remain postponed.

## Fresh purchase and consent observations

| Check | Observed result | Limit |
|---|---|---|
| Store state | Dashboard/Recovery showed Test mode checked and the store-activation prompt | No activation, Copy to Live or live payment configuration action performed |
| Other recovery defaults | Subscription renewal reminders off; payment auto-recovery and dunning enabled | Unchanged; applicability to the single-payment beta remains unassessed. Abandonment off does not prove every automatic email flow is off |
| Product receipt editor | Thank-you note, button text and button link blank | Read-only inspection; no versioned supplier-document delivery or consent record established |
| Product confirmation editor | Title, message, button text and destination blank | No changes saved; these appearance fields do not establish buyer assent or durable confirmation |
| Poland Test-mode checkout | Explicit Test-mode banner; synthetic cardholder name and postcode, Poland selected; subtotal and total displayed USD 29, with no separate tax line | Card/expiry/CVC blank and Pay disabled. No new order; not a final tax calculation, payment-ready acceptance check or test of controls that might appear later |
| Checkout notices | Lemon Squeezy Terms, Privacy and Help links visible; optional Stripe Link account terms shown separately | No separate supplier notice/EULA link, immediate-delivery control or withdrawal-loss acknowledgement observed in this state. Not a conclusion about all configurations, completed payment or live checkout |
| Provider inquiry | Targeted search and inspection of the previously approved privacy/withdrawal/consent inquiry showed the sent questions; no reply observed in that thread | No unrelated message bodies inspected, new inquiry or follow-up sent. This is not a search of every possible provider response route |

There was **no Pay submission, new order, receipt, download, refund, resend,
marketing signup or campaign** in this follow-up. No merchant files or customer
attachments were used. Existing successful fake-card and receipt evidence stays
historical and separate. The checkout used the existing signed-in owner account;
it is not an independent-buyer or fresh-session test.

## What remains before another purchase rehearsal or launch

1. Obtain provider answers about the actual supplier/MoR roles, retention and
   transfer arrangements, purchaser subscriber status and marketing permission.
   Creating a purchaser record is not evidence of promotional consent.
2. Establish the actual immediate-delivery/withdrawal choices, their default
   state, recorded wording/version/time and required durable confirmation.
   General provider terms and optional Link account creation do not verify these.
3. Confirm a supported way to present and deliver the exact approved supplier
   licence, refund/privacy terms and applicable withdrawal information. The
   blank receipt fields are not evidence that those documents reach a buyer.
4. Resolve current applicable withdrawal-function requirements and the
   responsible trader/provider implementation. This follow-up makes no new
   conclusion about Polish transposition or legal applicability.
5. Complete supplier/contact details, purpose-specific privacy/accounting
   retention, effective commercial terms and the matching final ZIP. Preserve
   the remaining cases in [checkout acceptance](CHECKOUT_ACCEPTANCE.md).

Do not enable sales or submit another checkout merely to make this list look
complete. In particular, [official Test-mode documentation](https://docs.lemonsqueezy.com/help/getting-started/test-mode)
states that file downloads are disabled and receipts route to owner/team members
regardless of the customer email entered. Repeating a Test purchase cannot prove
independent-buyer receipt delivery or retrieval of the hosted ZIP.

## Evidence and validation

Private screenshots and `CHECK-STATUS.json` are retained outside Git in the
owner's `outputs/purchase-consent-followup-2026-10-22` directory. They include the
owner-saved smart-feature/recovery states, receipt controls and Poland checkout.
Do not commit account/order identifiers, signed access links or private evidence.

This documentation follow-up passed `npm.cmd test` before and after editing:
**112 tests, zero failures** each time. `git diff --check` and relative Markdown
target checks passed. App/build/release/test/workflow inputs are unchanged; no
app rebuild, repackaging or fresh installed Chrome/Edge application-suite run
was performed. The browser observations above are separate from CI evidence.

## Primary provider references

Reviewed 22 October 2026; documentation does not establish actual account state.

- [Abandoned-cart emails](https://docs.lemonsqueezy.com/help/online-store/abandoned-cart-emails): automatic reminder flow and Recovery control.
- [Receipt customisation](https://docs.lemonsqueezy.com/help/checkout/customizing-receipt-emails): button text/link and optional thank-you note.
- [Purchaser subscriber records](https://docs.lemonsqueezy.com/help/email/subscribers): automatic addition, separate from verified marketing consent.
- [Buyer terms](https://www.lemonsqueezy.com/buyer-terms): provider contract/digital-content wording, separate from observing actual affirmative choices and confirmation.
- [Test-mode limits](https://docs.lemonsqueezy.com/help/getting-started/test-mode): receipt routing, file-download restriction and official synthetic payment methods.
