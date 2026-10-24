# Security and privacy notes — prototype

These notes describe the **offline utility**, not every service around its sale.
The [current website/Gmail notice](CURRENT_WEBSITE_GMAIL_PRIVACY.md) describes
the existing informational page and support inbox, with evidence and owner
handoffs in the [current setup record](CURRENT_PRIVACY_SETUP.md). The separate
[purchase privacy draft](PURCHASE_PRIVACY_DRAFT.md) and
[privacy/consent review](PRIVACY_AND_CONSENT_REVIEW.md) still have unresolved
paid-release gates. Live sales remain disabled; domain/paid email are postponed.

## Data flow

A user-selected file is read through the browser File API, decoded strictly as UTF-8, parsed and compared in memory. No file is submitted to a server or model API. The static application has no network requests, analytics, cookies or local-storage persistence. Its content-security policy disables network connections and form submission.

The Clear files action removes source references and rendered report content from the application. JavaScript memory is managed by the browser; this is not guaranteed secure erasure. Browser extensions, the operating system, filesystem backups and downloaded report handling are outside this tool's control.

## Output precautions

Untrusted values are escaped before inserting them into HTML. Report CSV cells starting with common formula-trigger characters, including after leading whitespace, are prefixed with an apostrophe and quoted. This is a defense for spreadsheet viewing, not a promise against every spreadsheet application's behavior. JSON preserves original strings. Do not treat exported findings as an import-ready product CSV.

HTML/JSON/CSV report downloads can contain sensitive identifiers and before/after values. Store and share them accordingly. The HTML report is static and contains no scripts. Values are not executed, image URLs are not fetched, and no automatic fixes are written.

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
