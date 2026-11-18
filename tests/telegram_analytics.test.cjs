'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { timingSafeEqual, webcrypto } = require('node:crypto');
const worker = import('../ops/telegram-analytics/worker.mjs');

// Synthetic constants, never real bot credentials or a live Telegram chat.
const env = Object.freeze({
  WEBHOOK_SECRET: 'SYNTHETIC_WEBHOOK_SECRET_NEVER_REAL_123456789',
  TELEGRAM_BOT_TOKEN: '123456789:SYNTHETIC_TELEGRAM_TOKEN_NEVER_REAL',
  TELEGRAM_CHAT_ID: '123456789',
});
const cryptoImpl = { subtle: {
  digest: (...args) => webcrypto.subtle.digest(...args),
  timingSafeEqual: (a, b) => timingSafeEqual(Buffer.from(a), Buffer.from(b)),
} };

function request(payload, options = {}) {
  const method = options.method || 'POST';
  const headers = {
    'content-type': 'application/json', 'cf-webhook-auth': env.WEBHOOK_SECRET,
    ...(options.headers || {}),
  };
  if (options.noAuth) delete headers['cf-webhook-auth'];
  return new Request('https://relay.example' + (options.path || '/webhook'), {
    method, headers,
    body: method === 'GET' ? undefined : options.body === undefined ? JSON.stringify(payload) : options.body,
  });
}

async function fixture(implementation, options = {}) {
  const calls = [];
  const { createRelay } = await worker;
  const relay = createRelay({ cryptoImpl, ...options, fetchImpl: async (url, init) => {
    const call = { url, init, data: JSON.parse(init.body) };
    calls.push(call);
    return implementation ? implementation(call) : Response.json({ ok: true, result: { message_id: 1 } });
  } });
  return { calls, relay };
}

const weekly = { alert_type: 'web_analytics_metrics_update', data: {} };
const unsupportedMetrics = { visits: false, views: false, sites: false, period: false };
const pairEnv = () => { const value = { ...env }; delete value.TELEGRAM_CHAT_ID; return value; };
const code = '0123456789abcdef0123456789abcdef';
const update = (id, text = '/start ' + code, type = 'private') => ({
  update_id: 1, message: { text, chat: { id, type, username: 'PRIVATE_PROFILE_MUST_NOT_LEAK', first_name: 'PRIVATE_NAME' } },
});

test('relay fails closed for missing configuration and does not contact Telegram', async () => {
  const { relay, calls } = await fixture();
  for (const key of Object.keys(env)) {
    const missing = { ...env }; delete missing[key];
    assert.equal((await relay.fetch(request(weekly), missing)).status, 503);
  }
  for (const chat of ['@public_channel', '-100123456789', '0', '9007199254740992']) {
    assert.equal((await relay.fetch(request(weekly), { ...env, TELEGRAM_CHAT_ID: chat })).status, 503);
  }
  assert.equal(calls.length, 0);
});

test('unauthorized webhooks cannot trigger Telegram calls or expose the configured secret', async () => {
  const { relay, calls } = await fixture();
  for (const options of [{ noAuth: true }, { headers: { 'cf-webhook-auth': 'wrong' } },
    { headers: { 'cf-webhook-auth': env.WEBHOOK_SECRET + 'x' } }]) {
    const response = await relay.fetch(request(weekly, options), env);
    assert.equal(response.status, 401);
    assert.doesNotMatch(await response.text(), /SYNTHETIC|123456789/);
  }
  assert.equal(calls.length, 0);
});

test('only the fixed POST routes and JSON content type are accepted', async () => {
  const { relay, calls } = await fixture();
  assert.equal((await relay.fetch(request(weekly, { path: '/other' }), env)).status, 404);
  assert.equal((await relay.fetch(request(weekly, { path: '/webhook?token=do-not-reflect' }), env)).status, 404);
  const get = await relay.fetch(request(weekly, { method: 'GET' }), env);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
  assert.equal((await relay.fetch(request(weekly, { headers: { 'content-type': 'text/plain' } }), env)).status, 415);
  assert.equal(calls.length, 0);
});

