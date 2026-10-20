'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { buildRelease } = require('../scripts/build-release.cjs');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const root = 'CSV-Change-Guard/';
const expected = [
  'DRAFT-NOT-FOR-SALE.txt', 'SHA256SUMS.txt', 'START_HERE.txt', 'dist/index.html',
  'help.html', 'manifest.json', 'samples/current-catalog.csv',
  'samples/proposed-update.csv', 'samples/unchanged-update.csv', 'server.cjs',
].sort();

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ccg-release-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const sourceRoot = path.join(temporary, 'source');
  const inputs = {
    'package.json': '{"version":"0.1.0","license":"UNLICENSED"}\n',
    'release/START_HERE.txt': 'Open dist/index.html.\r\nSynthetic samples only.\r\n',
    'release/help.html': '<!doctype html><title>Help</title><p>Local comparison.</p>\n',
    'release/DRAFT-NOT-FOR-SALE.txt': 'Internal review. Not for sale.\n',
    'dist/index.html': '<!doctype html>\r\n<title>CSV Change Guard</title><script>const sample="é";</script>\r\n',
    'server.cjs': "'use strict';\nrequire('node:http');\n",
    'samples/current-catalog.csv': 'Handle,Title,SKU,Price\r\nmug,Mug,M1,12.50\r\n',
    'samples/proposed-update.csv': 'Handle,Title,SKU,Price\nmug,Mug,M1,1.25\n',
    'samples/unchanged-update.csv': 'Handle,Title,SKU,Price\r\nmug,Mug,M1,12.50\r\n',
    '.git/config': 'private Git details',
    '.env': 'SECRET=must-not-be-shipped',
    'test-artifacts/confidential.csv': 'not a release fixture',
    'release/unapproved.txt': 'not on the allowlist',
    'samples/private.csv': 'not a release fixture',
  };
  for (const [relative, data] of Object.entries(inputs)) {
    const destination = path.join(sourceRoot, ...relative.split('/'));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, data);
  }
  return { temporary, sourceRoot, inputs };
}

// Independently inspect the ZIP central directory and extract stored entries.
// CRC is computed bit by bit here rather than using the writer's lookup table.
function inspectArchive(archive) {
  const end = archive.length - 22;
  assert.equal(archive.readUInt32LE(end), 0x06054b50, 'valid end-of-directory record');
  assert.equal(archive.readUInt16LE(end + 4), 0);
  assert.equal(archive.readUInt16LE(end + 6), 0);
  assert.equal(archive.readUInt16LE(end + 20), 0, 'no archive comment');
  const count = archive.readUInt16LE(end + 10);
  assert.equal(archive.readUInt16LE(end + 8), count);
  const centralStart = archive.readUInt32LE(end + 16);
  assert.equal(centralStart + archive.readUInt32LE(end + 12), end);
  let cursor = centralStart;
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(archive.readUInt32LE(cursor), 0x02014b50);
    const flags = archive.readUInt16LE(cursor + 8);
    assert.equal(flags, 0x0800);
    assert.equal(archive.readUInt16LE(cursor + 10), 0, 'stored compression method');
    const bytes = archive.readUInt32LE(cursor + 24);
    assert.equal(archive.readUInt32LE(cursor + 20), bytes);
    const nameBytes = archive.readUInt16LE(cursor + 28);
    const extraBytes = archive.readUInt16LE(cursor + 30);
    const commentBytes = archive.readUInt16LE(cursor + 32);
    const name = archive.subarray(cursor + 46, cursor + 46 + nameBytes).toString('utf8');
    assert.ok(name.startsWith(root) && !name.includes('..') && !name.includes('\\'));
    assert.equal(entries.has(name), false, 'unique entry names');
    assert.equal((archive.readUInt32LE(cursor + 38) >>> 16) & 0o170000, 0o100000, 'regular file mode');
    const local = archive.readUInt32LE(cursor + 42);
    assert.equal(archive.readUInt32LE(local), 0x04034b50);
    assert.equal(archive.readUInt16LE(local + 6), flags);
    assert.equal(archive.readUInt16LE(local + 8), 0);
    assert.equal(archive.readUInt32LE(local + 18), bytes);
    assert.equal(archive.readUInt32LE(local + 22), bytes);
    const localNameBytes = archive.readUInt16LE(local + 26);
    const localExtraBytes = archive.readUInt16LE(local + 28);
    assert.equal(archive.subarray(local + 30, local + 30 + localNameBytes).toString('utf8'), name);
    const start = local + 30 + localNameBytes + localExtraBytes;
    assert.ok(start + bytes <= centralStart, 'entry payload stays before central directory');
    const data = archive.subarray(start, start + bytes);
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    assert.equal(archive.readUInt32LE(cursor + 16), crc, `central CRC for ${name}`);
    assert.equal(archive.readUInt32LE(local + 14), crc, `local CRC for ${name}`);
    entries.set(name, data);
    cursor += 46 + nameBytes + extraBytes + commentBytes;
  }
  assert.equal(cursor, end);
  return entries;
}

