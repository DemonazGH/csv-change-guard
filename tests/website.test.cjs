'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildRelease } = require('../scripts/build-release.cjs');
const { buildWebsite, validateWebsiteDestination } = require('../scripts/build-website.cjs');
const root = path.resolve(__dirname, '..');
function output(t) {
  const dir = fs.mkdtempSync(path.join(root, '.local-test-artifacts/website-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('public website allowlists the free download and fixed demo from the unchanged engine', t => {
  fs.mkdirSync(path.join(root, '.local-test-artifacts'), { recursive: true });
  const dir = output(t);
  const built = buildWebsite(dir);
  assert.deepEqual(built.demo, { compared: 4, prices: 4, priority: 6, unpaired: 4, findings: 15 });
  assert.deepEqual(built.files.sort(), [
    '_headers', 'analytics.js', 'assets/demo-data.js', 'assets/engine.js', 'demo-report.html', 'demo.css', 'demo.html',
    'demo.js', 'guide.css', 'index.html', 'privacy.html', 'free-beta-terms.html',
    'downloads/csv-change-guard-0.1.0-beta.2.zip', 'downloads/SHA256SUMS.txt', 'samples/demo-current-catalog.csv',
    'samples/demo-proposed-update.csv', 'shopify-csv-price-changes.html', 'styles.css'
  ].sort());
  assert.deepEqual(fs.readFileSync(path.join(dir, 'assets/engine.js')), fs.readFileSync(path.join(root, 'src/engine.js')));
  assert.deepEqual(fs.readFileSync(path.join(dir, 'assets/demo-data.js')), fs.readFileSync(path.join(root, 'src/demo.js')));
  const headers = fs.readFileSync(path.join(dir, '_headers'), 'utf8');
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /Content-Security-Policy: frame-ancestors 'none'/);
  const report = fs.readFileSync(path.join(dir, 'demo-report.html'), 'utf8');
  assert.match(report, /Incomplete comparison — blockers need review/);
  assert.match(report, /Findings \(15\)/);
  assert.match(report, /demo-current-catalog\.csv/);
  assert.match(report, /demo-proposed-update\.csv/);
  for (const name of ['index.html', 'demo.html', 'privacy.html', 'shopify-csv-price-changes.html', 'free-beta-terms.html']) {
    const html = fs.readFileSync(path.join(dir, name), 'utf8');
    assert.doesNotMatch(html, /<(?:input|form|iframe)\b/i, name + ': no file entry or submission surface');
    assert.doesNotMatch(html, /(?:src|href)=["']https?:[^"']+["'][^>]*rel=["']stylesheet|src=["']https?:/i);
    if (['index.html', 'privacy.html', 'shopify-csv-price-changes.html'].includes(name)) {
      assert.match(html, /connect-src https:\/\/cloudflareinsights\.com\/cdn-cgi\/rum;/);
    } else {
      assert.match(html, /connect-src 'none'/);
    }
    assert.match(html, /form-action 'none'/);
    // Each local navigation or embedded asset must exist in the upload allowlist.
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:)/i.test(value)) continue;
      const [target, hash] = value.split('#');
      const file = target || name;
      assert.ok(built.files.includes(file), name + ': missing public file ' + value);
      if (hash) assert.match(fs.readFileSync(path.join(dir, file), 'utf8'), new RegExp('id="' + hash + '"'));
    }
  }
});

