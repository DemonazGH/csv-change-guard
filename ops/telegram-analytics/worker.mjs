// Operations-only notification relay. Never import into the app or public site.
// Secrets are configured in Cloudflare, not in source, URLs or browser storage.
export const MAX_WEBHOOK_BYTES = 64 * 1024;
export const MAX_TELEGRAM_BYTES = 512 * 1024;
export const WEEKLY_ALERT_TYPE = 'web_analytics_metrics_update';
export const CLOUDFLARE_TEST_TEXT = 'Hello World! This is a test message sent from https://cloudflare.com. If you can see this, your webhook is configured properly.';

const encoder = new TextEncoder();
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const reply = (status, body, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });

class InvalidBody extends Error {
  constructor(status) { super('Invalid body'); this.status = status; }
}

async function readJsonBounded(message, maximum) {
  const declared = message.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximum)) {
    throw new InvalidBody(/^\d+$/.test(declared) ? 413 : 400);
  }
  if (!message.body) throw new InvalidBody(400);
  const reader = message.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximum) { await reader.cancel(); throw new InvalidBody(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new InvalidBody(400); }
}

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validToken = value => typeof value === 'string' && /^\d{5,20}:[A-Za-z0-9_-]{20,200}$/.test(value);
const validSecret = value => typeof value === 'string' && /^[A-Za-z0-9_-]{32,256}$/.test(value);
const validChatId = value => typeof value === 'string' && /^[1-9]\d{0,15}$/.test(value) && Number.isSafeInteger(Number(value));

