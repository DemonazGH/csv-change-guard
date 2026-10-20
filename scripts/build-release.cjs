'use strict';

// Builds an internal review candidate from an explicit allowlist. It never
// rebuilds the app, changes source files, or grants a commercial licence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PACKAGE_ROOT = 'CSV-Change-Guard';
const MAX_ZIP32 = 0xfffffffe; // 0xffffffff is the ZIP64 sentinel.
const INPUTS = Object.freeze([
  ['release/START_HERE.txt', 'START_HERE.txt'],
  ['release/help.html', 'help.html'],
  ['release/DRAFT-NOT-FOR-SALE.txt', 'DRAFT-NOT-FOR-SALE.txt'],
  ['dist/index.html', 'dist/index.html'],
  ['server.cjs', 'server.cjs'],
  ['samples/current-catalog.csv', 'samples/current-catalog.csv'],
  ['samples/proposed-update.csv', 'samples/proposed-update.csv'],
  ['samples/unchanged-update.csv', 'samples/unchanged-update.csv'],
]);
const PROTECTED_DIRS = ['src', 'dist', 'release', 'samples', 'scripts', 'tests', '.git'];
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const pathOrder = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;

function isWithin(candidate, directory) {
  const relative = path.relative(directory, candidate);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

// Resolve an existing ancestor so an output-directory link cannot redirect the
// candidate into one of the protected source directories.
function resolvedDestination(destination) {
  let ancestor = destination;
  const suffix = [];
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error('Cannot resolve the output directory.');
    suffix.unshift(path.basename(ancestor));
    ancestor = parent;
  }
  return path.join(fs.realpathSync(ancestor), ...suffix);
}

function regularInput(sourceRoot, relative) {
  let current = sourceRoot;
  const segments = relative.split('/');
  for (let i = 0; i < segments.length; i++) {
    current = path.join(current, segments[i]);
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) {
      if (error.code === 'ENOENT') throw new Error(`Missing release input: ${relative}. Run npm run build and check the release help files.`);
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Release inputs must not use symbolic links: ${relative}`);
    if (i < segments.length - 1 ? !stat.isDirectory() : !stat.isFile()) {
      throw new Error(`Release input is not a regular file: ${relative}`);
    }
    if (i === segments.length - 1 && stat.size > MAX_ZIP32) throw new Error(`Release input exceeds ZIP32 size: ${relative}`);
  }
  return fs.readFileSync(current);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, byte) => {
  let crc = byte;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// A small, deterministic ZIP writer: stored entries, UTF-8 names, no links,
// comments, extra fields or variable timestamps. Windows Extract All supports it.
function zipStored(entries) {
  if (entries.length >= 0xffff) throw new Error('Too many entries for ZIP32.');
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  let centralSize = 0;
  for (const entry of entries) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(entry.path) || entry.path.split('/').some(part => !part || part === '.' || part === '..')) {
      throw new Error(`Unsafe ZIP entry name: ${entry.path}`);
    }
    const name = Buffer.from(entry.path, 'utf8');
    if (name.length > 0xffff || entry.data.length > MAX_ZIP32) throw new Error('ZIP32 entry limit exceeded.');
    const localLength = 30 + name.length + entry.data.length;
    centralSize += 46 + name.length;
    if (offset + localLength + centralSize + 22 > MAX_ZIP32) throw new Error('ZIP32 archive size limit exceeded.');
    const checksum = crc32(entry.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8; no data descriptor or encryption.
    local.writeUInt16LE(0, 8); // Stored, not compressed.
    local.writeUInt16LE(0, 10); // 00:00:00
    local.writeUInt16LE(33, 12); // 1 January 1980
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, entry.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4); // UNIX creator, ZIP version 2.0.
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE((0o100644 * 0x10000) >>> 0, 38); // Regular file, never a symbolic link.
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += localLength;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function buildRelease(outputDir, { sourceRoot = path.resolve(__dirname, '..') } = {}) {
  if (typeof outputDir !== 'string' || !outputDir.trim()) throw new Error('Provide an output directory with --output DIR.');
  sourceRoot = fs.realpathSync(sourceRoot);
  const outputRoot = path.resolve(outputDir);
  const resolvedOutput = resolvedDestination(outputRoot);
  for (const name of PROTECTED_DIRS) {
    if (isWithin(outputRoot, path.join(sourceRoot, name)) || isWithin(resolvedOutput, path.join(sourceRoot, name))) {
      throw new Error(`Output must stay outside the protected ${name} directory.`);
    }
  }
  const pkg = JSON.parse(regularInput(sourceRoot, 'package.json').toString('utf8'));
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('Application version must be a plain major.minor.patch version.');
  const candidateVersion = `${pkg.version}-beta.1`;
  const candidateDir = path.join(outputRoot, candidateVersion);
  if (fs.existsSync(candidateDir)) throw new Error(`Candidate output already exists: ${candidateDir}. Choose a fresh output directory.`);

  const payload = INPUTS.map(([input, destination]) => ({ path: destination, data: regularInput(sourceRoot, input) }))
    .sort(pathOrder);
  const manifest = {
    schemaVersion: 1,
    candidateVersion,
    applicationVersion: pkg.version,
    status: 'internal-preview-not-for-sale',
    packageRoot: PACKAGE_ROOT,
    files: payload.map(entry => ({ path: entry.path, bytes: entry.data.length, sha256: sha256(entry.data) })),
  };
  const manifestData = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  const checksummed = [...payload, { path: 'manifest.json', data: manifestData }]
    .sort(pathOrder);
  const sums = Buffer.from(checksummed.map(entry => `${sha256(entry.data)}  ${entry.path}\n`).join(''));
  const entries = [...checksummed, { path: 'SHA256SUMS.txt', data: sums }]
    .sort(pathOrder);
  const archive = zipStored(entries.map(entry => ({ path: `${PACKAGE_ROOT}/${entry.path}`, data: entry.data })));

  // Everything is validated before creating the dedicated candidate directory.
  // Existing candidates are never replaced, and no recursive deletion is used.
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.mkdirSync(candidateDir);
  const packageDir = path.join(candidateDir, PACKAGE_ROOT);
  fs.mkdirSync(packageDir);
  for (const entry of entries) {
    const destination = path.join(packageDir, ...entry.path.split('/'));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, entry.data, { flag: 'wx' });
  }
  const archivePath = path.join(candidateDir, `csv-change-guard-${candidateVersion}.zip`);
  fs.writeFileSync(archivePath, archive, { flag: 'wx' });
  return {
    candidateVersion, applicationVersion: pkg.version, candidateDir, packageDir,
    archivePath, manifestPath: path.join(packageDir, 'manifest.json'),
    archiveSha256: sha256(archive),
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  try {
    if (args.length !== 2 || args[0] !== '--output' || !args[1].trim() || args[1].startsWith('--')) {
      throw new Error('Usage: node scripts/build-release.cjs --output DIR\nBuild dist/index.html first with npm run build. Use a fresh output directory; existing candidates are not overwritten.');
    }
    const result = buildRelease(args[1]);
    console.log(`Internal candidate only; not for sale.\n${result.archivePath}\nSHA-256: ${result.archiveSha256}`);
  } catch (error) {
    console.error(`Release packaging failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { buildRelease };
