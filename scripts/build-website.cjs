'use strict';
// Public-only allowlist. Never package the surrounding private evidence folder.
const fs = require('node:fs');
const path = require('node:path');
const G = require('../src/engine.js');
const root = path.resolve(__dirname, '..');
const siteFiles = ['index.html', 'privacy.html', 'styles.css', 'demo.html', 'demo.js', 'demo.css', '_headers'];

function buildWebsite(output) {
  const destination = path.resolve(output);
  // Rebuild only in the ignored website output area; do not overwrite sources.
  const allowed = path.join(root, '.local-test-artifacts');
  const relative = path.relative(allowed, destination);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Website output must be inside .local-test-artifacts/ in this checkout.');
  require('../src/demo.js');
  const demo = globalThis.ChangeGuardDemo;
  const report = G.compare(demo.current, demo.update, {
    threshold: 30, overwrite: true,
    currentName: 'demo-current-catalog.csv', updateName: 'demo-proposed-update.csv'
  });
  const payload = new Map(siteFiles.map(name => [name, fs.readFileSync(path.join(root, 'website', name))]));
  payload.set('assets/engine.js', fs.readFileSync(path.join(root, 'src/engine.js')));
  payload.set('assets/demo-data.js', fs.readFileSync(path.join(root, 'src/demo.js')));
  payload.set('samples/demo-current-catalog.csv', Buffer.from(demo.current));
  payload.set('samples/demo-proposed-update.csv', Buffer.from(demo.update));
  payload.set('demo-report.html', Buffer.from(G.reportHTML(report)));
  // Refuse pre-existing unknown files instead of accidentally publishing them.
  if (fs.existsSync(destination)) {
    function inspect(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        if (entry.isSymbolicLink()) throw new Error('Linked website outputs are not allowed.');
        if (entry.isDirectory()) inspect(absolute);
        else if (!entry.isFile() || !payload.has(path.relative(destination, absolute).split(path.sep).join('/'))) throw new Error('Unknown file in website output; use a fresh destination.');
      }
    }
    inspect(destination);
  }
  for (const [name, bytes] of payload) {
    const file = path.join(destination, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
  }
  return { destination, files: [...payload.keys()], demo: { compared: report.stats.comparedVariants, prices: report.stats.priceChanges, priority: report.counts.blocking + report.counts.high, unpaired: report.stats.unpairedUpdateRows, findings: report.findings.length } };
}
if (require.main === module) {
  if (process.argv.length > 3) throw new Error('Usage: node scripts/build-website.cjs [output-directory]');
  console.log(JSON.stringify(buildWebsite(process.argv[2] || path.join(root, '.local-test-artifacts/public-site')), null, 2));
}
module.exports = { buildWebsite };