test('only informational pages authorize the reviewed consent loader; demo, terms and app stay isolated', t => {
  const dir = output(t);
  buildWebsite(dir);
  const loader = fs.readFileSync(path.join(dir, 'analytics.js'));
  assert.deepEqual(loader, fs.readFileSync(path.join(root, 'website/analytics.js')));
  const integrity = 'sha256-' + crypto.createHash('sha256').update(loader).digest('base64');
  for (const name of ['index.html', 'privacy.html', 'shopify-csv-price-changes.html']) {
    const html = fs.readFileSync(path.join(dir, name), 'utf8');
    const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
    assert.ok(policy.includes(`script-src '${integrity}' 'strict-dynamic';`), name + ': exact reviewed loader hash');
    assert.ok(policy.includes('connect-src https://cloudflareinsights.com/cdn-cgi/rum;'), name + ': exact transport endpoint');
    assert.doesNotMatch(policy, /(?:unsafe-inline|unsafe-eval|script-src 'self'|script-src https?:)/, name + ': no broad script permission');
    assert.ok(html.includes(`<script defer src="analytics.js" integrity="${integrity}"></script>`), name + ': loader integrity matches CSP');
    assert.equal([...html.matchAll(/src="analytics\.js"/g)].length, 1, name + ': one consent loader');
    assert.doesNotMatch(html, /\{\{ANALYTICS_|src="https?:/, name + ': no unresolved token or pre-consent vendor tag');
    for (const id of ['analytics-allow', 'analytics-decline']) {
      assert.match(html, new RegExp(`<button[^>]*id="${id}"[^>]*disabled`), name + ': consent stays off without JavaScript');
    }
  }
  for (const name of ['demo.html', 'demo-report.html', 'free-beta-terms.html']) {
    const html = fs.readFileSync(path.join(dir, name), 'utf8');
    const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
    const directives = policy.split(';').map(value => value.trim());
    // Static reports inherit connect-src from default-src rather than repeat it.
    const connections = directives.find(value => value.startsWith('connect-src ')) ||
      directives.find(value => value.startsWith('default-src '));
    assert.match(connections, /^(?:connect-src|default-src) 'none'$/, name + ': effective connection policy remains none');
    assert.doesNotMatch(html, /analytics\.js|cloudflareinsights|data-cf-beacon|id="analytics-choice"/, name + ': no analytics integration');
  }
  const app = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  assert.match(app, /connect-src 'none'/, 'standalone utility remains network-isolated');
  assert.doesNotMatch(app, /analytics\.js|cloudflareinsights|data-cf-beacon/, 'website analytics never enters the utility');
});

test('website download, displayed fingerprint and terms match the reproducible release', t => {
  const dir = output(t);
  const site = buildWebsite(path.join(dir, 'site'));
  const release = buildRelease(path.join(dir, 'release'));
  const archive = fs.readFileSync(path.join(site.destination, site.release.downloadPath));
  assert.deepEqual(archive, fs.readFileSync(release.archivePath));
  const digest = crypto.createHash('sha256').update(archive).digest('hex');
  assert.equal(site.release.sha256, digest);
  assert.equal(site.release.bytes, archive.length);
  assert.equal(site.release.candidateVersion, release.candidateVersion);
  assert.equal(fs.readFileSync(path.join(site.destination, 'downloads/SHA256SUMS.txt'), 'utf8'), `${digest}  ${release.archiveFilename}\n`);
  const homepage = fs.readFileSync(path.join(site.destination, 'index.html'), 'utf8');
  assert.match(homepage, new RegExp('id="beta-download" href="' + site.release.downloadPath.replaceAll('.', '\\.') + '" download'));
  assert.ok(homepage.includes(`<code id="beta-sha256">${digest}</code>`));
  assert.ok(homepage.includes(release.candidateVersion));
  assert.doesNotMatch(homepage, /\{\{BETA_|beta in preparation|downloadable beta is in preparation/i);
  assert.doesNotMatch(homepage, /lemonsqueezy|checkout|\$\s*(?:4\.99|19|29)/i);
  assert.deepEqual(fs.readFileSync(path.join(site.destination, 'free-beta-terms.html')),
    fs.readFileSync(path.join(release.packageDir, release.termsFile)));
});

test('website rebuild keeps versioned download bytes stable', t => {
  const dir = output(t);
  const first = buildWebsite(dir);
  const before = fs.readFileSync(path.join(dir, first.release.downloadPath));
  const second = buildWebsite(dir);
  assert.deepEqual(second.release, first.release);
  assert.deepEqual(fs.readFileSync(path.join(dir, second.release.downloadPath)), before);
});

test('website rebuild refuses an unexpected private file in the deployment output', t => {
  const dir = output(t);
  fs.writeFileSync(path.join(dir, 'private-notes.txt'), 'synthetic sentinel; must never be included');
  assert.throws(() => buildWebsite(dir), /Unknown file/);
  assert.equal(fs.existsSync(path.join(dir, 'index.html')), false, 'fail before writing a deployment');
  assert.throws(() => buildWebsite(path.join(root, 'dist')), /inside .local-test-artifacts/);
});

test('website output rejects linked ignored roots, ancestors and destinations before writing', t => {
  const dir = output(t);
  const checkout = path.join(dir, 'synthetic-checkout');
  const outside = path.join(dir, 'outside-allowed-output');
  const allowed = path.join(checkout, '.local-test-artifacts');
  fs.mkdirSync(checkout);
  fs.mkdirSync(outside);
  const sentinel = path.join(outside, 'keep.txt');
  fs.writeFileSync(sentinel, 'synthetic private-output sentinel');
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  for (const [linked, destination] of [
    [allowed, path.join(allowed, 'site')],
    [path.join(allowed, 'ancestor'), path.join(allowed, 'ancestor', 'site')],
    [path.join(allowed, 'site'), path.join(allowed, 'site')],
  ]) {
    fs.mkdirSync(path.dirname(linked), { recursive: true });
    fs.symlinkSync(outside, linked, linkType);
    try {
      assert.throws(() => validateWebsiteDestination(destination, checkout), /Linked website outputs/);
      // Also exercise the production entry point for linked output components
      // under this checkout, without changing its shared ignored root.
      assert.throws(() => buildWebsite(destination), /Linked website outputs/);
      assert.deepEqual(fs.readdirSync(outside), ['keep.txt'], 'no files written through a link');
      assert.equal(fs.readFileSync(sentinel, 'utf8'), 'synthetic private-output sentinel');
    } finally {
      // Unlink the junction itself before the ordinary bounded fixture cleanup.
      // Never recurse into the linked destination to remove it.
      assert.ok(fs.lstatSync(linked).isSymbolicLink());
      fs.unlinkSync(linked);
    }
  }
  assert.equal(validateWebsiteDestination(path.join(allowed, 'new', 'site'), checkout), path.join(allowed, 'new', 'site'));
  assert.deepEqual(fs.readdirSync(outside), ['keep.txt']);
});
