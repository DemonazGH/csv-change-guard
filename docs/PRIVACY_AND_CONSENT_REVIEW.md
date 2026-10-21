# Purchase privacy and withdrawal review — 22 October 2026

**Draft preparation and limited Test-mode inspection. Live sales remain disabled.**
This is an implementation review, not legal compliance certification. The
[customer notice](PURCHASE_PRIVACY_DRAFT.md) is non-effective and contains explicit
completion fields. No app, ZIP, public website, account privacy setting or live
payment configuration was changed during this review.

The public website and working support inbox already have transparency and
handling obligations. Complete accurate **current prelaunch website/support
information now**, separately from the future purchase notice. Disabled sales
do not postpone those duties, and this unpublished draft does not fulfil them.

## Evidence and boundaries

| Check | Evidence | Result and limit |
|---|---|---|
| Local CSV processing | Existing app architecture and unchanged source | No checkout integration or catalog upload added. Earlier Windows Chrome/Edge suites remain historical evidence; not rerun as part of this provider inspection |
| Prepared regional checkout | Connected Windows Edge, existing store, USD 29 Test product; synthetic Poland buyer/postcode and official fake-card values; ready-to-pay state inspected | Test banner visible. No Pay submission, new order, receipt, consent or refund created in this review |
| Checkout notices | Visible Terms, Privacy and Help footer | Links point to Lemon Squeezy's documents/help. No separate supplier notice/EULA link, express immediate-delivery control or withdrawal-loss acknowledgement observed in this inspected state. Not proof of every region, configuration or live flow |
| Optional saved information | Stripe Link phone/name section and its own terms/privacy text | Describes Link account creation; not supplier marketing or digital-content withdrawal consent. Optional fields left empty |
| Customer's existing test order | Read-only My Orders inspection of the earlier rehearsal | File, Download and Generate Invoice visible; no withdrawal function observed on that page. No action invoked. Signed access URLs and order identifiers stay outside Git |
| Tracking configuration | Design > General, read-only | Google Analytics and Meta Pixel both unchecked. This does not establish that provider checkout uses no cookies or technical data |
| Store/signup configuration | Design > Store preview, read-only | Enable store and Show subscribe form checked in editor; no changes or Publish click. Actual storefront says **This store has not been activated**. The preview is not evidence of a publicly accepting signup form |
| Subscribers | Official Lemon Squeezy documentation | Purchasers are automatically added to subscriber records. Actual record consent/status and a marketing opt-out configuration were not verified. No list export, campaign, marketing signup or outreach performed |
| Receipt/delivery | Earlier owner-authorised Test-mode rehearsal | Receipt reached the support Inbox, but provider download is unavailable in Test mode. No new durable-terms/consent confirmation or delivery evidence obtained here |

Private screenshots `test-checkout-top.png`, `test-checkout-footer.png` and
`store-not-activated.png` are retained outside Git in the owner's dated
`outputs/purchase-privacy-2026-10-22` folder. They show this inspection only;
they are not a new application compatibility test or a successful transaction.

Repository validation for this documentation change: `npm.cmd test` passed
**112 tests, zero failures**, before and after the edits. `git diff --check`
passed, all relative Markdown file targets in the eight changed/new documents
resolved, and a diff of app/build/release/test/workflow inputs was empty. No
build, repackaging or new Chrome/Edge app-suite run was needed or claimed.

## Data map and decisions

1. **Application:** selected CSVs and reports stay on the buyer's device. Do not
   request them through purchase fields or support, or send accidental merchant
   attachments to models, tools or Git. The comparison does not need consent to
   upload data because no upload is implemented.
2. **Website:** the inspected static prelaunch page has no forms, analytics or
   advertising scripts. Cloudflare still receives technical visitor data. Its
   terms incorporate a DPA for covered processing, but actual account agreement,
   supplier log access/retention and purpose-specific roles/transfers need review.
