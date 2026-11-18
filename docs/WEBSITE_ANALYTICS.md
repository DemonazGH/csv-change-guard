# Optional website analytics — 18 November 2026

The owner authorised free Cloudflare Web Analytics and its native weekly email
report. This is a website measurement decision, separate from the local utility.
Live sales remain disabled. No paid service, store access, file upload, activation,
custom download counter or app telemetry is part of this change.

## Integration and privacy boundary

- Only the landing page, price-change guide and privacy notice offer analytics.
  Visitors can allow or decline without losing access to content or downloads.
- A reviewed local script manages a per-tab `sessionStorage` consent preference.
  No visitor identifier, cookie or localStorage entry is created by our code.
  No vendor script loads before an explicit opt-in (or a saved grant in that tab).
- The footer's **Change analytics choice** returns to the same controls.
  Withdrawing permission blocks future analytics connections and reloads into
  the denied state. A storage failure fails closed. History/visibility lifecycle
  handling rechecks consent to avoid restoring a stale grant from browser cache.
  Previously transmitted requests cannot be recalled.
- The production hostname is checked explicitly. Localhost, preview deployments
  and test hosts never send real beacons through this loader.
- Cloudflare is configured for **manual snippet installation**. Keep Pages'
  site-wide automatic injection disabled: it would bypass the consent/scope gate.
- A build-derived SHA-256 hash and SRI authorize only the local consent script,
  with `strict-dynamic` allowing its consented vendor dependency. The sole
  connection exception is `https://cloudflareinsights.com/cdn-cgi/rum`.
  Default-deny resource, form, framing and powerful-feature policies remain.
- Cloudflare's vendor module is mutable and cannot be version-pinned for SRI.
  Its execution is a deliberate third-party trust boundary after consent; our
  local script is hash-checked. Do not claim the vendor cannot change behavior.
- Demo, comparison assets, standalone app, free-use terms and exported reports
  have no analytics integration. CSV values, filenames, findings and reports
  cannot be read by these informational pages and are not sent as analytics.

