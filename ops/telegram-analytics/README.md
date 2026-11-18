# Weekly analytics delivery to Telegram

This operations-only Cloudflare Worker sends a weekly website-analytics summary
to the owner's private Telegram chat. The native weekly email remains the
backup. Never import it into the app, website, demo, ZIP or reports. CSV
processing stays local and live sales remain disabled.

## Current evidence and pending checks

Observed during setup:

- Workers Logs and Traces are off. The final module has no runtime console
  logging, schema-discovery or probe branches. All three secrets are encrypted
  in Cloudflare.
- Fresh authenticated pairing returned 200; after configuring the chat ID,
  pairing returned 409 as expected.
- A Windows verification script POSTed the documented generic connection
  payload directly to the relay and received 202. The owner confirmed its labelled
  synthetic message arrived in the intended private chat and was readable.
  This verifies connection delivery, not numeric report delivery.
- The existing **Web Analytics Metrics Update** policy was observed Enabled
  with both the original email destination and the new relay destination.
- Selected fields from a native synthetic policy Test were inspected and
  compared with its sample email. `data.summary.visits.value` was `"1234"`,
  unit `"Visits"`, matching the email's 1,234 Visits. The schema also exposed
  `data.summary.views.value` and `unit`; the sample email showed 1,234 Views.
  Site count and period were blank or unsupported in the inspected sample.
  These samples are synthetic, not real traffic or tester interest.

**Pending:** deploy the final numeric formatter with the operator's synthetic
label enabled, run the native policy Test, and confirm that Telegram shows both
Visits and Views as 1234, with unavailable sites/period. Then restore normal
mode. The first scheduled weekly Telegram delivery and its agreement with the
email also remain pending. A generic connection test cannot close those gaps.

Historical inspection used bounded schema information and strictly selected
validated summary fields. No raw payload records, private account metadata or
chat IDs were committed. Temporary discovery code is absent from the final
Worker. Local regression results: **141 Node tests passed**, including **21 relay
checks**, with fake network responses. They do not replace native delivery
verification or establish fresh Windows Chrome/Edge app evidence.

## Scope and exact supported fields

The native weekly policy covers the **Cloudflare account**, not an individual
product. Every message states that scope, even when the account has only one
site. Traffic is not proof of app use, downloads or customer demand.

| Field | Accepted input | Otherwise |
| --- | --- | --- |
| Visits | `data.summary.visits.value`, canonical count string, exact unit `Visits` | `unavailable` |
| Views | `data.summary.views.value`, canonical count string, exact unit `Views` | `unavailable` |
| Sites | `data.summary.sites`, canonical count string | `unavailable` |
| Period | `data.summary.startDate` and `endDate`, both valid strict ISO dates/UTC timestamps, start no later than end | `unavailable` |

Counts accept `0` or unsigned integers with no leading zeros and at most 12
digits. Numeric JSON values, signs, fractions, exponents, formatted numbers,
wrong units and aliases are rejected. Valid zero stays zero; missing or
unsupported never becomes zero. Dates must calendar-round-trip without
normalization. Timestamps require UTC `Z`, seconds and optionally exactly three
fractional digits.

No raw message text, account/policy names or IDs, hostnames, URLs, referrers,
visitor records, deltas or performance values are forwarded. Performance and
other details remain in the email backup and Cloudflare dashboard. The weekly
schema is not a published stable contract; drift produces `unavailable`, not
guessed figures. Nonempty site counts and periods still need native validation.

## Deployment boundary and secrets

- Worker: `ccg-analytics-telegram`; `worker.mjs` is the complete module;
  compatibility date `2026-11-18`.
- Use existing free services. No paid upgrade, analytics API read token, cron,
  SQL, storage, queue, app integration or GitHub deployment integration is
  required. The native Cloudflare policy supplies the schedule.
- Keep persisted Workers Logs and Traces off. Do not use Live logs during
  pairing or Telegram delivery: platform metadata can expose authentication
  headers or outbound token URLs. The final module never logs provider data.
- Store `WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` only as
  encrypted Cloudflare secrets. Never put their values in source, browser
  storage, Git, issues/PRs, screenshots or chat messages.
- The bot token is stored in Cloudflare and supplied only to Telegram's official
  HTTPS API, whose outbound path requires it. The relay never returns/logs that
  path or exposes it in the Cloudflare webhook destination. No local token
  copy is needed.
- Short-lived owner setup files containing a pairing code, shared secret or
  chat ID must stay outside Git and be removed after setup. Cleanup remains a
  setup completion task; do not delete unrelated files.

`wrangler.jsonc` disables observability. Dashboard source pasting does not apply
Wrangler settings; verify the deployed Worker's Logs/Traces controls separately.

## Setup or recovery

1. Use a dedicated Telegram bot, start a private chat and enter its token
   directly into encrypted `TELEGRAM_BOT_TOKEN` in Cloudflare.
2. Deploy the reviewed module. Save a random `WEBHOOK_SECRET`: 32–256 URL-safe
   letters, digits, underscores or hyphens. Missing configuration fails closed.
3. While `TELEGRAM_CHAT_ID` is unset, generate a fresh 32–64 character lowercase
   hexadecimal code. Send `/start CODE` once in the private bot chat.