3. **Purchase:** supplier access to buyer/order records is a separate data flow.
   Lemon Squeezy's order-export documentation describes contact, billing, tax and
   partial card metadata. It does not mean all fields are required/received in
   every order. Do not export lists merely to confirm the schema.
4. **Email:** the working support address is consumer Gmail. Google's official
   help says this service has no DPA and Google does not act as processor for it.
   Recommend business email with applicable processing terms before customer
   support, or obtain a qualified assessment of the actual consumer-service
   arrangement. This is not a blanket finding that all business use of Gmail is
   unlawful. No provider was purchased or privacy setting changed.
5. **Roles and transfers:** Lemon Squeezy's DPA covers company personal data it
   processes on the supplier's behalf. Its MoR obligations and provider privacy
   policy also require independent-purpose analysis. Do not label all purchase
   processing solely processor activity or promise EEA-only hosting. Obtain the
   actual role map, subprocessors and applicable transfer safeguards.
6. **Marketing:** necessary order records do not establish promotional consent.
   No marketing is authorised. Keep campaigns, signup and optional tracking out
   of the intended launch configuration; confirm the provider's defaults and
   retention first. Do not delete purchaser records or disable receipts to make
   a subscriber list appear empty.
7. **Retention:** propose 90 days after closure for routine support, subject to
   owner approval and an implemented review process. Separately justify minimum
   licence recognition, the 12-month included support period, duties and claims.
   Ask the accountant which supplier records and statutory periods apply. Do
   not apply a generic five-year rule to every email, or a service-ending DPA
   deletion clause to all MoR records. No deletion schedule is implemented yet.

## Withdrawal, delivery and confirmation gates

The voluntary **full refund within 14 calendar days, even after download** is the
owner's approved commercial default. It does not remove statutory withdrawal,
digital-content remedies or complaint rights.

Before live release, establish the applicable consumer and Polish sole-trader
protections for the actual supplier/MoR arrangement. Where a paid digital-content
withdrawal exception is relied on, verify express prior consent to begin supply,
acknowledgement of the resulting loss of the right, and the required durable
confirmation. Proposed controls must be distinguishable from general buyer terms
and must not be preselected. A provider's generic waiver clause or our optional
Link fields are insufficient evidence of the actual buyer's choice.

EU Directive 2023/2673 provides an online withdrawal-function requirement with
application from **19 June 2026**. Verify current Polish implementation and its
applicability to this purchase route, the responsible trader and any withdrawal
exception. Where applicable, check prominence/access during the withdrawal
period, identification of the contract and consumer, a distinct confirmation
step, and a timestamped durable acknowledgement of receipt. This review does
not establish the Polish transposition status or provider noncompliance.
An ordinary refund email/button is not automatically the statutory function.