async function authenticates(supplied, expected, cryptoImpl) {
  if (typeof supplied !== 'string' || supplied.length > 512) return false;
  // Cloudflare's documented timingSafeEqual extension compares fixed-length
  // hashes, without a JavaScript character-by-character early-exit comparison.
  const [actual, target] = await Promise.all([
    cryptoImpl.subtle.digest('SHA-256', encoder.encode(supplied)),
    cryptoImpl.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  return cryptoImpl.subtle.timingSafeEqual(actual, target);
}

export function formatNotification(payload) {
  if (!isRecord(payload)) return null;
  if (!Object.hasOwn(payload, 'alert_type') && Object.keys(payload).length === 1 && payload.text === CLOUDFLARE_TEST_TEXT) {
    return {
      kind: 'synthetic-test',
      text: 'CSV Change Guard — Telegram connection test\n\nCloudflare\'s synthetic webhook test reached this private chat. This is not real visitor activity. Weekly email remains the backup.',
    };
  }
  if (payload.alert_type !== WEEKLY_ALERT_TYPE) return null;
  // The provider has not published a weekly-specific data schema. Do not
  // guess numeric aliases or forward account IDs, raw URLs or arbitrary text.
  // Add a vetted mapping only after a real native payload has been reviewed.
  return {
    kind: 'weekly',
    text: 'CSV Change Guard — weekly website analytics\n\nCloudflare\'s weekly report is available. Website-specific figures have not been verified in this notification format. Read the email backup or open Cloudflare Web Analytics:\nhttps://dash.cloudflare.com/\n\nWebsite traffic is not proof of app use or customer demand.',
  };
}

// TEMPORARY native-payload discovery. Remove after the weekly mapping is
// verified. Only these fixed schema labels may appear in diagnostic paths;
// identifier-shaped account/site keys must remain redacted too. This list is
// for inspecting shape, not interpreting or guessing numeric metric fields.
const DIAGNOSTIC_FIELD_NAMES = new Set([
  'name', 'text', 'data', 'ts', 'account_id', 'policy_id', 'policy_name',
  'alert_type', 'alert_correlation_id', 'alert_event',
  'sites', 'hostname', 'visits', 'page_views', 'page_load_time',
]);

export function describeSchema(value) {
  const nodes = [];
  function visit(current, path, depth) {
    if (nodes.length >= 100) return;
    const type = current === null ? 'null' : Array.isArray(current) ? 'array' : typeof current;
    nodes.push({ path, type });
    if (depth >= 4) return;
    if (type === 'array') {
      if (current.length) visit(current[0], path + '[0]', depth + 1);
    } else if (type === 'object') {
      const keys = Object.keys(current).slice(0, 20);
      for (let index = 0; index < keys.length && nodes.length < 100; index++) {
        const key = keys[index];
        const safe = DIAGNOSTIC_FIELD_NAMES.has(key)
          ? key : '[redacted-key-' + index + ']';
        visit(current[key], path + '.' + safe, depth + 1);
      }
    }
  }
  visit(value, '$', 0);
  return nodes;
}

export function createRelay({ fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto,
  schemaLog = shape => console.info('ccg-weekly-schema', JSON.stringify(shape)) } = {}) {
  async function telegram(method, token, data) {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', redirect: 'error',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Telegram request failed');
    const result = await readJsonBounded(response, MAX_TELEGRAM_BYTES);
    if (!isRecord(result) || result.ok !== true) throw new Error('Telegram request failed');
    return result;
  }

  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);
      const diagnostics = env.SCHEMA_DIAGNOSTICS === 'true';
      if (!['/webhook', '/pair'].includes(url.pathname) || url.search) return reply(404, { ok: false, error: 'Not found' });
      if (request.method !== 'POST') return reply(405, { ok: false, error: 'POST required' }, { allow: 'POST' });
      if (!validSecret(env.WEBHOOK_SECRET) || (!diagnostics && !validToken(env.TELEGRAM_BOT_TOKEN)) ||
          typeof cryptoImpl?.subtle?.timingSafeEqual !== 'function') {
        return reply(503, { ok: false, error: 'Relay not configured' });
      }
      let authorized;
      try { authorized = await authenticates(request.headers.get('cf-webhook-auth'), env.WEBHOOK_SECRET, cryptoImpl); }
      catch { return reply(503, { ok: false, error: 'Relay unavailable' }); }
      if (!authorized) return reply(401, { ok: false, error: 'Unauthorized' });
      if (url.pathname === '/pair' && diagnostics) return reply(409, { ok: false, error: 'Pairing is disabled during diagnostics' });
      if (url.pathname === '/pair' && env.TELEGRAM_CHAT_ID) return reply(409, { ok: false, error: 'Pairing is disabled' });
      if (url.pathname === '/webhook' && !diagnostics && !validChatId(env.TELEGRAM_CHAT_ID)) return reply(503, { ok: false, error: 'Relay not configured' });
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return reply(415, { ok: false, error: 'JSON required' });
      let payload;
      try { payload = await readJsonBounded(request, MAX_WEBHOOK_BYTES); }
      catch (error) { return reply(error instanceof InvalidBody ? error.status : 400, { ok: false, error: 'Invalid request body' }); }

      if (url.pathname === '/pair') {
        if (!isRecord(payload) || Object.keys(payload).length !== 1 || typeof payload.code !== 'string' || !/^[a-f0-9]{32,64}$/.test(payload.code)) {
          return reply(400, { ok: false, error: 'Invalid pairing request' });
        }
        try {
          // Poll once without advancing an offset or changing the bot webhook.
          // Profiles and unrelated messages remain transient and are not logged.
          const response = await telegram('getUpdates', env.TELEGRAM_BOT_TOKEN, { timeout: 0, limit: 100, allowed_updates: ['message'] });
          if (!Array.isArray(response.result)) throw new Error('Invalid update response');
          const matches = response.result.filter(update => update?.message?.chat?.type === 'private' &&
            update.message.text === '/start ' + payload.code);
          if (matches.length !== 1) return reply(409, { ok: false, error: 'A single matching private message is required' });
          const id = matches[0].message.chat.id;
          if (!Number.isSafeInteger(id) || id <= 0 || !validChatId(String(id))) return reply(409, { ok: false, error: 'A valid private chat is required' });
          return reply(200, { ok: true, chat_id: String(id) });
        } catch { return reply(502, { ok: false, error: 'Pairing could not be verified' }); }
      }

      if (diagnostics) {
        schemaLog(describeSchema(payload));
        return reply(202, { ok: true, schema_only: true });
      }

      const notification = formatNotification(payload);
      if (!notification) return reply(422, { ok: false, error: 'Unsupported notification' });
      try {
        // Destination and text are never taken from caller-controlled chat IDs,
        // formatting instructions, links, report contents or message templates.
        await telegram('sendMessage', env.TELEGRAM_BOT_TOKEN, {
          chat_id: env.TELEGRAM_CHAT_ID,
          text: notification.text.slice(0, 4096),
          link_preview_options: { is_disabled: true },
        });
        return reply(202, { ok: true, kind: notification.kind, metrics_verified: false });
      } catch {
        // No automatic retry: a timed-out request may already have been sent.
        // Provider retries can still duplicate a message; this is not exactly-once.
        return reply(502, { ok: false, error: 'Telegram delivery could not be confirmed' });
      }
    },
  };
}

export default createRelay();
