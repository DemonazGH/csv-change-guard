# Weekly analytics delivery to Telegram

This is an operations-only Cloudflare Worker. It is not an application backend
and must never be imported into the utility, website, demo, release ZIP or reports.
The owner authorised private Telegram delivery with the existing weekly email
kept as backup. Live sales remain disabled.

## Status

Prepared and locally tested. Production secrets, private-chat pairing and native
Cloudflare delivery still require verification. No claim is made that a scheduled
weekly message has arrived. The native weekly numeric payload is undocumented;
the initial formatter reports that the weekly report is available without
inventing figures or forwarding raw account/policy metadata. A verified numeric
mapping must precede claims that Telegram receives the actual analytics totals.

## Deployment boundary

- Worker: `ccg-analytics-telegram`; `worker.mjs` is the complete module.
- Free Workers allowance is sufficient for the planned weekly delivery; do not
  upgrade the account or enable a paid subscription for this setup.
- No cron, storage, queues, app routes, analytics API token or GitHub integration
  is required. The existing native Cloudflare notification provides the schedule.
- Keep Workers observability/tracing disabled. Neither code nor console logs
  should contain request payloads, Telegram responses, tokens, profile details
  or outgoing URLs containing bot credentials.
- Configure `WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` only as
  encrypted Cloudflare secrets. Do not place their values in this checkout,
  source, browser storage, issue/PR bodies, screenshots or chat messages.
- The bot token necessarily appears in the official outbound Telegram API path;
  the relay never returns/logs that path or exposes it in a webhook destination.
  Cloudflare and Telegram remain trusted service providers for this delivery.

## Owner setup and pairing

1. Create a dedicated bot in the verified `@BotFather` chat. Keep its token
   private and start a private chat with the new bot.
2. Deploy the reviewed Worker module. Until configured, it fails closed and
   cannot send a report.
3. Store the bot token and a random authentication secret (at least 32 safe
   characters) in the two matching encrypted Cloudflare secret fields.
4. Generate a fresh 32–64 character lowercase hexadecimal pairing code. The
   owner sends `/start CODE` **once** in the private bot chat. Do not put an
   actual code or chat identifier in Git.
5. Make an authenticated `POST /pair` with JSON `{ "code": "CODE" }` and
   the shared secret in the `cf-webhook-auth` header. The Worker polls only this
   dedicated bot once, does not advance an update offset, and accepts exactly
   one matching private-chat message. It returns only that chat's numeric ID.
   Treat the response as private; do not print or commit it.
6. Save that numeric ID as `TELEGRAM_CHAT_ID`. Pairing is now disabled.
7. Add a generic Cloudflare webhook destination pointing to the Worker's
   `/webhook` URL and configure the matching authentication secret. Use the
   provider's Save and Test control and verify the labelled synthetic message
   in the intended private Telegram chat.
8. Attach that destination to the existing **Web Analytics Metrics Update**
   policy, leaving its support email recipient and Enabled status intact.
   Test the native policy separately from the generic connection test.

## Request and delivery checks

The preparation build includes temporary `SCHEMA_DIAGNOSTICS='true'` support
for a single native Cloudflare synthetic test. This mode disables pairing and
Telegram delivery and logs only bounded, sanitized JSON paths/types, never
payload values. Keep persisted logging disabled and inspect only the custom
`ccg-weekly-schema` console entry in ephemeral Live logs. Do not run pairing or
Telegram calls while tailing: platform event metadata can include request
headers or subrequest URLs. Stop Live logs, remove the temporary diagnostic
branch and verify the normal handler before completing production setup.

Only POST JSON is accepted on `/webhook` and `/pair`; query strings are refused.
Authentication uses a constant-time comparison of fixed-length SHA-256 digests.
Input and Telegram responses are bounded; destination and message formatting are
not supplied by the caller. Unknown alert types are rejected. HTML/Markdown is
not interpreted, link previews are disabled, and no automatic retry is made after
a Telegram timeout because the message may already have been delivered.
Cloudflare's own retry behavior may still produce duplicates; this is not an
exactly-once delivery service. The email backup remains independently scheduled.

Run `npm.cmd test` from the repository root. The relay tests inject fake network
responses and a Node equivalent of Cloudflare's timing-safe primitive. They do
not contact Telegram or Cloudflare and do not validate real account settings.
Use synthetic connection/policy tests for production verification; never send
merchant CSVs, reports or customer correspondence through this relay.

Primary references:

Preparation verification on 18 November 2026: **135 Node tests passed**, including
15 new relay checks with fake provider/network responses. The standalone app
remains SHA-256
`585ce2008f2bab0005f2ba2cc9b00c43cae1ffb3fb8d5c954e698a919e35e1b8`.
No actual Telegram message, private-chat binding, native webhook attachment or
numeric payload mapping is verified by those local tests. The existing native
weekly email policy was observed Enabled; it has not been removed or changed.

- [Cloudflare alert destinations](https://developers.cloudflare.com/notifications/)
- [Generic webhooks](https://developers.cloudflare.com/notifications/get-started/configure-webhooks/)
- [Webhook payload schema](https://developers.cloudflare.com/notifications/reference/webhook-payload-schema/)
- [Weekly Web Analytics report](https://developers.cloudflare.com/web-analytics/get-started/notifications/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
