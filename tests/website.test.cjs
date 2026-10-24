'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWebsite } = require('../scripts/build-website.cjs');
const root = path.resolve(__dirname, '..');
function output(t) {
  const dir = fs.mkdtempSync(path.join(root, '.local-test-artifacts/website-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('public website contains only reviewed assets and fixed synthetic inputs from the unchanged engine', t => {
  fs.mkdirSync(path.join(root, '.local-test-artifacts'), { recursive: true });
  const dir = output(t);
  const built = buildWebsite(dir);
  assert.deepEqual(built.demo, { compared: 4, prices: 4, priority: 6, unpaired: 4, findings: 15 });
  assert.deepEqual(built.files.sort(), [
    '_headers', 'assets/demo-data.js', 'assets/engine.js', 'demo-report.html', 'demo.css', 'demo.html',
    'demo.js', 'index.html', 'privacy.html', 'samples/demo-current-catalog.csv',
    'samples/demo-proposed-update.csv', 'styles.css'
  ].sort());
  assert.deepEqual(fs.readFileSync(path.join(dir, 'assets/engine.js')), fs.readFileSync(path.join(root, 'src/engine.js')));
  assert.deepEqual(fs.readFileSync(path.join(dir, 'assets/demo-data.js')), fs.readFileSync(path.join(root, 'src/demo.js')));
  const report = fs.readFileSync(path.join(dir, 'demo-report.html'), 'utf8');
  assert.match(report, /Incomplete comparison — blockers need review/);
  assert.match(report, /Findings \(15\)/);
  assert.match(report, /demo-current-catalog\.csv/);
  assert.match(report, /demo-proposed-update\.csv/);
  for (const name of ['index.html', 'demo.html', 'privacy.html']) {
    const html = fs.readFileSync(path.join(dir, name), 'utf8');
    assert.doesNotMatch(html, /<(?:input|form|iframe)\b/i, name + ': no file entry or submission surface');
    assert.doesNotMatch(html, /(?:src|href)=["']https?:[^"']+["'][^>]*rel=["']stylesheet|src=["']https?:/i);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /form-action 'none'/);
    // Each local navigation or embedded asset must exist in the upload allowlist.
    for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|#)/i.test(value)) continue;
      const [file, hash] = value.split('#');
      assert.ok(built.files.includes(file), name + ': missing public file ' + value);
      if (hash) assert.match(fs.readFileSync(path.join(dir, file), 'utf8'), new RegExp('id="' + hash + '"'));
    }
  }
});

test('website rebuild refuses an unexpected private file in the deployment output', t => {
  const dir = output(t);
  fs.writeFileSync(path.join(dir, 'private-notes.txt'), 'synthetic sentinel; must never be included');
  assert.throws(() => buildWebsite(dir), /Unknown file/);
  assert.equal(fs.existsSync(path.join(dir, 'index.html')), false, 'fail before writing a deployment');
  assert.throws(() => buildWebsite(path.join(root, 'dist')), /inside .local-test-artifacts/);
});
