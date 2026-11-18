# Security and privacy notes — prototype

These notes describe the **offline utility**, not every service around its sale.
The [current website/Gmail notice](CURRENT_WEBSITE_GMAIL_PRIVACY.md) describes
the existing informational page and support inbox, with evidence and owner
handoffs in the [current setup record](CURRENT_PRIVACY_SETUP.md). The separate
[purchase privacy draft](PURCHASE_PRIVACY_DRAFT.md) and
[privacy/consent review](PRIVACY_AND_CONSENT_REVIEW.md) still have unresolved
paid-release gates. Live sales remain disabled; domain/paid email are postponed.

## Data flow

The free-beta website download serves a reviewed ZIP and checksums through the
existing static host, without signup, checkout or an email gate. The ZIP contains
the unchanged local app plus help, terms and synthetic samples; it accepts a
user's own supported files only after opening the extracted app locally. The
online synthetic demo still has no file selector. See
[free-beta validation and publication status](FREE_BETA_RELEASE.md).

A user-selected file is read through the browser File API, decoded strictly as UTF-8, parsed and compared in memory. No file is submitted to a server or model API. The static application has no network requests, analytics, cookies or local-storage persistence. Its content-security policy disables network connections and form submission.

The Clear files action removes source references and rendered report content from the application. JavaScript memory is managed by the browser; this is not guaranteed secure erasure. Browser extensions, the operating system, filesystem backups and downloaded report handling are outside this tool's control.

## Output precautions

Untrusted values are escaped before inserting them into HTML. Report CSV cells starting with common formula-trigger characters, including after leading whitespace, are prefixed with an apostrophe and quoted. This is a defense for spreadsheet viewing, not a promise against every spreadsheet application's behavior. JSON preserves original strings. Do not treat exported findings as an import-ready product CSV.

HTML/JSON/CSV report downloads can contain sensitive identifiers and before/after values. Store and share them accordingly. The HTML report is static and contains no scripts. Values are not executed, image URLs are not fetched, and no automatic fixes are written.

## Optional website analytics boundary

On 18 November 2026 the owner explicitly authorised free Cloudflare Web
Analytics and its weekly aggregate email report. This is a change to the
informational website, not permission to add telemetry to the utility or demo.
The current [website/support privacy notice](CURRENT_WEBSITE_GMAIL_PRIVACY.md)
describes the new purpose, provider, choice and retention. Earlier records that
show Web Analytics disabled describe their dated inspections.

Only the home page, Shopify CSV guide and privacy page offer the analytics
choice. They must not load the vendor script or send analytics before an
explicit opt-in. Declining, leaving the choice unanswered, unavailable browser
storage and disabled JavaScript must fail closed for analytics while leaving
content and downloads usable. The only preference stored by our code is a
per-tab `sessionStorage` choice, without a user identifier. An equally accessible
footer control permits changing or withdrawing it; withdrawal stops future
collection by reloading into the denied state. It cannot recall prior beacons.

The public synthetic demo, its comparison assets, the standalone app,
downloaded package, free-use terms and exported reports remain outside this
integration. Their network restrictions and source bytes must be preserved.
Do not enable site-wide automatic beacon injection, add activation checks,
collect custom app events, or send filenames, CSV values, findings, report
contents or persistent identifiers. Restrict script and connection permissions
to the reviewed informational-page integration; do not relax the demo or
utility CSP to make analytics work.

Cloudflare describes cookie-free analytics without localStorage or individual
fingerprinting, and removal of IP addresses before analytics storage. This is
separate from technical requests reaching its infrastructure with IP addresses
and request metadata. Its beacon can create an ephemeral random `pageloadId`
and report page/referrer URLs and in-memory timing/memory values; this is not a
persistent visitor identifier. Provider statements about analytics data do not imply
zero hosting/security records. The standard service has no custom-event or UTM
support; `#download` is a fragment, not a counted ZIP event. Page views, visits,
referring sites and performance statistics do not establish unique users,
completed downloads, usability, repeat use or paid demand. Weekly reports
contain aggregate website statistics and go only to the existing owner inbox.

### Consent and scope review

Do not equate cookie-free analytics or provider privacy claims with a blanket
consent exemption. The EDPB's final Guidelines 2/2023 discuss browser-local
results sent to third parties within ePrivacy Article 5(3), while exemptions
need a separate assessment. Poland's PKE Article 399 addresses terminal storage
or access with prior information and consent, subject to its necessity
exceptions. This implementation therefore uses explicit opt-in globally and
consent for the optional analytics purpose, rather than extending the notice's
legitimate-interests basis for necessary website operation and support.
This bounded technical/privacy design is not a legal-compliance certificate or
an independent assessment of every applicable national rule.

Provider dashboard access is currently six months; the FAQ describes seven days
of unsampled data, subsequent aggregation/sampling and potentially sampled
queries. Do not turn that access window into an erasure guarantee. No raw
visitor export is introduced. The owner reviews aggregate report emails for
deletion about three months after receipt under the existing monthly procedure;
no mailbox purge or automatic deletion is authorised by this setup.

Primary references reviewed on 18 November 2026:

- [Cloudflare analytics privacy/architecture](https://blog.cloudflare.com/the-rum-diaries-enabling-web-analytics-by-default)
- [Cloudflare data collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/)
- [Cloudflare RUM beacon fields and processing](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- [Cloudflare dimensions](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)
- [Cloudflare FAQ, data access and sampling](https://developers.cloudflare.com/web-analytics/faq/)
- [Cloudflare weekly notifications](https://developers.cloudflare.com/web-analytics/get-started/notifications/)
- [EDPB final Guidelines 2/2023, version 2.0](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en)
- [Polish PKE, Article 399](https://eli.gov.pl/api/acts/DU/2024/1221/text.html)

## Limits and remaining release work

Input limits reduce accidental resource exhaustion but are not a complete adversarial denial-of-service evaluation. There has been no external penetration test, security certification or comprehensive browser compatibility test. The public synthetic demo has a [bounded publication check](PUBLIC_SYNTHETIC_DEMO.md), separate from private-file or full utility compatibility evidence.

The public synthetic demo is separate from the offline utility. It serves the
unchanged engine with fixed demo strings, no file chooser or pasted input, and
no connection/form submission capability. Its scripts load from the same static
site; comparison data is not sent over the network. The site source is in
`website/`, with a public-only build allowlist. Hosting still receives requests
for the pages/assets; this does not imply zero technical provider records.

The utility has no payment/account integration, entitlement service, user
analytics or live-store connection. The separate informational Cloudflare page,
Lemon Squeezy Test-mode store and consumer Gmail inbox process website, purchase
or support data outside the utility. Static hosting still receives technical
visitor data, and local CSV processing does not remove commercial privacy duties.
There is no live checkout connected to the page. Consumer Gmail must not be
described as a DPA-contracted processor; see the unresolved production email,
provider roles, transfers, retention and consent gates in the review above.
Introducing integrations into the utility requires a separate review. A
client-only payment gate is not a secure billing boundary.

## Source references

Shopify behavior referenced by selected checks was reviewed on 18 October 2026:

- https://help.shopify.com/en/manual/products/import-export/import-products
- https://help.shopify.com/en/manual/products/import-export/using-csv

The prototype remains a limited difference report, not a complete importer validator.