4. Send authenticated `POST /pair`, JSON `{ "code": "CODE" }`, with the shared
   secret in `cf-webhook-auth`. Keep the returned numeric ID private. The
   Worker polls once, requires exactly one matching private message and does
   not advance the update offset. It sets the bot's `allowed_updates`
   preference to messages but does not change a bot webhook. An existing
   webhook can prevent polling and requires separate owner review.
5. Save the ID as encrypted `TELEGRAM_CHAT_ID`; verify pairing is locked with
   409. Never record the real ID in public evidence.
6. In Notifications, use **Manage Destinations / Create Destination** to create
   a generic webhook for the Worker's `/webhook` URL with matching
   authentication secret. Save it. A direct POST of the documented generic
   connection payload is always labelled synthetic; it is separate from the
   native weekly policy Test, which requires the operator flag below.
7. Attach the relay to the existing **Web Analytics Metrics Update** policy.
   Retain the original email destination and Enabled status. Save, then test
   the native numeric payload separately as described below.
8. Remove short-lived local pairing/shared-secret/chat-ID files after the
   encrypted configuration and recovery arrangements are complete.

## Manual native policy tests and weekly operation

The native Test payload lacks a dependable test marker. The Worker cannot
automatically distinguish the sample from scheduled traffic. Payload flags
such as `test` and `synthetic_test` are ignored.

Before **every manual native policy Test**, set the operator-controlled Worker
variable `SYNTHETIC_TEST_MODE` to the exact string `true` and deploy the setting.
Every weekly message will say **Synthetic provider test — not real traffic**.
Run the policy's **Actions → Test**, compare Telegram with the sample email and
check scope/readability. The generic connection test is always synthetic.

Afterward restore the variable to `false` or remove it and deploy the setting.
Only exact `true` enables the label. Leaving it enabled also labels scheduled
traffic synthetic; testing without it leaves native samples unlabelled. This
is an owner operating step, not automatic sample detection.

When the first scheduled weekly Telegram message arrives, compare supported
fields with the email and record unavailable fields honestly. Keep that
scheduled-delivery check pending until the message actually arrives.

## Request safety, failures and local verification

Only authenticated POST JSON is accepted on fixed `/webhook` and `/pair`
routes; query strings are refused. Authentication compares fixed-length
SHA-256 digests with Cloudflare's timing-safe primitive. Bodies and provider
responses are bounded. Unknown alerts and unrecognized generic messages are
rejected. Caller values cannot choose a destination or formatting mode. Text
is plain and link previews are disabled.

Outbound requests use Workers-compatible `redirect: 'manual'`. Non-2xx replies,
including redirects, fail without following `Location` or forwarding secrets.
Pairing errors return only fixed categories and, for an HTTP rejection, a
validated integer status. Provider text, URLs and private updates stay private.

A successful response reports individual supported fields and synthetic-label
state; it does not certify every metric as verified. The Worker does not retry
a Telegram failure/timeout because delivery may already have occurred.
Cloudflare retries can still produce duplicates: this is not exactly-once
delivery. Email remains independently scheduled.

Run `npm.cmd test`, or `node --test tests/telegram_analytics.test.cjs` for the
relay checks. They inject fake network responses and a Node equivalent of
Cloudflare's timing-safe primitive; they contact neither provider and cannot
verify actual account settings. Never send merchant CSVs, reports or customer
correspondence through this relay.

## Website privacy and package verification

The website privacy copy and matching Markdown/security notes describe the
private owner channel, its selected aggregate fields and separate Telegram
retention. No analytics script, consent control, CSP or comparison source changed.
The pinned Modern Web Guidance `privacy` guide informed the copy: "Be honest
and clear about why data is collected, where it goes, and how long it is kept."

On 18 November 2026, `npm.cmd test` passed all 141 tests and
`npm.cmd run build:website` produced the 18-file allowlisted public bundle.
Installed Windows Chrome **157.0.8103.79**, Python 3.14.0 and Playwright 1.62.0
passed all six groups in `tests/website_browser_test.py`, using actual localhost
navigation with `chromium_sandbox=True` and forbidden sandbox-disable arguments
checked. Coverage included desktop/mobile trial navigation and report reopening,
fallbacks, five-page reflow/text scaling, keyboard focus and browser-error checks.
This is website verification, separate from earlier full-app Chrome/Edge evidence.
Results and screenshots remain in ignored
`.local-test-artifacts/telegram-privacy-chrome-2026-11-18/20261118T150053Z-091faa43/`.

The rebuilt public ZIP is still 104,195 bytes, SHA-256
`beb29a49e8d4c20a399ceade368abae34b53178ba9f3d56b7ffba6462de6007a`;
the unchanged standalone app remains SHA-256
`585ce2008f2bab0005f2ba2cc9b00c43cae1ffb3fb8d5c954e698a919e35e1b8`.
Public publication and final native delivery must be recorded separately from
these local checks. Account screens and real routing details remain outside Git.

## Primary references

- [Cloudflare notifications](https://developers.cloudflare.com/notifications/)
- [Generic webhooks](https://developers.cloudflare.com/notifications/get-started/configure-webhooks/)
- [Webhook payload schema](https://developers.cloudflare.com/notifications/reference/webhook-payload-schema/)
- [Weekly Web Analytics report](https://developers.cloudflare.com/web-analytics/get-started/notifications/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Workers redirects](https://developers.cloudflare.com/workers/runtime-apis/request/)
- [Cloudflare timingSafeEqual](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#timingsafeequal)
- [Telegram Bot API](https://core.telegram.org/bots/api)