The [current notice](CURRENT_WEBSITE_GMAIL_PRIVACY.md) describes data fields,
consent, providers, transfers, retention and rights. The
[security review](SECURITY_AND_PRIVACY.md#optional-website-analytics-boundary)
records the bounded EDPB/PKE review. Cookie-free is not treated as an automatic
consent exemption. Neither document certifies universal legal compliance.

## Operational setup

The Cloudflare account now has a manual-install Web Analytics site for
`csv-change-guard.pages.dev`. Its public ingestion token appears in the client
script; it is not an API credential. No account/API token is stored in Git.

The native **Web Analytics Metrics Update** policy was saved as
**CSV Change Guard — weekly website statistics**, with status **Enabled**.
Reopening its destinations confirmed the sole recipient:
`csvchangeguard.support@gmail.com`. Cloudflare documents this notification as
a weekly aggregate report of visits, page views and median page-load time, on
all plans. No day/time selector was offered. This is an owner operational email,
not a newsletter subscription for visitors.

A single sample notification was requested through the policy's Test action.
It arrived in the support Gmail Inbox at **13:46 Warsaw**, from
`noreply@notify.cloudflare.com`, with subject **Web Analytics weekly summary for**.
The signed-in browser showed the weekly summary and placeholder `1234` values.
This verifies sample delivery only; the first scheduled report remains pending.
The Gmail connector required reauthentication, so verification used the existing
signed-in Edge session. No unrelated correspondence was opened. Do not describe
the sample values as real visitor interest.

Cloudflare's dashboard provides six months of analytics access; that is not an
erasure deadline for every provider record. Aggregate report emails are reviewed
monthly for deletion around three months after receipt. This is a manual owner
procedure; no deletion or mailbox automation was performed.

## Fresh Windows validation

Baseline: **119 Node tests passed**. Updated suite: **120 passed**, zero failures.
Windows 11 build 26100; Python 3.14.0 and Playwright 1.62.0 in the existing test
virtual environment. Installed browsers:

| Check | Chrome 157.0.8103.79 | Edge 157.0.4341.60 |
|---|---|---|
| Consent default/decline/grant/withdrawal, storage failures | Passed | Passed |
| Isolated native-download transport and distinct ZIP sentinel | Passed | Passed |
| Existing website suite, including responsive/text scaling | Passed | Passed |
| Free download and extracted local app/report | Passed | Passed |
| History/visibility consent resynchronization | Passed (simulated events) | Passed (simulated events) |

Sandboxing was enabled and launch arguments were checked. The consent harness
serves production-origin renderer content from the local build and substitutes
a local vendor module and POST response. Public hosts are DNS-blocked in these
test instances. The ZIP href in this fixture alone points to a controlled
loopback attachment server because native downloads can bypass renderer routes.
Exact bytes, destination and a server receipt are checked, including a valid
ZIP with an intentionally distinct synthetic comment. No application source or
public ZIP is changed by that fixture adaptation. This verifies actual browser
CSP/SRI/consent behavior without sending production beacons; it does **not**
prove vendor ingestion. The unmodified download has separate localhost/public
checks. The lifecycle regression is a simulated restored-page event, not a
full browser back/forward-cache compatibility matrix.

The existing website checks retain actual localhost navigation and same-origin
GET-only expectations. The download checks exercise JavaScript-disabled native
ZIP delivery, extraction, unchanged app use, and standalone report reopening.

Commands (replace the executable/artifacts suffix with Edge for that run):

```powershell
npm.cmd test
npm.cmd run build:website
.local-test-artifacts/website-venv/Scripts/python.exe tests/website_analytics_test.py --site-dir .local-test-artifacts/public-site --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' --artifacts-dir .local-test-artifacts/analytics-chrome-2026-11-18
.local-test-artifacts/website-venv/Scripts/python.exe tests/website_browser_test.py --site-dir .local-test-artifacts/public-site --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' --artifacts-dir .local-test-artifacts/analytics-website-chrome-2026-11-18
.local-test-artifacts/website-venv/Scripts/python.exe tests/free_beta_download_test.py --site-dir .local-test-artifacts/public-site --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' --artifacts-dir .local-test-artifacts/analytics-download-chrome-2026-11-18
git diff --check
```

Final consent results (seven groups per browser) are in ignored
`.local-test-artifacts/analytics-isolated-{chrome,edge}-2026-11-18/`.
Earlier `analytics-*` runs remain dated intermediate evidence, including the
native-download routing limitation found in CI. Public-page screenshots live
in those ignored folders;
account/recipient screenshots remain in ignored `website-analytics-2026-11-18`.
Neither raw account records nor private screenshot content is published in Git.

The ZIP remains **104,195 bytes**, SHA-256
`beb29a49e8d4c20a399ceade368abae34b53178ba9f3d56b7ffba6462de6007a`.
Its app remains SHA-256
`585ce2008f2bab0005f2ba2cc9b00c43cae1ffb3fb8d5c954e698a919e35e1b8`.
Git's Windows checkout had converted two release HTML inputs to CRLF. Their
original bytes were restored from the previously reviewed ZIP after checking
newline-equivalent content, preserving the published package without a source
change. Identical Git-normalized content does not imply identical ZIP bytes.

## Publication and remaining limits

Cloudflare reported **Success** after uploading all **18 allowlisted files** to
the existing production site. Fresh HTTP checks of 17 served files and five
clean/root URL aliases returned 200 and exactly matched the reviewed local
bytes. Framing/nosniff headers were present; no Set-Cookie response appeared in
this bounded set. `_headers` is provider configuration, not a served page.
The original ZIP/app fingerprints above remain unchanged.

Connected Windows Edge verified the live default-off notice (zero vendor tags),
explicit opt-in (one vendor tag, no observed console errors), navigation using
the tab preference, and withdrawal (page reloaded with zero vendor tags).
Actual Back navigation to the guide retained the declined state and no vendor
tag. This is a bounded public navigation check, not a claim about every BFCache
implementation. The Cloudflare Web Analytics overview then showed **2 visits
and 2 page views**, with bots excluded, confirming real vendor ingestion.
These are owner/assistant setup visits, **not independent tester interest**.
The Pages Metrics panel still showed its site-wide automatic injection disabled;
the separate Web Analytics site correctly showed JS Snippet installation.

[PR #21](https://github.com/DemonazGH/csv-change-guard/pull/21) contains the source,
privacy changes and validation harness. Its first CI run exposed a test-fixture
issue: Chromium's native download could bypass the production-origin Playwright
route and fetch the published ZIP. Windows had matching ZIP bytes, masking that
escape; Linux's checkout bytes exposed it. The fixture was corrected to serve
downloads from a controlled loopback endpoint, DNS-block public hosts and retain
exact-byte checks. Seven groups passed again in each installed Windows browser,
including a deliberately different valid ZIP that catches a production fallback.
Final exact-head PR/main CI and merge status remain pending; initial failure is
not reported as a passed CI run.

Statistics cover consenting visits on three information pages only. Ad blockers,
missing referrers, sampled queries, repeated page visits and owner/test traffic
limit interpretation. Cloudflare Web Analytics does not support custom events
or UTM parameters. `#download` is a fragment, not a measured ZIP event. These
counts do not establish downloads, unique users, actual app use, usefulness,
independent tester validation or paid demand.

Next small action: read the first weekly report and compare referring sites and
page traffic with voluntary Shopify operator feedback. Exclude setup/test visits
from claims about customer interest.

## Modern Web Guidance

Pinned v1.0.0 CLI, telemetry disabled; search `load third-party scripts` and
retrieve `privacy`, `security`, `secure-external-subresources`.

- `privacy`: "Collect only the bare minimum required for the immediate task."
  Consent and aggregate website measurements stay separate from file processing.
- `security`: "For static/cached HTML ... use hash-based CSP"; the immutable
  local loader receives matching CSP/SRI hashes instead of a broad script origin.
- `secure-external-subresources`: "If you must load a mutable third-party script
  ... omit integrity on that URL"; the vendor exception is documented and loaded
  only through the consented, hash-authorized local script.

Primary Cloudflare references reviewed:
[setup](https://developers.cloudflare.com/web-analytics/get-started/),
[beacon data](https://developers.cloudflare.com/speed/observatory/rum-beacon/),
[FAQ](https://developers.cloudflare.com/web-analytics/faq/),
[weekly notification](https://developers.cloudflare.com/web-analytics/get-started/notifications/).