test('release ZIP independently extracts exact allowed payloads, manifest and checksums', t => {
  const { temporary, sourceRoot, inputs } = fixture(t);
  const result = buildRelease(path.join(temporary, 'out'), { sourceRoot });
  const archive = fs.readFileSync(result.archivePath);
  const entries = inspectArchive(archive);
  assert.deepEqual([...entries.keys()].map(name => name.slice(root.length)).sort(), expected);
  for (const name of expected) {
    assert.deepEqual(entries.get(root + name), fs.readFileSync(path.join(result.packageDir, ...name.split('/'))));
  }
  assert.deepEqual(entries.get(root + 'dist/index.html'), Buffer.from(inputs['dist/index.html']), 'application bytes are not rebuilt or normalized');
  assert.deepEqual(fs.readFileSync(path.join(sourceRoot, 'dist/index.html')), Buffer.from(inputs['dist/index.html']), 'source app remains unchanged');
  const manifest = JSON.parse(entries.get(root + 'manifest.json'));
  assert.equal(manifest.candidateVersion, '0.1.0-beta.1');
  assert.equal(manifest.applicationVersion, '0.1.0');
  assert.equal(manifest.status, 'internal-preview-not-for-sale');
  assert.equal(manifest.files.length, 8);
  for (const entry of manifest.files) {
    const data = entries.get(root + entry.path);
    assert.ok(data, 'manifest references a packaged payload');
    assert.equal(entry.bytes, data.length);
    assert.equal(entry.sha256, sha256(data));
  }
  const checksumLines = entries.get(root + 'SHA256SUMS.txt').toString('utf8').trimEnd().split('\n');
  assert.equal(checksumLines.length, expected.length - 1);
  const checksumPaths = [];
  for (const line of checksumLines) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
    assert.ok(match, 'portable SHA256SUMS line');
    checksumPaths.push(match[2]);
    assert.equal(match[1], sha256(entries.get(root + match[2])));
  }
  assert.deepEqual(checksumPaths.sort(), expected.filter(name => name !== 'SHA256SUMS.txt'));
  assert.equal(result.archiveSha256, sha256(archive));
  assert.equal(archive.includes(Buffer.from('must-not-be-shipped')), false);
  assert.equal(archive.includes(Buffer.from(temporary)), false, 'no runtime path in package');
});

test('release archive is reproducible despite file timestamps and output location', t => {
  const { temporary, sourceRoot } = fixture(t);
  const first = buildRelease(path.join(temporary, 'first'), { sourceRoot });
  fs.utimesSync(path.join(sourceRoot, 'dist/index.html'), new Date('2025-01-01Z'), new Date('2027-02-03Z'));
  const second = buildRelease(path.join(temporary, 'second'), { sourceRoot });
  assert.deepEqual(fs.readFileSync(first.archivePath), fs.readFileSync(second.archivePath));
});

test('existing candidate and protected source outputs are refused without replacing files', t => {
  const { temporary, sourceRoot } = fixture(t);
  const output = path.join(temporary, 'out');
  const first = buildRelease(output, { sourceRoot });
  const original = fs.readFileSync(first.archivePath);
  assert.throws(() => buildRelease(output, { sourceRoot }), /already exists/);
  assert.deepEqual(fs.readFileSync(first.archivePath), original);
  for (const protectedName of ['src', 'dist', 'release', 'samples', 'scripts', 'tests', '.git']) {
    const protectedOutput = path.join(sourceRoot, protectedName, 'new-candidate');
    assert.throws(() => buildRelease(protectedOutput, { sourceRoot }), /protected/);
    assert.equal(fs.existsSync(protectedOutput), false);
  }
});

test('missing inputs and nonregular inputs fail before any candidate is written', t => {
  const { temporary, sourceRoot } = fixture(t);
  const input = path.join(sourceRoot, 'release/help.html');
  fs.unlinkSync(input);
  assert.throws(() => buildRelease(path.join(temporary, 'missing'), { sourceRoot }), /Missing release input: release\/help.html/);
  assert.equal(fs.existsSync(path.join(temporary, 'missing')), false);
  fs.mkdirSync(input);
  assert.throws(() => buildRelease(path.join(temporary, 'directory'), { sourceRoot }), /not a regular file/);
  assert.equal(fs.existsSync(path.join(temporary, 'directory')), false);
});

test('linked input directories and linked output destinations cannot redirect packaging', t => {
  const { temporary, sourceRoot } = fixture(t);
  const original = path.join(sourceRoot, 'release');
  const moved = path.join(temporary, 'moved-release');
  fs.renameSync(original, moved);
  fs.symlinkSync(moved, original, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => buildRelease(path.join(temporary, 'linked-input'), { sourceRoot }), /symbolic links/);
  assert.equal(fs.existsSync(path.join(temporary, 'linked-input')), false);
  fs.unlinkSync(original);
  fs.renameSync(moved, original);
  const linkedOutput = path.join(temporary, 'linked-output');
  fs.symlinkSync(path.join(sourceRoot, 'dist'), linkedOutput, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => buildRelease(path.join(linkedOutput, 'new'), { sourceRoot }), /protected dist/);
  assert.equal(fs.existsSync(path.join(sourceRoot, 'dist', 'new')), false);
});

test('unsafe versions and invalid CLI arguments return clear errors', t => {
  const { temporary, sourceRoot } = fixture(t);
  fs.writeFileSync(path.join(sourceRoot, 'package.json'), '{"version":"../../unsafe"}\n');
  assert.throws(() => buildRelease(path.join(temporary, 'bad-version'), { sourceRoot }), /plain major.minor.patch/);
  assert.equal(fs.existsSync(path.join(temporary, 'bad-version')), false);
  const script = path.resolve(__dirname, '../scripts/build-release.cjs');
  for (const args of [[], ['--output'], ['--unknown', 'anything'], ['--output', '--help']]) {
    const command = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
    assert.equal(command.status, 1);
    assert.match(command.stderr, /Usage: node scripts\/build-release.cjs --output DIR/);
    assert.equal(command.stdout, '');
  }
});
