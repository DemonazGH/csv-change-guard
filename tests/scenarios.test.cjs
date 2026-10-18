'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('../src/engine.js');

const fixture = name => fs.readFileSync(path.join(__dirname, '../samples/scenarios', name), 'utf8');
const catalog = fixture('catalog.csv');
const compare = (name, options = {}) => G.compare(catalog, fixture(name), options);
const findings = (report, code) => report.findings.filter(finding => finding.code === code);
const identities = entries => entries.map(({ handle, sku }) => `${handle}/${sku}`).sort();
const describeChanges = report => report.changes.map(({ handle, sku, canonicalField, before, after, code }) =>
  ({ handle, sku, canonicalField, before, after, code })).sort((a, b) =>
  `${a.handle}/${a.sku}/${a.canonicalField}`.localeCompare(`${b.handle}/${b.sku}/${b.canonicalField}`));
const csv = (headers, rows) => [headers, ...rows].map(row => row.map(value =>
  '"' + String(value ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const description = '<p>Natural linen, "summer" weight.</p>\n<p>Żółty len · 日本語 · café</p>';

test('catalog round trip retains multilingual multiline descriptions and excludes image-only rows', () => {
  const parsed = G.parseCSV(catalog);
  assert.equal(parsed.rows[0].values[parsed.headers.indexOf('Description')], description);
  const report = G.compare(catalog, catalog);
  assert.equal(report.current.records, 7);
  assert.equal(report.current.variants, 6);
  assert.equal(report.stats.comparedVariants, 6);
  assert.equal(report.stats.currentImageRows, 1);
  assert.equal(report.stats.updateImageRows, 1);
  assert.deepEqual(report.changes, []);
  assert.deepEqual(report.findings.map(finding => [finding.code, finding.source]).sort(), [
    ['IMAGES_NOT_ASSESSED', 'current'], ['IMAGES_NOT_ASSESSED', 'update']
  ]);
});

test('partial price updates distinguish omitted columns and absent variants from explicit clearing', () => {
  const report = compare('partial-prices.csv');
  assert.equal(report.stats.comparedVariants, 2);
  assert.equal(report.stats.priceChanges, 2);
  assert.equal(report.stats.currentRowsNotCompared, 4);
  assert.equal(report.stats.unpairedUpdateRows, 0);
  assert.equal(report.counts.blocking, 0);
  assert.deepEqual(describeChanges(report), [
    { handle: 'glazed-mug', sku: 'MUG-BLUE', canonicalField: 'price', before: '12.50', after: '8.75', code: 'PRICE_THRESHOLD' },
    { handle: 'linen-shirt', sku: 'LINEN-M', canonicalField: 'price', before: '30.00', after: '38.999999', code: 'PRICE_CHANGED' }
  ]);
  assert.deepEqual(Object.fromEntries(report.changes.map(change => [change.sku, [change.currentRecord, change.updateRecord, change.percentChange]])), {
    'LINEN-M': [3, 2, 29.99], 'MUG-BLUE': [7, 3, -30]
  });
  assert.deepEqual(findings(report, 'VALUE_CLEARED'), []);
  const omitted = findings(report, 'OMITTED_COLUMNS');
  assert.equal(omitted.length, 1);
  assert.deepEqual(omitted[0].after.split(', '), ['Description', 'Vendor', 'Type', 'Tags', 'Status', 'Published on online store', 'Compare-at price']);
  assert.match(omitted[0].message, /not blank cells/);
  const absent = findings(report, 'CURRENT_ROW_NOT_IN_UPDATE');
  assert.deepEqual(identities(absent), ['glazed-mug/MUG-RED', 'linen-shirt/LINEN-L', 'linen-shirt/LINEN-S', 'tea-tin/TEA-TIN']);
  for (const finding of absent) {
    assert.equal(finding.severity, 'info');
    assert.match(finding.message, /not a deletion prediction/);
  }

  // An unchanged partial export still has coverage findings. Remove image
  // columns here to isolate the informational omitted-row/column coverage.
  const full = G.parseCSV(catalog);
  const priceColumn = full.headers.indexOf('Price');
  const skuColumn = full.headers.indexOf('SKU');
  const variantRows = full.rows.filter(row => row.values[skuColumn] !== '');
  const imageHeaders = new Set(['Product image URL', 'Image position', 'Image alt text']);
  const positions = full.headers.map((header, index) => imageHeaders.has(header) ? -1 : index).filter(index => index !== -1);
  const baselineWithoutImages = csv(positions.map(index => full.headers[index]), variantRows.map(row => positions.map(index => row.values[index])));
  const partial = G.parseCSV(fixture('partial-prices.csv'));
  const unchangedRows = partial.rows.map(row => {
    const values = [...row.values];
    const before = variantRows.find(candidate => candidate.values[skuColumn] === values[partial.headers.indexOf('SKU')]);
    values[partial.headers.indexOf('Price')] = before.values[priceColumn];
    return values;
  });
  const unchanged = G.compare(baselineWithoutImages, csv(partial.headers, unchangedRows));
  assert.deepEqual(unchanged.changes, []);
  assert.ok(unchanged.findings.length > 0);
  assert.ok(unchanged.findings.every(finding => finding.severity === 'info'));
  assert.doesNotMatch(unchanged.verdict, /No findings/i);
});

test('explicit product and compare-at blanks report only intended clearing, once per product field', () => {
  const report = compare('explicit-clears.csv');
  assert.equal(report.stats.comparedVariants, 6);
  assert.equal(report.stats.priceChanges, 0);
  assert.equal(report.counts.blocking, 0);
  assert.deepEqual(describeChanges(report), [
    { handle: 'glazed-mug', sku: 'MUG-RED', canonicalField: 'vendor', before: 'Synthetic Studio', after: '', code: 'VALUE_CLEARED' },
    { handle: 'linen-shirt', sku: 'LINEN-S', canonicalField: 'description', before: description, after: '', code: 'VALUE_CLEARED' },
    { handle: 'tea-tin', sku: 'TEA-TIN', canonicalField: 'compareAt', before: '15.00', after: '', code: 'VALUE_CLEARED' }
  ]);
  assert.equal(findings(report, 'VALUE_CLEARED').length, 3);
  assert.deepEqual(findings(report, 'CURRENT_ROW_NOT_IN_UPDATE'), []);
});

test('reordered products and variants preserve exact matching when product fields move to the first row', () => {
  const report = compare('reordered.csv');
  assert.equal(report.stats.comparedVariants, 6);
  assert.equal(report.stats.unpairedUpdateRows, 0);
  assert.equal(report.stats.currentRowsNotCompared, 0);
  assert.equal(report.counts.blocking, 0);
  assert.deepEqual(report.changes, []);
  assert.ok(report.findings.every(finding => finding.code === 'IMAGES_NOT_ASSESSED'));

  // A product edit still belongs to the product even when its leading variant changed.
  const changedText = fixture('reordered.csv').replace('Natural linen, ""summer"" weight.', 'Natural linen, ""winter"" weight.');
  const changed = G.compare(catalog, changedText);
  assert.equal(changed.changes.length, 1);
  const change = changed.changes[0];
  assert.equal(change.handle, 'linen-shirt');
  assert.equal(change.canonicalField, 'description');
  assert.equal(change.before, description);
  assert.equal(change.after, description.replace('summer', 'winter'));
  assert.equal(change.currentRecord, 2);
  assert.equal(change.updateRecord, 5);
});

test('changed handles and SKUs stay unpaired even when positions and other values resemble baseline rows', () => {
  const report = compare('changed-identifiers.csv');
  assert.equal(report.stats.comparedVariants, 3);
  assert.equal(report.stats.unpairedUpdateRows, 3);
  assert.equal(report.stats.currentRowsNotCompared, 3);
  assert.equal(report.stats.priceChanges, 0);
  assert.deepEqual(report.changes, []);
  assert.deepEqual(identities(findings(report, 'UPDATE_ROW_UNMATCHED')), ['glazed-mug-v2/MUG-BLUE', 'glazed-mug-v2/MUG-RED', 'linen-shirt/LINEN-S-V2']);
  assert.deepEqual(identities(findings(report, 'CURRENT_ROW_NOT_IN_UPDATE')), ['glazed-mug/MUG-BLUE', 'glazed-mug/MUG-RED', 'linen-shirt/LINEN-S']);
  for (const finding of findings(report, 'UPDATE_ROW_UNMATCHED')) assert.equal(finding.severity, 'warning');
});

test('missing and whitespace identifiers expose excluded records without guessed price changes', () => {
  const report = compare('invalid-identifiers.csv');
  assert.equal(report.stats.comparedVariants, 2);
  // Two unusable SKUs and two unusable handles all leave update rows unpaired.
  assert.equal(report.stats.unpairedUpdateRows, 4);
  assert.equal(report.stats.currentRowsNotCompared, 4);
  assert.equal(report.stats.invalidRecords, 2);
  assert.equal(report.update.invalidRecords, 2);
  assert.equal(report.stats.priceChanges, 0);
  assert.deepEqual(report.changes, []);
  assert.deepEqual(findings(report, 'UNMATCHABLE_SKU').map(finding => [finding.updateRecord, finding.sku]), [[3, ''], [4, ' LINEN-L ']]);
  assert.deepEqual(findings(report, 'INVALID_HANDLE').map(finding => finding.updateRecord).sort(), [7, 8]);
  assert.equal(report.counts.blocking, 4);
  assert.match(report.verdict, /Incomplete comparison/);
});

test('duplicate update keys exclude both candidate prices while valid variants remain compared', () => {
  const report = compare('duplicate-identifiers.csv');
  assert.equal(report.stats.comparedVariants, 5);
  assert.equal(report.stats.unpairedUpdateRows, 2);
  assert.equal(report.stats.currentRowsNotCompared, 1);
  assert.equal(report.stats.priceChanges, 0);
  assert.deepEqual(report.changes, []);
  const duplicates = findings(report, 'DUPLICATE_KEY');
  assert.deepEqual(identities(duplicates), ['linen-shirt/LINEN-M']);
  assert.equal(duplicates[0].source, 'update');
  assert.equal(duplicates[0].severity, 'blocking');
  assert.match(duplicates[0].message, /records 3, 9/);
  assert.deepEqual(findings(report, 'CURRENT_ROW_NOT_IN_UPDATE'), []);
  assert.match(report.verdict, /Incomplete comparison/);
});

test('duplicate baseline keys cannot supply an arbitrary before price', () => {
  const report = G.compare(fixture('duplicate-identifiers.csv'), catalog);
  assert.equal(report.stats.comparedVariants, 5);
  assert.equal(report.stats.unpairedUpdateRows, 1);
  assert.equal(report.stats.currentRowsNotCompared, 2);
  assert.equal(report.stats.priceChanges, 0);
  assert.deepEqual(report.changes, []);
  const duplicates = findings(report, 'DUPLICATE_KEY');
  assert.deepEqual(identities(duplicates), ['linen-shirt/LINEN-M']);
  assert.equal(duplicates[0].source, 'current');
  assert.match(report.verdict, /Incomplete comparison/);
});

test('mixed supported header aliases preserve comparison while inventory remains explicitly unassessed', () => {
  const report = compare('mixed-header-prices.csv');
  assert.equal(report.stats.comparedVariants, 6);
  assert.equal(report.counts.blocking, 0);
  assert.deepEqual(describeChanges(report), [
    { handle: 'linen-shirt', sku: 'LINEN-L', canonicalField: 'price', before: '30.00', after: '39.00', code: 'PRICE_THRESHOLD' }
  ]);
  assert.deepEqual(report.update.uncheckedColumns, ['Inventory quantity']);
  assert.equal(report.update.recognizedHeaders.sku, 'Variant SKU');
  assert.equal(report.update.recognizedHeaders.price, 'Price');
  assert.equal(report.update.recognizedHeaders.description, 'Body (HTML)');
  assert.equal(findings(report, 'UNCHECKED_COLUMNS').length, 1);
  assert.equal(findings(report, 'UNCHECKED_COLUMNS')[0].source, 'update');
  assert.deepEqual(findings(report, 'OMITTED_COLUMNS'), []);
  assert.deepEqual(findings(report, 'MISSING_BASELINE_COLUMNS'), []);
});

test('conflicting continuation fields stay unassessed while an independent price change remains visible', () => {
  const parsed = G.parseCSV(catalog);
  const rows = parsed.rows.map(row => [...row.values]);
  rows[0][parsed.headers.indexOf('Vendor')] = 'Proposed vendor';
  rows[1][parsed.headers.indexOf('Vendor')] = 'Conflicting vendor';
  rows[1][parsed.headers.indexOf('Price')] = '39.00';
  const report = G.compare(catalog, csv(parsed.headers, rows));
  assert.equal(report.stats.comparedVariants, 6);
  assert.deepEqual(describeChanges(report), [
    { handle: 'linen-shirt', sku: 'LINEN-M', canonicalField: 'price', before: '30.00', after: '39.00', code: 'PRICE_THRESHOLD' }
  ]);
  const conflicts = findings(report, 'PRODUCT_FIELD_CONFLICT');
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].field, 'Vendor');
  assert.equal(conflicts[0].handle, 'linen-shirt');
  assert.equal(conflicts[0].updateRecord, 3);
  assert.match(report.verdict, /Incomplete comparison/);
});

test('mixed locale, currency, exponent and blank prices remain unassessed while genuine zero prices are explicit', () => {
  const report = compare('unusual-prices.csv');
  assert.equal(report.stats.comparedVariants, 6);
  assert.equal(report.stats.priceChanges, 5);
  assert.deepEqual(identities(findings(report, 'INVALID_PRICE')), ['glazed-mug/MUG-BLUE', 'linen-shirt/LINEN-L', 'linen-shirt/LINEN-M', 'tea-tin/TEA-TIN']);
  assert.deepEqual(identities(findings(report, 'PRICE_NOT_COMPARABLE')), ['glazed-mug/MUG-BLUE', 'linen-shirt/LINEN-L', 'linen-shirt/LINEN-M', 'tea-tin/TEA-TIN']);
  assert.ok(report.changes.filter(change => change.code === 'PRICE_NOT_COMPARABLE').every(change => change.percentChange === null));
  const zero = findings(report, 'PRICE_TO_ZERO');
  assert.equal(zero.length, 1);
  assert.equal(zero[0].sku, 'MUG-RED');
  assert.equal(zero[0].before, '12.50');
  assert.equal(zero[0].after, '0.000000');
  assert.equal(zero[0].percentChange, -100);
  assert.equal(zero[0].severity, 'high');
  assert.ok(report.changes.every(change => change.sku !== 'LINEN-S'), '30.00 and 30.0 are the same price');
  assert.match(report.verdict, /Incomplete comparison/);
});

test('5000-record update keeps exact monetary boundaries and key exclusions with selective changes', () => {
  const headers = ['Handle', 'Title', 'Variant SKU', 'Variant Price', 'Option1 Name', 'Option1 Value'];
  const baseline = Array.from({ length: 5000 }, (_, index) => [
    `synthetic-${Math.floor(index / 2)}`, index % 2 === 0 ? `Synthetic product ${Math.floor(index / 2)}` : '',
    `SYN-${index}`, '100.000001', 'Size', index % 2 === 0 ? 'S' : 'M'
  ]);
  baseline[5][3] = '0';
  baseline[6][3] = '999999999999.999998';
  baseline[7][3] = '0.000003';
  const update = baseline.map(row => [...row]);
  const expectedPrices = [
    ['130.000001', 'PRICE_CHANGED', 29.99],
    ['130.000002', 'PRICE_THRESHOLD', 30],
    ['70.000001', 'PRICE_CHANGED', -29.99],
    ['70.000000', 'PRICE_THRESHOLD', -30],
    ['0', 'PRICE_TO_ZERO', -100],
    ['0.000001', 'PRICE_FROM_ZERO', null],
    ['999999999999.999999', 'PRICE_CHANGED', 0],
    ['0.000004', 'PRICE_THRESHOLD', 33.33]
  ];
  expectedPrices.forEach(([price], index) => { update[index][3] = price; });
  update[4999][2] = 'SYN-4999-RENAMED';
  update[4998][2] = '';
  update[4997][2] = update[4996][2];
  for (let index = 4996; index < 5000; index++) update[index][3] = '1';

  const report = G.compare(csv(headers, baseline), csv(headers, update));
  assert.equal(report.current.records, 5000);
  assert.equal(report.update.records, 5000);
  assert.equal(report.stats.comparedVariants, 4996);
  assert.equal(report.stats.unpairedUpdateRows, 4);
  assert.equal(report.stats.currentRowsNotCompared, 4);
  assert.equal(report.stats.priceChanges, expectedPrices.length);
  assert.equal(report.changes.length, expectedPrices.length);
  expectedPrices.forEach(([after, code, percentChange], index) => {
    const change = report.changes.find(candidate => candidate.sku === `SYN-${index}`);
    assert.ok(change, `Price change for SYN-${index}`);
    assert.equal(change.handle, baseline[index][0]);
    assert.equal(change.before, baseline[index][3]);
    assert.equal(change.after, after);
    assert.equal(change.code, code);
    assert.equal(change.percentChange, percentChange);
    assert.equal(change.currentRecord, index + 2);
    assert.equal(change.updateRecord, index + 2);
  });
  assert.deepEqual(identities(findings(report, 'DUPLICATE_KEY')), ['synthetic-2498/SYN-4996']);
  assert.deepEqual(identities(findings(report, 'UNMATCHABLE_SKU')), ['synthetic-2499/']);
  assert.deepEqual(identities(findings(report, 'UPDATE_ROW_UNMATCHED')), ['synthetic-2499/SYN-4999-RENAMED']);
  assert.deepEqual(identities(findings(report, 'CURRENT_ROW_NOT_IN_UPDATE')), ['synthetic-2498/SYN-4997', 'synthetic-2499/SYN-4998', 'synthetic-2499/SYN-4999']);
  assert.match(report.verdict, /Incomplete comparison/);
});
