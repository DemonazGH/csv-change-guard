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

class TelegramFailure extends Error {
  constructor(category, status) {
    super('Telegram request failed');
    this.category = category;
    if (Number.isInteger(status) && status >= 100 && status <= 599) this.status = status;
  }
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

function count(value) {
  return typeof value === 'string' && /^(0|[1-9][0-9]{0,11})$/.test(value) && Number.isSafeInteger(Number(value)) ? value : null;
}

function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value)) return null;
  const dateOnly = value.length === 10;
  const canonical = dateOnly ? value + 'T00:00:00.000Z' : value.length === 20 ? value.slice(0, -1) + '.000Z' : value;
  const instant = new Date(canonical);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== canonical) return null;
  return { text: dateOnly ? value : canonical, time: instant.getTime() };
}

export function formatNotification(payload, { syntheticTest = false } = {}) {
  if (!isRecord(payload)) return null;
  if (!Object.hasOwn(payload, 'alert_type') && Object.keys(payload).length === 1 && payload.text === CLOUDFLARE_TEST_TEXT) {
    return {
      kind: 'synthetic-test',
      syntheticTest: true,
      metricsSupported: { visits: false, views: false, sites: false, period: false },
      text: 'CSV Change Guard — Telegram connection test\n\nSynthetic provider test — not real traffic\n\nCloudflare\'s synthetic webhook test reached this private chat. This is not real visitor activity. Weekly email remains the backup.',
    };
  }
  if (payload.alert_type !== WEEKLY_ALERT_TYPE) return null;
  // Exact summary fields were inspected in a native provider Test and compared
  // with its email. No aliases, deltas, site lists or arbitrary metadata pass.
  const summary = isRecord(payload.data?.summary) ? payload.data.summary : {};
  const visits = isRecord(summary.visits) && summary.visits.unit === 'Visits' ? count(summary.visits.value) : null;
  const views = isRecord(summary.views) && summary.views.unit === 'Views' ? count(summary.views.value) : null;
  const sites = count(summary.sites);
  const start = date(summary.startDate);
  const end = date(summary.endDate);
  const period = start && end && start.time <= end.time ? start.text + ' to ' + end.text : null;
  return {
    kind: 'weekly',
    syntheticTest: syntheticTest === true,
    metricsSupported: { visits: visits !== null, views: views !== null, sites: sites !== null, period: period !== null },
    text: 'CSV Change Guard — Cloudflare account-wide weekly analytics\n\n' +
      (syntheticTest === true ? 'Synthetic provider test — not real traffic\n\n' : '') +
      'Visits: ' + (visits ?? 'unavailable') + '\nViews: ' + (views ?? 'unavailable') +
      '\nSites: ' + (sites ?? 'unavailable') + '\nPeriod: ' + (period ?? 'unavailable') +
      '\n\nThese are Cloudflare account-wide figures, not figures specific to CSV Change Guard.\n' +
      'Website traffic is not proof of app use or customer demand.\n' +
      'See the weekly email backup for performance and other details.',
  };
}

export function createRelay({ fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto } = {}) {
  async function telegram(method, token, data) {
    let response;
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
        // Workers supports manual/follow, not the Fetch standard's error mode.
        // Reject the returned non-2xx status instead of following any Location.
        method: 'POST', redirect: 'manual',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), signal: AbortSignal.timeout(8000),
      });
    } catch { throw new TelegramFailure('network'); }
    if (!response.ok) throw new TelegramFailure('provider_http', response.status);
    let result;
    try { result = await readJsonBounded(response, MAX_TELEGRAM_BYTES); }
    catch { throw new TelegramFailure('bounded_json'); }
    if (!isRecord(result) || result.ok !== true) throw new TelegramFailure('invalid_api_result');
    return result;
  }

  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);
      if (!['/webhook', '/pair'].includes(url.pathname) || url.search) return reply(404, { ok: false, error: 'Not found' });
      if (request.method !== 'POST') return reply(405, { ok: false, error: 'POST required' }, { allow: 'POST' });
      if (!validSecret(env.WEBHOOK_SECRET) || !validToken(env.TELEGRAM_BOT_TOKEN) ||
          typeof cryptoImpl?.subtle?.timingSafeEqual !== 'function') {
        return reply(503, { ok: false, error: 'Relay not configured' });
      }
      let authorized;
      try { authorized = await authenticates(request.headers.get('cf-webhook-auth'), env.WEBHOOK_SECRET, cryptoImpl); }
      catch { return reply(503, { ok: false, error: 'Relay unavailable' }); }
      if (!authorized) return reply(401, { ok: false, error: 'Unauthorized' });
      if (url.pathname === '/pair' && env.TELEGRAM_CHAT_ID) return reply(409, { ok: false, error: 'Pairing is disabled' });
      if (url.pathname === '/webhook' && !validChatId(env.TELEGRAM_CHAT_ID)) return reply(503, { ok: false, error: 'Relay not configured' });
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
          if (!Array.isArray(response.result)) throw new TelegramFailure('invalid_api_result');
          const matches = response.result.filter(update => update?.message?.chat?.type === 'private' &&
            update.message.text === '/start ' + payload.code);
          if (matches.length !== 1) return reply(409, { ok: false, error: 'A single matching private message is required' });
          const id = matches[0].message.chat.id;
          if (!Number.isSafeInteger(id) || id <= 0 || !validChatId(String(id))) return reply(409, { ok: false, error: 'A valid private chat is required' });
          return reply(200, { ok: true, chat_id: String(id) });
        } catch (error) {
          // Only fixed local categories and a validated HTTP status escape this
          // boundary. Never return provider descriptions, URLs or update data.
          const failure = error instanceof TelegramFailure ? error.category : 'internal';
          const detail = error instanceof TelegramFailure && error.status !== undefined
            ? { provider_status: error.status } : {};
          return reply(502, { ok: false, error: 'Pairing could not be verified', failure, ...detail });
        }
      }

      const notification = formatNotification(payload, { syntheticTest: env.SYNTHETIC_TEST_MODE === 'true' });
      if (!notification) return reply(422, { ok: false, error: 'Unsupported notification' });
      try {
        // Destination and text are never taken from caller-controlled chat IDs,
        // formatting instructions, links, report contents or message templates.
        await telegram('sendMessage', env.TELEGRAM_BOT_TOKEN, {
          chat_id: env.TELEGRAM_CHAT_ID,
          text: notification.text.slice(0, 4096),
          link_preview_options: { is_disabled: true },
        });
        return reply(202, { ok: true, kind: notification.kind,
          metrics_supported: notification.metricsSupported, synthetic_test: notification.syntheticTest });
      } catch {
        // No automatic retry: a timed-out request may already have been sent.
        // Provider retries can still duplicate a message; this is not exactly-once.
        return reply(502, { ok: false, error: 'Telegram delivery could not be confirmed' });
      }
    },
  };
}

export default createRelay();