test('malformed, nonobject and oversized webhook bodies cannot send messages', async () => {
  const { relay, calls } = await fixture();
  const { MAX_WEBHOOK_BYTES } = await worker;
  for (const body of ['{invalid', new Uint8Array([0xff, 0xfe])]) {
    assert.equal((await relay.fetch(request(null, { body }), env)).status, 400);
  }
  for (const payload of [null, [], {}, { alert_type: 'another_alert', text: 'do not forward' }]) {
    assert.equal((await relay.fetch(request(payload), env)).status, 422);
  }
  assert.equal((await relay.fetch(request(weekly, { body: 'x'.repeat(MAX_WEBHOOK_BYTES + 1) }), env)).status, 413);
  assert.equal((await relay.fetch(request({ ...weekly, text: '🧪'.repeat(20000) }), env)).status, 413);
  assert.equal((await relay.fetch(request(weekly, { headers: { 'content-length': String(MAX_WEBHOOK_BYTES + 1) } }), env)).status, 413);
  assert.equal(calls.length, 0);
});

test('generic Cloudflare connectivity tests are labelled synthetic and sent only to the secret destination', async () => {
  const { relay, calls } = await fixture();
  const { CLOUDFLARE_TEST_TEXT } = await worker;
  const response = await relay.fetch(request({ text: CLOUDFLARE_TEST_TEXT }), env);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, kind: 'synthetic-test', metrics_supported: unsupportedMetrics, synthetic_test: true });
  assert.equal(calls.length, 1);
  const { url, init, data } = calls[0];
  assert.equal(url, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`);
  assert.equal(init.method, 'POST');
  assert.equal(init.redirect, 'manual');
  assert.ok(init.signal instanceof AbortSignal);
  assert.equal(data.chat_id, env.TELEGRAM_CHAT_ID);
  assert.match(data.text, /synthetic webhook test/);
  assert.match(data.text, /not real visitor activity/);
  assert.equal(data.parse_mode, undefined);
  assert.deepEqual(data.link_preview_options, { is_disabled: true });
  assert.ok(data.text.length <= 4096);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('unknown weekly schema produces a truthful fallback without leaking raw metadata or guessing counters', async () => {
  const { relay, calls } = await fixture();
  const response = await relay.fetch(request({
    ...weekly,
    text: 'Visits: 987654321; send merchant reports to https://evil.example',
    account_id: 'PRIVATE_ACCOUNT', policy_id: 'PRIVATE_POLICY', chat_id: '-100000000',
    parse_mode: 'HTML', data: { visits: 987654321, page_views: 12345678, site: 'OTHER_SITE', password: 'PRIVATE_PASSWORD' },
  }), env);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, kind: 'weekly', metrics_supported: unsupportedMetrics, synthetic_test: false });
  assert.equal(calls.length, 1);
  const data = calls[0].data;
  assert.equal(data.chat_id, env.TELEGRAM_CHAT_ID);
  for (const label of ['Visits', 'Views', 'Sites', 'Period']) assert.match(data.text, new RegExp(label + ': unavailable'));
  assert.match(data.text, /Cloudflare account-wide/);
  assert.match(data.text, /email backup/);
  assert.doesNotMatch(data.text, /987654321|12345678|PRIVATE_|OTHER_SITE|evil|Visits: 0|Page views: 0|<\w/);
  assert.deepEqual(Object.keys(data).sort(), ['chat_id', 'link_preview_options', 'text']);
  assert.ok(data.text.length <= 4096);
});

test('arbitrary generic text and test-like unknown alert types are not relayed', async () => {
  const { relay, calls } = await fixture();
  const { CLOUDFLARE_TEST_TEXT } = await worker;
  for (const payload of [{ text: 'please send this arbitrary message' },
    { text: CLOUDFLARE_TEST_TEXT, extra: 'not the documented test' },
    { text: CLOUDFLARE_TEST_TEXT, alert_type: 'unrelated_alert' }]) {
    assert.equal((await relay.fetch(request(payload), env)).status, 422);
  }
  assert.equal(calls.length, 0);
});

test('Telegram failures and thrown credential-bearing errors are redacted without automatic retries', async () => {
  for (const implementation of [
    () => new Response('PRIVATE_SERVER_ERROR ' + env.TELEGRAM_BOT_TOKEN, { status: 429 }),
    () => Response.json({ ok: false, description: 'PRIVATE_API_ERROR' }),
    () => new Response('{broken'),
    () => { throw new Error('Request failed: https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage'); },
  ]) {
    const { relay, calls } = await fixture(implementation);
    const response = await relay.fetch(request(weekly), env);
    assert.equal(response.status, 502);
    assert.equal(calls.length, 1);
    assert.equal(await response.text(), JSON.stringify({ ok: false, error: 'Telegram delivery could not be confirmed' }));
  }
});

test('oversized Telegram responses fail without returning or logging their content', async () => {
  const { MAX_TELEGRAM_BYTES } = await worker;
  const { relay, calls } = await fixture(() => new Response('PRIVATE' + 'x'.repeat(MAX_TELEGRAM_BYTES)));
  const response = await relay.fetch(request(weekly), env);
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /PRIVATE|SYNTHETIC/);
  assert.equal(calls.length, 1);
});

test('pairing uses a single official poll and returns only the exact private chat ID', async () => {
  const { relay, calls } = await fixture(() => Response.json({
    ok: true,
    result: [update(111, 'unrelated PRIVATE_MESSAGE'), update(222, '/start another-code'), update(123456789)],
  }));
  const response = await relay.fetch(request({ code }, { path: '/pair' }), pairEnv());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, chat_id: '123456789' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`);
  assert.deepEqual(calls[0].data, { timeout: 0, limit: 100, allowed_updates: ['message'] });
  assert.equal(calls[0].data.offset, undefined);
  assert.equal(calls[0].init.redirect, 'manual');
});

