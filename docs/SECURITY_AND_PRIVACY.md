# Security and privacy notes — prototype

These notes describe the **offline utility**, not every service around its sale.
The [purchase privacy draft](PURCHASE_PRIVACY_DRAFT.md) and
[privacy/consent review](PRIVACY_AND_CONSENT_REVIEW.md) cover the separate public
informational website, Test-mode checkout and support inbox. They are not an
effective customer policy. Live sales remain disabled.

## Data flow

A user-selected file is read through the browser File API, decoded strictly as UTF-8, parsed and compared in memory. No file is submitted to a server or model API. The static application has no network requests, analytics, cookies or local-storage persistence. Its content-security policy disables network connections and form submission.

The Clear files action removes source references and rendered report content from the application. JavaScript memory is managed by the browser; this is not guaranteed secure erasure. Browser extensions, the operating system, filesystem backups and downloaded report handling are outside this tool's control.

## Output precautions

Untrusted values are escaped before inserting them into HTML. Report CSV cells starting with common formula-trigger characters, including after leading whitespace, are prefixed with an apostrophe and quoted. This is a defense for spreadsheet viewing, not a promise against every spreadsheet application's behavior. JSON preserves original strings. Do not treat exported findings as an import-ready product CSV.

HTML/JSON/CSV report downloads can contain sensitive identifiers and before/after values. Store and share them accordingly. The HTML report is static and contains no scripts. Values are not executed, image URLs are not fetched, and no automatic fixes are written.

## Limits and remaining release work

Input limits reduce accidental resource exhaustion but are not a complete adversarial denial-of-service evaluation. There has been no external penetration test, security certification, public deployment test, or comprehensive browser compatibility test.

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
