'use strict';
// Public-only allowlist. Never package the surrounding private evidence folder.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { buildRelease } = require('./build-release.cjs');
const G = require('../src/engine.js');
const root = path.resolve(__dirname, '..');
const siteFiles = [
  'index.html', 'privacy.html', 'styles.css', 'demo.html', 'demo.js', 'demo.css',
  'shopify-csv-price-changes.html', 'guide.css', 'analytics.js', '_headers'
];

function validateWebsiteDestination(output, checkoutRoot = root) {
  const destination = path.resolve(output);
  // Rebuild only in the ignored website output area; do not overwrite sources.
  const allowed = path.join(path.resolve(checkoutRoot), '.local-test-artifacts');
  const relative = path.relative(allowed, destination);
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Website output must be inside .local-test-artifacts/ in this checkout.');
  // Check the ignored root, every existing ancestor, and the destination itself.
  // Inspecting only destination children would silently follow a linked root.
  const resolvedAllowed = path.join(fs.realpathSync(checkoutRoot), '.local-test-artifacts');
  let current = allowed;
  for (const segment of ['', ...relative.split(path.sep)]) {
    if (segment) current = path.join(current, segment);
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error('Linked website outputs are not allowed.');
    if (!stat.isDirectory()) throw new Error('Website output path components must be directories.');
    const resolvedRelative = path.relative(resolvedAllowed, fs.realpathSync(current));
    if (resolvedRelative === '..' || resolvedRelative.startsWith('..' + path.sep) || path.isAbsolute(resolvedRelative)) {
      throw new Error('Website output resolves outside .local-test-artifacts/ in this checkout.');
    }
  }
  return destination;
}

function buildWebsite(output) {
  const destination = validateWebsiteDestination(output);
  require('../src/demo.js');
  const demo = globalThis.ChangeGuardDemo;
  const report = G.compare(demo.current, demo.update, {
    threshold: 30, overwrite: true,
    currentName: 'demo-current-catalog.csv', updateName: 'demo-proposed-update.csv'
  });
  const payload = new Map(siteFiles.map(name => [name, fs.readFileSync(path.join(root, 'website', name))]));
  // Authorize exactly the reviewed local consent loader, not every same-origin
  // script. The third-party beacon can load only through that consent gate.
  const analyticsHash = crypto.createHash('sha256').update(payload.get('analytics.js')).digest('base64');
  for (const name of ['index.html', 'privacy.html', 'shopify-csv-price-changes.html']) {
    payload.set(name, Buffer.from(payload.get(name).toString('utf8').replaceAll('{{ANALYTICS_SHA256}}', analyticsHash)));
  }
  // Build the download from the same reviewed inputs as package:beta. Only the
  // ZIP and its public checksum leave this temporary packaging directory.
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ccg-public-release-'));
  let release;
  try {
    release = buildRelease(temporary);
    const archive = fs.readFileSync(release.archivePath);
    const downloadPath = 'downloads/' + release.archiveFilename;
    payload.set(downloadPath, archive);
    payload.set('downloads/SHA256SUMS.txt', Buffer.from(`${release.archiveSha256}  ${release.archiveFilename}\n`));
    payload.set('free-beta-terms.html', fs.readFileSync(path.join(release.packageDir, release.termsFile)));
    const replacements = {
      BETA_VERSION: release.candidateVersion,
      BETA_DOWNLOAD_PATH: downloadPath,
      BETA_ARCHIVE_KIB: String(Math.ceil(archive.length / 1024)),
      BETA_ARCHIVE_SHA256: release.archiveSha256,
    };
    const homepage = payload.get('index.html').toString('utf8').replace(/\{\{(BETA_[A-Z0-9_]+)\}\}/g, (_, key) => {
      if (!Object.hasOwn(replacements, key)) throw new Error('Unknown website release token: ' + key);
      return replacements[key];
    });
    payload.set('index.html', Buffer.from(homepage));
    release = { candidateVersion: release.candidateVersion, archiveFilename: release.archiveFilename,
      downloadPath, bytes: archive.length, sha256: release.archiveSha256 };
  } finally {
    // mkdtemp created this exact directory beneath the system temporary area.
    if (path.dirname(temporary) !== path.resolve(os.tmpdir()) || !path.basename(temporary).startsWith('ccg-public-release-')) {
      throw new Error('Refusing unexpected temporary release cleanup path.');
    }
    fs.rmSync(temporary, { recursive: true });
  }
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
  return { destination, files: [...payload.keys()], release, demo: { compared: report.stats.comparedVariants, prices: report.stats.priceChanges, priority: report.counts.blocking + report.counts.high, unpaired: report.stats.unpairedUpdateRows, findings: report.findings.length } };
}
if (require.main === module) {
  if (process.argv.length > 3) throw new Error('Usage: node scripts/build-website.cjs [output-directory]');
  console.log(JSON.stringify(buildWebsite(process.argv[2] || path.join(root, '.local-test-artifacts/public-site')), null, 2));
}
module.exports = { buildWebsite, validateWebsiteDestination };
