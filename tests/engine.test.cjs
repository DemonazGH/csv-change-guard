'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('../src/engine.js');
const H = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price'];
const row = (o = {}) => Object.assign({ 'Handle': 'shirt', 'Title': 'Shirt', 'Body (HTML)': 'Soft cotton', 'Vendor': 'Example', 'Option1 Name': 'Size', 'Option1 Value': 'S', 'Variant SKU': 'SKU-1', 'Variant Price': '10.00' }, o);
const csv = (rows = [row()], headers = H) => [headers, ...rows.map(r => headers.map(h => r[h] ?? ''))].map(r => r.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const run = (a = [row()], b = [row()], opts = {}, headers = H) => G.compare(csv(a, headers), csv(b, headers), opts);
const has = (r, code) => r.findings.some(f => f.code === code);

test('unchanged supported data has no findings', () => { const r = run(); assert.equal(r.findings.length, 0); assert.equal(r.stats.comparedVariants, 1); });
test('quoted commas, escaped quotes and multiline fields parse', () => { const s='a,b\r\n"hi, there","line 1\r\nline 2 ""quoted"""\r\n';const r=G.parseCSV(s); assert.equal(r.rows[0].values[1], 'line 1\nline 2 "quoted"'); });
test('UTF-8 BOM and no final newline are supported', () => assert.equal(G.parseCSV('\uFEFFa,b\n1,2').rows[0].values[1], '2'));
test('blank records are counted and skipped', () => { const r=G.parseCSV('a,b\n\n1,2\n,,\n'); assert.equal(r.rows.length,1);assert.equal(r.blankRecords,2); });
test('unclosed quote is rejected', () => assert.throws(() => G.parseCSV('a,b\n1,"abc'), /unclosed/));
test('quote in unquoted field is rejected', () => assert.throws(() => G.parseCSV('a,b\n1,ab"c'), /quote inside/));
test('junk after a closing quote is rejected', () => assert.throws(() => G.parseCSV('a,b\n1,"abc"x'), /closing quote/));
test('wrong row length is rejected', () => assert.throws(() => G.parseCSV('a,b\n1,2,3'), /3 fields/));
test('empty data is rejected', () => assert.throws(() => G.parseCSV('a,b\n'), /no non-empty/));
test('empty file is rejected', () => assert.throws(() => G.parseCSV(''), /empty/));
test('semicolon delimiter is rejected', () => assert.throws(() => G.parseCSV('a;b\n1;2'), /comma-separated/));
test('duplicate column names are rejected', () => assert.throws(() => G.parseCSV('a,a\n1,2'), /duplicate header/));
test('empty header is rejected', () => assert.throws(() => G.parseCSV('a,\n1,2'), /non-empty/));
test('spaced header is rejected rather than normalized', () => assert.throws(() => G.parseCSV('a, b\n1,2'), /whitespace/));
test('NUL content / likely UTF-16 rejected', () => assert.throws(() => G.parseCSV('a,\0b\n1,2'), /NUL/));
test('row limit enforced', () => assert.throws(() => G.parseCSV('a,b\n'+'1,2\n'.repeat(5001)), /5000 data/));
test('column limit enforced', () => assert.throws(() => G.parseCSV(Array(201).fill('x').join(',')), /200 columns/));
test('byte limit enforced', () => assert.throws(() => G.parseCSV('x'.repeat(G.LIMITS.bytes+1)), /10 MiB/));
test('new and legacy headers map to the same semantics', () => {
 const old=csv(); const modern=old.replace('"Handle"','"URL handle"').replace('"Body (HTML)"','"Description"').replace('"Variant SKU"','"SKU"').replace('"Variant Price"','"Price"').replace('"Option1 Name"','"Option1 name"').replace('"Option1 Value"','"Option1 value"');
 assert.equal(G.compare(old, modern).findings.length, 0);
});
test('ambiguous aliases are rejected', () => assert.throws(() => G.compare(csv(),csv([row({'SKU':'X'})],[...H,'SKU'])), /both aliases/));
test('missing SKU header is an explicit prototype limitation', () => assert.throws(() => G.compare(csv(),csv([row()],H.filter(h=>h!=='Variant SKU'))), /tool requirement/));
test('case-sensitive SKU matching does not guess', () => {const r=run(undefined,[row({'Variant SKU':'sku-1'})]);assert.equal(r.stats.comparedVariants,0);assert.ok(has(r,'UPDATE_ROW_UNMATCHED'));});
test('same SKU in different handles is permitted', () => {const rows=[row(),row({'Handle':'pants','Title':'Pants'})];assert.equal(run(rows,rows).stats.comparedVariants,2);});
test('missing SKU is excluded', () => {const r=run(undefined,[row({'Variant SKU':''})]);assert.ok(has(r,'UNMATCHABLE_SKU'));assert.equal(r.stats.comparedVariants,0);});
test('surrounding SKU whitespace is not silently trimmed', () => assert.ok(has(run(undefined,[row({'Variant SKU':' SKU-1'})]),'UNMATCHABLE_SKU')));
test('invalid handle is excluded', () => {const r=run(undefined,[row({'Handle':'bad handle'})]);assert.ok(has(r,'INVALID_HANDLE'));assert.equal(r.stats.comparedVariants,0);});
test('duplicate update keys are not arbitrarily matched', () => {const r=run(undefined,[row(),row()]);assert.ok(has(r,'DUPLICATE_KEY'));assert.equal(r.stats.comparedVariants,0);assert.equal(r.stats.unpairedUpdateRows,2);});
test('duplicate baseline keys are not arbitrarily matched', () => {const r=run([row(),row()]);assert.ok(has(r,'DUPLICATE_KEY'));assert.equal(r.stats.comparedVariants,0);});
test('product continuation blanks are not mistaken for clearing', () => {
 const a=[row(),row({'Title':'','Body (HTML)':'','Vendor':'','Variant SKU':'SKU-2','Option1 Value':'M'})];
 const r=run(a,a);assert.equal(r.findings.length,0);assert.equal(r.stats.comparedVariants,2);
});
test('product changes are reported once per handle', () => {
 const a=[row(),row({'Title':'','Body (HTML)':'','Vendor':'','Variant SKU':'SKU-2','Option1 Value':'M'})];
 const b=a.map(x=>({...x}));b[0]['Body (HTML)']='';const r=run(a,b);assert.equal(r.findings.filter(f=>f.code==='VALUE_CLEARED').length,1);
});
test('conflicting product-level continuation value is excluded', () => {
 const a=[row(),row({'Title':'','Body (HTML)':'','Vendor':'','Variant SKU':'SKU-2','Option1 Value':'M'})];
 const b=a.map(x=>({...x}));b[1]['Vendor']='Conflict';const r=run(a,b);assert.ok(has(r,'PRODUCT_FIELD_CONFLICT'));assert.equal(r.changes.filter(f=>f.field==='Vendor').length,0);
});
test('image-only rows do not create missing-SKU errors', () => {
 const headers=[...H,'Image Src'];const a=[row(),{'Handle':'shirt','Image Src':'https://example.invalid/image.jpg'}];const r=run(a,a,{},headers);assert.equal(r.stats.currentImageRows,1);assert.equal(r.stats.comparedVariants,1);assert.ok(!has(r,'UNMATCHABLE_SKU'));assert.ok(has(r,'IMAGES_NOT_ASSESSED'));
});
test('missing first product title blocks product-level comparison', () => assert.ok(has(run(undefined,[row({'Title':''})]),'PRODUCT_ROW_UNCLEAR')));
test('omitted description column is not a blanked description', () => {const r=G.compare(csv(),csv([row()],H.filter(h=>h!=='Body (HTML)')));assert.ok(has(r,'OMITTED_COLUMNS'));assert.ok(!has(r,'VALUE_CLEARED'));});
test('missing baseline columns are visible in coverage', () => {const r=G.compare(csv([row()],H.filter(h=>h!=='Body (HTML)')),csv());assert.ok(has(r,'MISSING_BASELINE_COLUMNS'));});
test('unsupported columns are explicitly listed', () => {const r=run(undefined,undefined,{},[...H,'Inventory quantity']);assert.ok(has(r,'UNCHECKED_COLUMNS'));assert.deepEqual(r.update.uncheckedColumns,['Inventory quantity']);});
test('missing option dependency is flagged', () => {const hs=H.filter(h=>!h.startsWith('Option1'));const r=run(undefined,undefined,{},hs);assert.ok(has(r,'MISSING_OPTION_DEPENDENCY'));});
test('orphan option name/value flagged', () => assert.ok(has(run(undefined,[row({'Option1 Value':''})]),'OPTION_PAIR_INCOMPLETE')));
test('option value changes are high-priority', () => {const r=run(undefined,[row({'Option1 Value':'XL'})]);assert.equal(r.findings.find(f=>f.code==='OPTION_CHANGED').severity,'high');});
test('absent baseline row is not labelled deletion', () => {const a=[row(),row({'Handle':'pants','Title':'Pants','Variant SKU':'SKU-2'})];const r=run(a,[row()]);const f=r.findings.find(f=>f.code==='CURRENT_ROW_NOT_IN_UPDATE');assert.match(f.message,/not a deletion/);});
test('changed SKU is not paired by row order', () => {const r=run(undefined,[row({'Variant SKU':'NEW','Variant Price':'99'})]);assert.equal(r.stats.priceChanges,0);assert.ok(has(r,'UPDATE_ROW_UNMATCHED'));});
test('disabled overwrite suppresses existing product changes', () => {const r=run(undefined,[row({'Variant Price':'100','Body (HTML)':''})],{overwrite:false});assert.equal(r.stats.comparedVariants,0);assert.equal(r.changes.length,0);assert.equal(r.stats.ignoredExistingUpdateRows,1);});
test('disabled overwrite does not call changed SKU an addition', () => {const r=run(undefined,[row({'Variant SKU':'NEW'})],{overwrite:false});assert.ok(!has(r,'UPDATE_ROW_UNMATCHED'));});
test('disabled overwrite still identifies unknown handles', () => {const r=run(undefined,[row({'Handle':'new'})],{overwrite:false});assert.ok(has(r,'UPDATE_ROW_UNMATCHED'));});
test('price movements above threshold are high', () => assert.ok(has(run(undefined,[row({'Variant Price':'14'})]),'PRICE_THRESHOLD')));
test('threshold boundary uses exact decimal arithmetic', () => {assert.ok(has(run(undefined,[row({'Variant Price':'13.00'})]),'PRICE_THRESHOLD'));assert.ok(!has(run(undefined,[row({'Variant Price':'12.999999'})]),'PRICE_THRESHOLD'));});
test('fractional thresholds are not rounded down into false alerts', () => {
 const threshold=30.000049;
 const r=run([row({'Variant Price':'100'})],[row({'Variant Price':'130.000040'})],{threshold});
 assert.equal(has(r,'PRICE_THRESHOLD'),false);
 assert.equal(r.settings.threshold,threshold);
});
test('fractional increase thresholds distinguish below, equal and above', () => {
 for(const [price,expected] of [['130.000050',false],['130.000051',true],['130.000052',true]]) {
  const r=run([row({'Variant Price':'100'})],[row({'Variant Price':price})],{threshold:30.000051});
  assert.equal(has(r,'PRICE_THRESHOLD'),expected,price);
 }
});
test('fractional decrease thresholds use the same inclusive boundary', () => {
 for(const [price,expected] of [['69.999950',false],['69.999949',true],['69.999948',true]]) {
  const r=run([row({'Variant Price':'100'})],[row({'Variant Price':price})],{threshold:30.000051});
  assert.equal(has(r,'PRICE_THRESHOLD'),expected,price);
 }
});
test('tiny exponent thresholds remain exact with large supported prices', () => {
 for(const [price,expected] of [['100000000001',false],['100000000002',true],['100000000003',true]]) {
  const r=run([row({'Variant Price':'100000000000'})],[row({'Variant Price':price})],{threshold:2e-9});
  assert.equal(has(r,'PRICE_THRESHOLD'),expected,price);
  assert.equal(r.settings.threshold,2e-9);
 }
});
test('the smallest positive numeric threshold remains supported', () => {
 const r=run([row({'Variant Price':'1'})],[row({'Variant Price':'1.000001'})],{threshold:Number.MIN_VALUE});
 assert.ok(has(r,'PRICE_THRESHOLD'));
 assert.equal(r.settings.threshold,Number.MIN_VALUE);
 assert.equal(run(undefined,undefined,{threshold:Number.MIN_VALUE}).findings.length,0);
});
test('zero and maximum thresholds preserve inclusive price comparisons', () => {
 assert.ok(has(run([row({'Variant Price':'1'})],[row({'Variant Price':'1.000001'})],{threshold:0}),'PRICE_THRESHOLD'));
 assert.equal(run(undefined,undefined,{threshold:0}).findings.length,0);
 for(const [price,expected] of [['100.999999',false],['101',true]]) {
  const r=run([row({'Variant Price':'1'})],[row({'Variant Price':price})],{threshold:10000});
  assert.equal(has(r,'PRICE_THRESHOLD'),expected,price);
 }
});
test('price decreases count against absolute threshold', () => {const r=run(undefined,[row({'Variant Price':'1'})]);assert.equal(r.changes.find(f=>f.canonicalField==='price').percentChange,-90);});
test('equivalent monetary formatting is not a price change', () => assert.equal(run(undefined,[row({'Variant Price':'10.0'})]).stats.priceChanges,0));
test('positive price to zero is high priority', () => assert.ok(has(run(undefined,[row({'Variant Price':'0.00'})]),'PRICE_TO_ZERO')));
test('price from zero has no invented percentage', () => {const r=run([row({'Variant Price':'0'})],[row()]);assert.ok(has(r,'PRICE_FROM_ZERO'));assert.equal(r.changes[0].percentChange,null);});
test('negative, currency, scientific and locale prices rejected', () => {for(const value of ['-1','$10','1e3','10,50',' 10','10.1234567']) assert.ok(has(run(undefined,[row({'Variant Price':value})]),'INVALID_PRICE'),value);});
test('blank prices are explicitly flagged', () => assert.ok(has(run(undefined,[row({'Variant Price':''})]),'INVALID_PRICE')));
test('unchanged invalid update price is still flagged', () => {const a=[row({'Variant Price':'bad'})];assert.ok(has(run(a,a),'INVALID_PRICE'));});
test('invalid comparison price is flagged', () => assert.ok(has(run(undefined,[row({'Compare-at price':'bad'})],{},[...H,'Compare-at price']),'INVALID_COMPARE_AT')));
test('discount comparison inconsistency is flagged', () => assert.ok(has(run(undefined,[row({'Compare-at price':'8.00'})],{},[...H,'Compare-at price']),'COMPARE_AT_NOT_HIGHER')));
test('invalid product status is flagged', () => assert.ok(has(run(undefined,[row({'Status':'BAD'})],{},[...H,'Status']),'INVALID_STATUS')));
test('visibility changes are warned', () => {const a=[row({'Status':'active'})],b=[row({'Status':'draft'})];assert.ok(has(run(a,b,{},[...H,'Status']),'VISIBILITY_CHANGED'));});
test('invalid thresholds rejected', () => {for(const threshold of [-1,Infinity,NaN,10001]) assert.throws(()=>run(undefined,undefined,{threshold}),/threshold/);});
test('string overwrite option rejected', () => assert.throws(()=>run(undefined,undefined,{overwrite:'false'}),/true or false/));
test('HTML report escapes untrusted data', () => {const r=run(undefined,[row({'Body (HTML)':'<script>alert(1)</script>'})]);const html=G.reportHTML(r);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));});
test('CSV report neutralizes formula-like cells', () => {
 const r=run(undefined,[row({'Body (HTML)':'=HYPERLINK("evil")'})]);const text=G.findingsCSV(r);assert.ok(text.includes("'=HYPERLINK"));assert.ok(text.includes('""evil""'));assert.ok(!text.includes(',"=HYPERLINK'));
});
test('JSON report preserves original values', () => {const r=run(undefined,[row({'Body (HTML)':'=1+1'})]);assert.equal(JSON.parse(JSON.stringify(r)).changes.find(f=>f.field==='Description').after,'=1+1');});
test('record numbers stay logical for multiline values', () => {const a=[row({'Body (HTML)':'a\nb'}),row({'Handle':'pants','Title':'Pants','Variant SKU':'SKU-2'})];const b=a.map(x=>({...x}));b[1]['Variant Price']='20';const r=run(a,b);assert.equal(r.changes[0].updateRecord,3);});
test('baseline and update arguments remain unchanged', () => {const a=csv(),b=csv([row({'Variant Price':'20'})]);G.compare(a,b);assert.equal(a,csv());});
test('supplied demo has stable expected findings', () => {
 const get=n=>fs.readFileSync(path.join(__dirname,'../samples',n),'utf8');const r=G.compare(get('current-catalog.csv'),get('proposed-update.csv'));
 assert.equal(r.stats.comparedVariants,4);assert.equal(r.stats.priceChanges,4);assert.equal(r.stats.unpairedUpdateRows,4);assert.equal(r.counts.blocking,1);assert.equal(r.counts.high,5);
});
test('5000 matching records complete within prototype scope', () => {
 const rows=Array.from({length:5000},(_,i)=>row({'Handle':'p-'+i,'Title':'Product '+i,'Variant SKU':'SKU-'+i}));const r=run(rows,rows);assert.equal(r.stats.comparedVariants,5000);assert.equal(r.findings.length,0);
});