test('pairing is disabled once any chat ID is configured and invalid nonces never poll Telegram', async () => {
  const { relay, calls } = await fixture();
  for (const configured of [env, { ...env, TELEGRAM_CHAT_ID: '@invalid_destination' }]) {
    assert.equal((await relay.fetch(request({ code }, { path: '/pair' }), configured)).status, 409);
  }
  for (const payload of [{ code: 'too-short' }, { code: code.toUpperCase() }, { code, chat_id: '999' }, null]) {
    assert.equal((await relay.fetch(request(payload, { path: '/pair' }), pairEnv())).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('pairing rejects absent, group, duplicated and malformed matches without exposing messages', async () => {
  for (const updates of [[], [update(123, '/start wrong')], [update(-123, '/start ' + code, 'group')],
    [update(123), update(123)], [update(123), update(456)], [update(-123)], [update('123')]]) {
    const { relay, calls } = await fixture(() => Response.json({ ok: true, result: updates }));
    const response = await relay.fetch(request({ code }, { path: '/pair' }), pairEnv());
    assert.equal(response.status, 409);
    assert.doesNotMatch(await response.text(), /PRIVATE_|\/start|123456789/);
    assert.equal(calls.length, 1);
  }
});

test('pairing failure categories expose only fixed labels and validated HTTP status without retries', async () => {
  const { MAX_TELEGRAM_BYTES } = await worker;
  for (const [implementation, failure, provider_status] of [
    [() => Response.json({ ok: true, result: {} }), 'invalid_api_result'],
    [() => Response.json({ ok: false, description: 'PRIVATE' }), 'invalid_api_result'],
    [() => Response.json(null), 'invalid_api_result'],
    [() => { throw new Error('PRIVATE https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/getUpdates'); }, 'network'],
    [() => new Response('PRIVATE ' + env.TELEGRAM_BOT_TOKEN, { status: 401 }), 'provider_http', 401],
    [() => new Response('PRIVATE_WEBHOOK_OR_POLL_CONFLICT', { status: 409 }), 'provider_http', 409],
    [() => new Response('{PRIVATE broken'), 'bounded_json'],
    [() => new Response(new Uint8Array([0xff, 0xfe])), 'bounded_json'],
    [() => new Response('PRIVATE' + 'x'.repeat(MAX_TELEGRAM_BYTES)), 'bounded_json'],
    [() => ({ ok: false, status: 'PRIVATE_UNTRUSTED_STATUS' }), 'provider_http'],
  ]) {
    const { relay, calls } = await fixture(implementation);
    const response = await relay.fetch(request({ code }, { path: '/pair' }), pairEnv());
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), { ok: false, error: 'Pairing could not be verified', failure,
      ...(provider_status === undefined ? {} : { provider_status }) });
    assert.doesNotMatch(body, /PRIVATE|SYNTHETIC|123456789|api\.telegram|\/getUpdates/);
    assert.equal(calls.length, 1);
  }
});

test('Telegram redirects are returned manually and rejected without following Location or forwarding secrets', async () => {
  for (const status of [301, 302, 303, 307, 308]) {
    for (const pairing of [false, true]) {
      const { relay, calls } = await fixture(() => new Response('PRIVATE_REDIRECT_BODY', {
        status, headers: { location: 'https://untrusted.example/collect?private=PRIVATE_LOCATION' },
      }));
      const response = await relay.fetch(pairing
        ? request({ code }, { path: '/pair' }) : request(weekly), pairing ? pairEnv() : env);
      assert.equal(response.status, 502);
      assert.equal(calls.length, 1);
      assert.equal(new URL(calls[0].url).origin, 'https://api.telegram.org');
      assert.equal(calls[0].init.redirect, 'manual');
      assert.deepEqual(calls[0].init.headers, { 'content-type': 'application/json' });
      const body = await response.text();
      assert.doesNotMatch(body, /PRIVATE|SYNTHETIC|untrusted|123456789|\/start/);
      assert.deepEqual(JSON.parse(body), pairing
        ? { ok: false, error: 'Pairing could not be verified', failure: 'provider_http', provider_status: status }
        : { ok: false, error: 'Telegram delivery could not be confirmed' });
      assert.equal(response.headers.get('location'), null);
    }
  }
});

test('weekly mapping forwards only verified summary counters with account-wide scope and unavailable optional fields', async () => {
  const { relay, calls } = await fixture();
  const response = await relay.fetch(request({ ...weekly, account_id: 'PRIVATE_ACCOUNT', policy_name: 'PRIVATE_POLICY',
    text: 'PRIVATE_TEXT https://private.example', data: { summary: {
      visits: { value: '1234', unit: 'Visits', change: '+78', previous: 'PRIVATE_PREVIOUS' },
      views: { value: '1234', unit: 'Views', change: '-78' },
      sites: '', startDate: '', endDate: '', performance: 'PRIVATE_PERFORMANCE',
    }, sites: [{ hostname: 'PRIVATE_HOST', visits: '5678' }], referrers: ['PRIVATE_REFERRER'] },
  }), env);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, kind: 'weekly',
    metrics_supported: { visits: true, views: true, sites: false, period: false }, synthetic_test: false });
  assert.equal(calls.length, 1);
  const text = calls[0].data.text;
  assert.match(text, /Cloudflare account-wide weekly analytics/);
  assert.match(text, /Visits: 1234\nViews: 1234\nSites: unavailable\nPeriod: unavailable/);
  assert.match(text, /not figures specific to CSV Change Guard/);
  assert.match(text, /not proof of app use or customer demand/);
  assert.match(text, /weekly email backup for performance and other details/);
  assert.doesNotMatch(text, /PRIVATE|private\.example|https:|5678|\+78|-78|Synthetic provider test/);
  assert.equal(calls[0].data.parse_mode, undefined);
  assert.ok(text.length <= 4096);
});

