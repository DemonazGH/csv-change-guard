# Security and privacy notes — prototype

## Data flow

A user-selected file is read through the browser File API, decoded strictly as UTF-8, parsed and compared in memory. No file is submitted to a server or model API. The static application has no network requests, analytics, cookies or local-storage persistence. Its content-security policy disables network connections and form submission.

The Clear files action removes source references and rendered report content from the application. JavaScript memory is managed by the browser; this is not guaranteed secure erasure. Browser extensions, the operating system, filesystem backups and downloaded report handling are outside this tool's control.

## Output precautions

Untrusted values are escaped before inserting them into HTML. Report CSV cells starting with common formula-trigger characters, including after leading whitespace, are prefixed with an apostrophe and quoted. This is a defense for spreadsheet viewing, not a promise against every spreadsheet application's behavior. JSON preserves original strings. Do not treat exported findings as an import-ready product CSV.

HTML/JSON/CSV report downloads can contain sensitive identifiers and before/after values. Store and share them accordingly. The HTML report is static and contains no scripts. Values are not executed, image URLs are not fetched, and no automatic fixes are written.

## Limits and remaining release work

Input limits reduce accidental resource exhaustion but are not a complete adversarial denial-of-service evaluation. There has been no external penetration test, security certification, public deployment test, or comprehensive browser compatibility test.

No payments, accounts, entitlements, user analytics or live-store connections exist. Introducing any of these changes the security model and requires a separate review. A client-only payment gate is not a secure billing boundary.

## Source references

Shopify behavior referenced by selected checks was reviewed on 18 October 2026:

- https://help.shopify.com/en/manual/products/import-export/import-products
- https://help.shopify.com/en/manual/products/import-export/using-csv

The prototype remains a limited difference report, not a complete importer validator.