A bounded official-source check found [UOKiK's implementation consultation
page](https://uokik.gov.pl/bip/implementacja-dyrektywy-parlamentu-europejskiego-i-rady-ue-2023-2673),
whose substantive notice concerns 2024 preconsultation, not an enacted act.
The later Sejm reply located by search could not be read past human verification.
No enacted national citation or commencement was established; this is evidence
of an unresolved check, not evidence that Poland has or has not implemented it.

Keep evidence of the exact approved supplier licence, refund/privacy notice and
delivery/withdrawal wording available before purchase and delivered in the
required durable confirmation. Preserve the actual assent wording/version,
timestamp and confirmation result where required; a mutable webpage or source
Git commit is not proof of what a particular buyer received. Do not add a blanket
"I consent to the privacy policy" checkbox as a substitute for a lawful basis.

## Next actions and owner handoffs

| Action | Who / status |
|---|---|
| Finalise accurate privacy information for the existing public page and support inbox | Immediate prelaunch follow-up, independent of sales; resolve actual provider/contact/retention details and obtain final public-copy approval |
| Complete public controller identity/contact from the private seller worksheet | Owner confirmation; do not commit the registration extract, address or tax identifiers here |
| Choose production email arrangement and applicable processing terms | Owner decision needed; no paid activation, domain purchase or account privacy/security changes authorised by a budget ceiling |
| Send the prepared seven-question provider inquiry | Draft exists outside Git; **not sent**. Explicit owner permission required before emailing hello@lemonsqueezy.com |
| Confirm role/transfer map and retention for host, email, MoR and supplier | Provider/accountant review pending; complete draft notice and operational schedule afterward |
| Confirm applicable withdrawal controls, durable evidence and online function | Provider/legal response pending, then a separate bounded Test-mode rehearsal; no new acceptance or payment performed here |
| Review optional signup/tracking/marketing defaults | Read-only findings above. Owner must make any privacy-setting changes; observe the result afterward |
| Publish final notice and supplier terms / revise paid ZIP | Separate final review and owner publication approval; current beta.1 archive and public prelaunch site unchanged |
| Activate sales | Explicitly excluded. No live product copy, activation, real charge or payout setup |

The browser-control skill prohibits changing in-app privacy/security settings.
The owner must perform those changes if required; reading their current state
does not authorise an assistant to switch them. Provider inquiries also need
explicit messaging authorisation. These limits do not block drafting or checks.

For support/privacy requests: ask for minimum order identification, never full
card details or identity documents by default. Verify the requester proportionately,
record the request/deadline, coordinate the provider's independent records, and
explain lawful retention limits. No automatic erasure, rights-request system or
retention enforcement has been implemented. Do not open/forward accidental
merchant attachments; use an owner-controlled handling/deletion procedure.
Production support should remain owner-handled with minimum access. This setup
review used synthetic mail; it does not authorise sending future customer email
or attachments to an assistant or other new recipient.

## Primary sources

Reviewed 22 October 2026. Sources inform the review; applicability and actual
account configuration still need confirmation.

- [Google consumer services and DPA roles](https://support.google.com/policies/answer/9581826?hl=en), Enterprise customer requests section.
- [Lemon Squeezy DPA](https://www.lemonsqueezy.com/dpa) and [privacy policy](https://www.lemonsqueezy.com/privacy); the public privacy page bears a 1 June 2021 date. Do not treat that as a verified current internal retention schedule.
- [Buyer terms](https://www.lemonsqueezy.com/buyer-terms), [hosted checkout](https://docs.lemonsqueezy.com/help/checkout/hosted-checkout), [checkout API fields](https://docs.lemonsqueezy.com/api/checkouts/create-checkout) and [receipt customisation](https://docs.lemonsqueezy.com/help/checkout/customizing-receipt-emails). Appearance fields do not establish a supplier-terms/consent control.
- [Purchasers and subscribers](https://docs.lemonsqueezy.com/help/email/subscribers), [order exports](https://docs.lemonsqueezy.com/help/orders/exporting-orders), [refunds](https://docs.lemonsqueezy.com/help/payments/refunds-chargebacks) and [Test-mode limits](https://docs.lemonsqueezy.com/help/getting-started/test-mode).
- [Lemon Squeezy help/contact](https://www.lemonsqueezy.com/help) identifies hello@lemonsqueezy.com as a support destination. No inquiry has been sent.
- [Cloudflare terms](https://www.cloudflare.com/terms/), [customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) and [privacy policy](https://www.cloudflare.com/policies/privacy/).
- [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj), especially Articles 6, 12–14, 28 and 44 onwards; [Commission legal-basis guidance](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en), [EDPB individual rights](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en) and [international transfers](https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en).
- [Consumer Rights Directive and amendments](https://eur-lex.europa.eu/eli/dir/2011/83/oj), [Directive 2023/2673](https://eur-lex.europa.eu/eli/dir/2023/2673/oj) and [Polish Consumer Rights Act consolidated text](https://eli.gov.pl/api/acts/DU/2024/1796/text.html). Check later amendments and current applicability; the consolidated text alone is not a transposition check.