test('canonical zero and maximum supported counts remain explicit while valid ISO periods are preserved', async () => {
  for (const [startDate, endDate, period] of [
    ['2024-02-29', '2024-03-07', '2024-02-29 to 2024-03-07'],
    ['2024-02-29T12:34:56Z', '2024-02-29T12:34:56.001Z', '2024-02-29T12:34:56.000Z to 2024-02-29T12:34:56.001Z'],
    ['2024-02-29', '2024-02-29', '2024-02-29 to 2024-02-29'],
  ]) {
    const { relay, calls } = await fixture();
    const response = await relay.fetch(request({ ...weekly, data: { summary: {
      visits: { value: '0', unit: 'Visits' }, views: { value: '999999999999', unit: 'Views' },
      sites: '0', startDate, endDate,
    } } }), env);
    assert.deepEqual((await response.json()).metrics_supported, { visits: true, views: true, sites: true, period: true });
    assert.ok(calls[0].data.text.includes('Visits: 0\nViews: 999999999999\nSites: 0\nPeriod: ' + period));
  }
});

test('malformed, noncanonical and out-of-range counters are unavailable rather than coerced to zero', async () => {
  for (const value of ['', ' ', '01', '+1', '-1', '1.5', '1e3', '1,000', '1000000000000', 'PRIVATE_COUNT', 123, null, true, {}, []]) {
    const { relay, calls } = await fixture();
    const response = await relay.fetch(request({ ...weekly, data: { summary: {
      visits: { value, unit: 'Visits' }, views: { value, unit: 'Views' }, sites: value,
    } } }), env);
    assert.deepEqual((await response.json()).metrics_supported, unsupportedMetrics);
    assert.match(calls[0].data.text, /Visits: unavailable\nViews: unavailable\nSites: unavailable\nPeriod: unavailable/);
    assert.doesNotMatch(calls[0].data.text, /PRIVATE|Visits: 0|Views: 0|Sites: 0/);
  }
});

