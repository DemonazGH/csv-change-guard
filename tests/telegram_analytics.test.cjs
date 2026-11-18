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
  const schemas = [];
  const { createRelay } = await worker;
  const relay = createRelay({ cryptoImpl, schemaLog: shape => schemas.push(shape), ...options, fetchImpl: async (url, init) => {
    const call = { url, init, data: JSON.parse(init.body) };
    calls.push(call);
    return implementation ? implementation(call) : Response.json({ ok: true, result: { message_id: 1 } });
  } });
  return { calls, relay, schemas };
}

const weekly = { alert_type: 'web_analytics_metrics_update', data: {} };
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
  assert.deepEqual(await response.json(), { ok: true, kind: 'synthetic-test', metrics_verified: false });
  assert.equal(calls.length, 1);
  const { url, init, data } = calls[0];
  assert.equal(url, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`);
  assert.equal(init.method, 'POST');
  assert.equal(init.redirect, 'error');
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
  assert.deepEqual(await response.json(), { ok: true, kind: 'weekly', metrics_verified: false });
  assert.equal(calls.length, 1);
  const data = calls[0].data;
  assert.equal(data.chat_id, env.TELEGRAM_CHAT_ID);
  assert.match(data.text, /figures have not been verified/);
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
  assert.equal(calls[0].init.redirect, 'error');
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
    const { relay, calls, schemas } = await fixture(implementation);
    const response = await relay.fetch(request({ code }, { path: '/pair' }), pairEnv());
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.deepEqual(JSON.parse(body), { ok: false, error: 'Pairing could not be verified', failure,
      ...(provider_status === undefined ? {} : { provider_status }) });
    assert.doesNotMatch(body, /PRIVATE|SYNTHETIC|123456789|api\.telegram|\/getUpdates/);
    assert.equal(calls.length, 1);
    assert.equal(schemas.length, 0);
  }
});

test('temporary schema diagnostics emit bounded paths/types without original values or Telegram requests', async () => {
  const { relay, calls, schemas } = await fixture();
  const payload = { ...weekly, account_id: 'PRIVATE_ACCOUNT_VALUE', text: 'PRIVATE_MESSAGE_VALUE',
    PrivateAccountName: { private_store_alpha: { visits: 456789 } },
    data: { sites: [{ hostname: 'PRIVATE_SITE_VALUE', visits: 987654321, extra: { private: 'PRIVATE_DEEP_VALUE' } }],
      'https://private.example/catalog.csv': { email: 'PRIVATE_EMAIL_VALUE' },
      abcdefabcdefabcdefabcdefabcdefab: true,
      private_account_name_123: { PrivateStoreAlpha: { page_views: 7654321 } },
      ['x'.repeat(100)]: 'PRIVATE_LONG_KEY_VALUE',
    },
  };
  const response = await relay.fetch(request(payload), { WEBHOOK_SECRET: env.WEBHOOK_SECRET, SCHEMA_DIAGNOSTICS: 'true' });
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, schema_only: true });
  assert.equal(calls.length, 0);
  assert.equal(schemas.length, 1);
  const serialized = JSON.stringify(schemas[0]);
  assert.doesNotMatch(serialized, /PRIVATE_|987654321|456789|7654321|private\.example|abcdefabcdef|x{49}/);
  assert.doesNotMatch(serialized, /PrivateAccountName|private_store_alpha|private_account_name_123|PrivateStoreAlpha/);
  assert.ok(schemas[0].some(node => node.path === '$.data.sites[0].visits' && node.type === 'number'));
  assert.ok(schemas[0].some(node => node.path === '$.data.[redacted-key-3].[redacted-key-0].page_views' && node.type === 'number'));
  assert.ok(schemas[0].some(node => node.path.includes('[redacted-key-')));
  assert.ok(schemas[0].length <= 100);
  for (const node of schemas[0]) assert.deepEqual(Object.keys(node).sort(), ['path', 'type']);

  const { describeSchema } = await worker;
  const wide = Object.fromEntries(Array.from({ length: 100 }, (_, index) => ['field_' + index,
    Object.fromEntries(Array.from({ length: 100 }, (_, inner) => ['field_' + inner, { child: { last: 123 } }]))]));
  const bounded = describeSchema(wide);
  assert.equal(bounded.length, 100);
  assert.ok(bounded.every(node => node.path.split('.').length - 1 <= 4));
  assert.ok(bounded.every(node => node.path.length <= 200));
  assert.doesNotMatch(JSON.stringify(bounded), /123/);
});

test('diagnostics reject pairing and unauthorized bodies without polling, sending or schema logging', async () => {
  const { relay, calls, schemas } = await fixture();
  const settings = { ...pairEnv(), SCHEMA_DIAGNOSTICS: 'true' };
  assert.equal((await relay.fetch(request({ code }, { path: '/pair' }), settings)).status, 409);
  assert.equal((await relay.fetch(request(weekly, { noAuth: true }), settings)).status, 401);
  assert.equal((await relay.fetch(request(null, { body: '{broken' }), settings)).status, 400);
  assert.equal(calls.length, 0);
  assert.equal(schemas.length, 0);
});