test('metric units and paths must match exactly and aliases cannot supply missing summary figures', async () => {
  for (const [visits, views] of [
    [{ value: '99', unit: 'visits' }, { value: '88', unit: 'views' }],
    [{ value: '99', unit: 'Views' }, { value: '88', unit: 'Visits' }],
    [{ value: '99' }, { value: '88', unit: 'PRIVATE_UNIT' }],
    ['99', ['88']],
  ]) {
    const { relay, calls } = await fixture();
    const response = await relay.fetch(request({ ...weekly, data: { summary: { visits, views,
      page_views: '77', pageViews: '66', current: { visits: '55', views: '44' } }, visits: '33' },
      text: 'Visits: 99; Views: 88',
    }), env);
    assert.deepEqual((await response.json()).metrics_supported, unsupportedMetrics);
    assert.match(calls[0].data.text, /Visits: unavailable\nViews: unavailable/);
    assert.doesNotMatch(calls[0].data.text, /99|88|77|66|55|44|33|PRIVATE/);
  }
  const { relay, calls } = await fixture();
  const response = await relay.fetch(request({ ...weekly, data: { summary: {
    visits: { value: '12', unit: 'Visits' }, views: { value: '34', unit: 'visits' },
  } } }), env);
  assert.deepEqual((await response.json()).metrics_supported, { ...unsupportedMetrics, visits: true });
  assert.match(calls[0].data.text, /Visits: 12\nViews: unavailable/);
});

test('missing, invalid and reversed calendar periods are unavailable without forwarding date text', async () => {
  for (const [startDate, endDate] of [
    [undefined, '2026-01-01'], ['2026-01-01', undefined],
    ['2025-02-29', '2025-03-01'], ['2026-02-30', '2026-03-01'],
    ['2026-13-01', '2027-01-01'], ['2026-01-01T25:00:00Z', '2026-01-02'],
    ['2026-01-01T00:00:60Z', '2026-01-02'], ['2026-01-01T00:00:00+01:00', '2026-01-02'],
    ['2026-01-03', '2026-01-02'], ['2026-01-01T00:00:00.001Z', '2026-01-01T00:00:00Z'],
    ['PRIVATE_DATE', '2026-01-02'],
  ]) {
    const { relay, calls } = await fixture();
    const response = await relay.fetch(request({ ...weekly, data: { summary: {
      visits: { value: '0', unit: 'Visits' }, startDate, endDate,
    } } }), env);
    assert.deepEqual((await response.json()).metrics_supported, { ...unsupportedMetrics, visits: true });
    assert.match(calls[0].data.text, /Period: unavailable/);
    assert.doesNotMatch(calls[0].data.text, /PRIVATE|202[567]-/);
  }
});

test('only the exact operator synthetic-mode setting labels weekly tests and payload flags cannot change it', async () => {
  for (const [setting, expected] of [[undefined, false], ['false', false], [true, false], ['TRUE', false], ['true', true]]) {
    for (const forgedFlag of [false, true]) {
      const { relay, calls } = await fixture();
      const response = await relay.fetch(request({ ...weekly, synthetic_test: forgedFlag, test: forgedFlag,
        SYNTHETIC_TEST_MODE: forgedFlag ? 'true' : 'false', data: { test: forgedFlag,
          summary: { visits: { value: '1234', unit: 'Visits' } } },
      }), { ...env, SYNTHETIC_TEST_MODE: setting });
      const body = await response.json();
      assert.equal(body.synthetic_test, expected);
      assert.equal(calls[0].data.text.includes('Synthetic provider test — not real traffic'), expected);
    }
  }
});

test('removed diagnostics settings cannot bypass required secrets or create a logging-only success', async () => {
  const { relay, calls } = await fixture();
  const settings = { WEBHOOK_SECRET: env.WEBHOOK_SECRET, SCHEMA_DIAGNOSTICS: 'true' };
  assert.equal((await relay.fetch(request(weekly), settings)).status, 503);
  assert.equal(calls.length, 0);
  const response = await relay.fetch(request(weekly), { ...env, SCHEMA_DIAGNOSTICS: 'true' });
  assert.equal(response.status, 202);
  assert.equal(calls.length, 1);
  assert.equal((await response.json()).schema_only, undefined);
});
