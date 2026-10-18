/* CSV Change Guard 0.1.0 — deterministic, read-only comparison engine.
   No dependencies, network calls, persistence, or probabilistic matching. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChangeGuard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.1.0';
  const LIMITS = Object.freeze({ bytes: 10 * 1024 * 1024, rows: 5000, columns: 200 });
  const FIELDS = {
    handle: ['URL handle', 'Handle'], title: ['Title'],
    description: ['Description', 'Body (HTML)'], vendor: ['Vendor'], type: ['Type'], tags: ['Tags'],
    status: ['Status'], published: ['Published on online store', 'Published'],
    sku: ['SKU', 'Variant SKU'], price: ['Price', 'Variant Price'],
    compareAt: ['Compare-at price', 'Variant Compare At Price'],
    option1Name: ['Option1 name', 'Option1 Name'], option1Value: ['Option1 value', 'Option1 Value'],
    option2Name: ['Option2 name', 'Option2 Name'], option2Value: ['Option2 value', 'Option2 Value'],
    option3Name: ['Option3 name', 'Option3 Name'], option3Value: ['Option3 value', 'Option3 Value'],
    image: ['Product image URL', 'Image Src'], imagePosition: ['Image position', 'Image Position'],
    imageAlt: ['Image alt text', 'Image Alt Text'], variantImage: ['Variant image URL', 'Variant Image']
  };
  const PRODUCT = ['title', 'description', 'vendor', 'type', 'tags', 'status', 'published'];
  const VARIANT = ['sku', 'price', 'compareAt', 'option1Name', 'option1Value', 'option2Name', 'option2Value', 'option3Name', 'option3Value'];
  const OPTIONS = VARIANT.filter(k => k.startsWith('option'));
  const IMAGES = ['image', 'imagePosition', 'imageAlt', 'variantImage'];
  const RANK = { blocking: 0, high: 1, warning: 2, info: 3 };
  const SOURCES = [
    'https://help.shopify.com/en/manual/products/import-export/import-products',
    'https://help.shopify.com/en/manual/products/import-export/using-csv'
  ];
  const label = k => FIELDS[k] ? FIELDS[k][0] : k;
  const keyOf = r => JSON.stringify([r.handle, r.sku]);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const nonblank = s => typeof s === 'string' && s.trim() !== '';
  // The official template uses Active as well as documented lowercase active.
  // Keep raw cells for reports; do not assume arbitrary casing or trim values.
  const equivalent = (k, a, b) => a === b || (k === 'status' &&
    (a === 'Active' ? 'active' : a) === (b === 'Active' ? 'active' : b));

  function fieldValue(file, row, key) {
    if (row[key] !== '' || !/^option[123]Name$/.test(key)) return row[key];
    const product = file.products.get(row.handle);
    // Only an explicit empty continuation name inherits from this file's first
    // product row. Never fill option values, missing columns, or unclear rows.
    return product && row !== product.row && nonblank(product.row[key]) ? product.row[key] : row[key];
  }

  /** Strict comma-delimited CSV parser. Quoted commas/newlines and escaped quotes are supported. */
  function parseCSV(input, name = 'CSV') {
    if (typeof input !== 'string') throw new TypeError('CSV input must be text.');
    if (new TextEncoder().encode(input).length > LIMITS.bytes) throw new Error(`${name}: exceeds the 10 MiB prototype limit.`);
    let text = input.replace(/^\uFEFF/, '');
    if (text.includes('\0')) throw new Error(`${name}: NUL characters found. Use a UTF-8 CSV, not an Excel workbook or UTF-16 file.`);
    const records = [];
    let values = [], value = '', quoted = false, afterQuote = false, line = 1, startLine = 1, touched = false;
    function field() {
      values.push(value); value = ''; afterQuote = false;
      if (values.length > LIMITS.columns) throw new Error(`${name}: more than ${LIMITS.columns} columns.`);
    }
    function record() {
      field(); records.push({ values, line: startLine, record: records.length + 1 });
      if (records.length > LIMITS.rows + 1) throw new Error(`${name}: more than ${LIMITS.rows} data records. Split the file for this prototype.`);
      values = []; touched = false;
    }
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { value += '"'; i++; }
          else { quoted = false; afterQuote = true; }
        } else if (c === '\r' || c === '\n') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          value += '\n'; line++;
        } else value += c;
        continue;
      }
      if (afterQuote && c !== ',' && c !== '\r' && c !== '\n') throw new Error(`${name}: unexpected character after a closing quote at line ${line}.`);
      if (c === '"') {
        if (value !== '') throw new Error(`${name}: quote inside an unquoted field at line ${line}.`);
        quoted = true; touched = true;
      } else if (c === ',') { field(); touched = true; }
      else if (c === '\r' || c === '\n') {
        record(); if (c === '\r' && text[i + 1] === '\n') i++;
        line++; startLine = line;
      } else { value += c; touched = true; }
    }
    if (quoted) throw new Error(`${name}: unclosed quoted field starting in record ${records.length + 1}.`);
    if (touched || values.length || value !== '' || afterQuote) record();
    if (!records.length) throw new Error(`${name}: file is empty.`);
    const headers = records.shift().values;
    if (headers.length < 2) throw new Error(`${name}: expected comma-separated columns. Semicolon and tab delimiters are not supported.`);
    const seen = new Set();
    for (const h of headers) {
      if (!h || h !== h.trim()) throw new Error(`${name}: header names must be non-empty, without leading or trailing whitespace.`);
      if (seen.has(h)) throw new Error(`${name}: duplicate header "${h}".`);
      seen.add(h);
    }
    let blankRecords = 0;
    const rows = [];
    for (const r of records) {
      if (r.values.every(v => v === '')) { blankRecords++; continue; }
      if (r.values.length !== headers.length) throw new Error(`${name}: record ${r.record} (line ${r.line}) has ${r.values.length} fields; expected ${headers.length}.`);
      rows.push(r);
    }
    if (!rows.length) throw new Error(`${name}: no non-empty data records.`);
    return { name, headers, rows, blankRecords };
  }

  function normalize(parsed, side) {
    const map = Object.create(null), used = new Set(), issues = [];
    for (const [key, aliases] of Object.entries(FIELDS)) {
      const found = aliases.filter(a => parsed.headers.includes(a));
      if (found.length > 1) throw new Error(`${parsed.name}: both aliases for ${label(key)} are present (${found.join(', ')}). Keep only one.`);
      if (found.length) { map[key] = parsed.headers.indexOf(found[0]); used.add(found[0]); }
    }
    for (const required of ['handle', 'title', 'sku']) {
      if (!own(map, required)) throw new Error(`${parsed.name}: this prototype requires ${FIELDS[required].join(' or ')}. SKU is a tool requirement, not a universal Shopify requirement.`);
    }
    const unknown = parsed.headers.filter(h => !used.has(h));
    const groups = new Map(), variants = [], images = [], invalid = [];
    const issue = (code, severity, row, field, message) => issues.push({
      code, severity, source: side, handle: row ? row.handle : '', sku: row ? row.sku : '', field,
      before: '', after: '', currentRecord: side === 'current' && row ? row.record : '',
      updateRecord: side === 'update' && row ? row.record : '', message
    });
    for (const sourceRow of parsed.rows) {
      const row = { record: sourceRow.record, line: sourceRow.line };
      for (const key of Object.keys(map)) row[key] = sourceRow.values[map[key]];
      row.handle = row.handle || ''; row.sku = row.sku || '';
      if (!nonblank(row.handle) || row.handle !== row.handle.trim() || /\s/.test(row.handle)) {
        issue('INVALID_HANDLE', 'blocking', row, label('handle'), 'Missing handle or whitespace in handle. This record is excluded; no identifier repair or guessing.');
        invalid.push(row); continue;
      }
      if (!groups.has(row.handle)) groups.set(row.handle, []);
      groups.get(row.handle).push(row);
      // Image-only rows may contain handle and image fields, but nothing else.
      const imageOnly = IMAGES.some(k => nonblank(row[k])) && sourceRow.values.every((v, i) =>
        v === '' || i === map.handle || IMAGES.some(k => map[k] === i));
      if (imageOnly) { images.push(row); row.kind = 'image'; continue; }
      row.kind = 'variant'; variants.push(row);
      if (!nonblank(row.sku) || row.sku !== row.sku.trim()) {
        issue('UNMATCHABLE_SKU', 'blocking', row, label('sku'), 'A non-empty SKU without surrounding whitespace is required for exact matching in this prototype. This row is excluded.');
        row.unmatchable = true;
      }
    }
    const products = new Map();
    for (const [handle, rows] of groups) {
      const first = rows[0];
      if (first.kind === 'image' || !nonblank(first.title)) {
        issue('PRODUCT_ROW_UNCLEAR', 'blocking', first, 'Title', 'The first record for this handle must contain the product title. Product-level comparisons for this handle are excluded.');
      } else {
        const ambiguous = new Set();
        for (const later of rows.slice(1)) for (const k of PRODUCT) {
          if (nonblank(later[k]) && !equivalent(k, later[k], first[k])) {
            if (!ambiguous.has(k)) issue('PRODUCT_FIELD_CONFLICT', 'blocking', later, label(k), 'Conflicting product-level values within this handle. This field is excluded from product-level comparison.');
            ambiguous.add(k);
          }
        }
        products.set(handle, { row: first, ambiguous });
      }
    }
    const index = new Map();
    for (const r of variants) if (!r.unmatchable) {
      const key = keyOf(r); if (!index.has(key)) index.set(key, []); index.get(key).push(r);
    }
    for (const rows of index.values()) if (rows.length > 1) {
      issue('DUPLICATE_KEY', 'blocking', rows[0], 'Handle + SKU', `Repeated handle + SKU at records ${rows.map(r => r.record).join(', ')}. All records with this key are excluded from matching.`);
    }
    if (unknown.length) issue('UNCHECKED_COLUMNS', 'warning', null, 'Coverage', `These columns are not assessed: ${unknown.join(', ')}. No conclusions are made about their changes or dependencies.`);
    if (IMAGES.some(k => own(map, k))) issue('IMAGES_NOT_ASSESSED', 'warning', null, 'Images', `Image content, URLs, ordering and associations are not compared. ${images.length} image-only record(s) excluded from variant matching.`);
    return { ...parsed, side, map, unknown, issues, variants, images, invalid, index, products, groups };
  }

  /** Parse non-negative decimal money exactly; no rounding or locale guessing. */
  function money(raw) {
    if (typeof raw !== 'string' || !/^\d{1,12}(?:\.\d{1,6})?$/.test(raw)) return null;
    const [a, b = ''] = raw.split('.'); return BigInt(a) * 1000000n + BigInt(b.padEnd(6, '0'));
  }
  function truncatedPct(a, b) {
    if (a === 0n) return null;
    const hundredths = (b - a) * 10000n / a;
    const magnitude = hundredths < 0n ? -hundredths : hundredths;
    const fraction = String(magnitude % 100n).padStart(2, '0').replace(/0+$/, '');
    const exact = (hundredths < 0n ? '-' : '') + String(magnitude / 100n) + (fraction ? '.' + fraction : '');
    const numeric = Number(exact);
    // Keep ordinary report values numeric; preserve exact text when a Number
    // would round the displayed percentage within the supported price range.
    return String(numeric) === exact ? numeric : exact;
  }

  function compare(currentText, updateText, options = {}) {
    const threshold = options.threshold === undefined ? 30 : Number(options.threshold);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 10000) throw new Error('Price threshold must be between 0 and 10,000 percent.');
    // Preserve the numeric threshold's decimal value, including exponent notation,
    // as an exact ratio. Rounding it can create false alerts or miss boundary changes.
    const [coefficient, exponent = '0'] = String(threshold).split('e');
    const [integer, fraction = ''] = coefficient.split('.');
    const scale = fraction.length - Number(exponent);
    const thresholdNumerator = BigInt(integer + fraction) * 10n ** BigInt(Math.max(0, -scale));
    const thresholdDenominator = 10n ** BigInt(Math.max(0, scale));
    const settings = { threshold, overwrite: options.overwrite === undefined ? true : options.overwrite };
    if (typeof settings.overwrite !== 'boolean') throw new TypeError('Overwrite setting must be true or false.');
    const current = normalize(parseCSV(currentText, options.currentName || 'Current catalog'), 'current');
    const update = normalize(parseCSV(updateText, options.updateName || 'Proposed update'), 'update');
    const findings = [...current.issues, ...update.issues], changes = [];
    const stats = { currentVariants: current.variants.length, updateVariants: update.variants.length,
      currentImageRows: current.images.length, updateImageRows: update.images.length,
      matchedVariants: 0, comparedVariants: 0, priceChanges: 0, unpairedUpdateRows: update.invalid.length,
      currentRowsNotCompared: 0, ignoredExistingUpdateRows: 0, invalidRecords: current.invalid.length + update.invalid.length };
    function add(code, severity, beforeRow, afterRow, field, before, after, message, pct = null) {
      const r = afterRow || beforeRow || {};
      const f = { code, severity, source: beforeRow && afterRow ? 'comparison' : afterRow ? 'update' : beforeRow ? 'current' : 'coverage',
        handle: r.handle || '', sku: r.sku || '', field, before: before ?? '', after: after ?? '',
        currentRecord: beforeRow ? beforeRow.record : '', updateRecord: afterRow ? afterRow.record : '', percentChange: pct, message };
      findings.push(f); return f;
    }
    if (!settings.overwrite) add('OVERWRITE_DISABLED', 'info', null, null, 'Import setting', '', '', 'Overwrite is assumed disabled. Existing handles are ignored for change comparison; unmatched SKUs within those handles are not treated as additions.');
    if (!own(update.map, 'option1Name') || !own(update.map, 'option1Value')) add('MISSING_OPTION_DEPENDENCY', 'blocking', null, null, 'Option1', '', '', 'SKU data is present without both Option1 name and Option1 value columns. Variant dependencies are incomplete; review Shopify import requirements before proceeding.');
    const assessed = [...PRODUCT, ...VARIANT];
    const omitted = assessed.filter(k => own(current.map, k) && !own(update.map, k));
    if (omitted.length) add('OMITTED_COLUMNS', 'info', null, null, 'Coverage', '', omitted.map(label).join(', '), 'These baseline columns are absent from the update, not blank cells. They are not compared. This does not guarantee preservation where dependencies or defaults apply.');
    const missingBaseline = assessed.filter(k => own(update.map, k) && !own(current.map, k));
    if (missingBaseline.length) add('MISSING_BASELINE_COLUMNS', 'warning', null, null, 'Coverage', missingBaseline.map(label).join(', '), '', 'No baseline values for these update columns. Their before/after differences cannot be assessed.');

    // Validate update values even when they are unchanged. This is not a full importer validator.
    for (const r of update.variants) {
      if (!settings.overwrite && current.groups.has(r.handle)) continue;
      if (own(update.map, 'price') && money(r.price) === null) add('INVALID_PRICE', 'blocking', null, r, 'Price', '', r.price, 'Expected a non-negative decimal with a dot and no currency symbol (up to 6 decimals). A blank price needs explicit review; Shopify documents a zero default.');
      if (own(update.map, 'compareAt') && r.compareAt !== '' && money(r.compareAt) === null) add('INVALID_COMPARE_AT', 'blocking', null, r, 'Compare-at price', '', r.compareAt, 'Expected an empty cell or a non-negative dot-decimal amount.');
      if (money(r.price) !== null && money(r.compareAt) !== null && money(r.compareAt) > 0n && money(r.compareAt) <= money(r.price)) add('COMPARE_AT_NOT_HIGHER', 'warning', null, r, 'Compare-at price', r.price, r.compareAt, 'Compare-at price is not higher than the selling price. Review whether a discount display is intended.');
      for (let n = 1; n <= 3; n++) {
        const nk = `option${n}Name`, vk = `option${n}Value`;
        const name = fieldValue(update, r, nk);
        if (nonblank(name) !== nonblank(r[vk])) add('OPTION_PAIR_INCOMPLETE', 'high', null, r, `Option${n}`, name || '', r[vk] || '', 'Option name and value are not both populated. Blank continuation names use the first product row for this handle; missing option values are not inferred.');
      }
    }
    for (const [handle, p] of update.products) {
      const r = p.row;
      if (!settings.overwrite && current.groups.has(handle)) continue;
      if (own(update.map, 'status') && !['active', 'Active', 'draft', 'archived'].includes(r.status)) add('INVALID_STATUS', 'blocking', null, r, 'Status', '', r.status, 'When the Status column is present, this prototype recognizes active, draft, or archived on the product row, plus Active as used in Shopify\'s official sample. Other spellings need review.');
      if (own(update.map, 'published') && !['true', 'false', 'TRUE', 'FALSE'].includes(r.published)) add('PUBLICATION_REVIEW', 'warning', null, r, label('published'), '', r.published, 'Publication value is blank or not a recognized boolean. Review the import default.');
    }

    function diffField(k, a, b) {
      if (!own(current.map, k) || !own(update.map, k)) return;
      const before = fieldValue(current, a, k), after = fieldValue(update, b, k);
      if (equivalent(k, before, after)) return;
      let severity = 'info', code = 'VALUE_CHANGED', message = 'Value differs between the supplied files. Review whether the change is intentional.', pct = null;
      if (k === 'price') {
        const av = money(before), bv = money(after);
        if (av !== null && bv !== null && av === bv) return;
        stats.priceChanges++;
        if (av === null || bv === null) {
          severity = 'high'; code = 'PRICE_NOT_COMPARABLE'; message = 'At least one price is blank or outside the supported decimal format. Percentage change is not calculated.';
        } else {
          pct = truncatedPct(av, bv); code = 'PRICE_CHANGED';
          const abs = bv > av ? bv - av : av - bv;
          if (bv === 0n && av > 0n) { severity = 'high'; code = 'PRICE_TO_ZERO'; message = 'A previously positive price becomes zero. Confirm this is intentional.'; }
          else if (av === 0n) { severity = 'warning'; code = 'PRICE_FROM_ZERO'; message = 'Price changes from zero; a percentage change is undefined.'; }
          else if (abs * 100n * thresholdDenominator >= av * thresholdNumerator) { severity = 'high'; code = 'PRICE_THRESHOLD'; message = `Absolute price movement meets or exceeds the ${threshold}% review threshold.`; }
          else { message = 'Price changes below the configured review threshold.'; }
        }
      } else if (after === '' && nonblank(before)) {
        severity = 'high'; code = 'VALUE_CLEARED'; message = 'A populated value becomes an explicitly blank cell. Under the overwrite assumption, review clearing/default behavior for this field.';
      }
      if (OPTIONS.includes(k)) { severity = 'high'; code = 'OPTION_CHANGED'; message = k.endsWith('Value') ? 'Option value differs for the same handle + SKU. Shopify warns that changing option values recreates variant IDs and can break dependencies. This is not a prediction that SKU controls Shopify matching.' : 'Option name differs for the same handle + SKU. Review variant structure and import dependencies.'; }
      if (k === 'status' || k === 'published') { severity = 'warning'; code = 'VISIBILITY_CHANGED'; message = 'Product status or online-store publication value changes. Review intended visibility.'; }
      const change = add(code, severity, a, b, label(k), before, after, message, pct);
      changes.push({ ...change, canonicalField: k });
    }

    // Product-level cells belong to the first row; blank continuation cells are not clearing instructions here.
    if (settings.overwrite) for (const [handle, p] of update.products) {
      const baseline = current.products.get(handle);
      if (!baseline) continue;
      for (const k of PRODUCT) if (!p.ambiguous.has(k) && !baseline.ambiguous.has(k)) diffField(k, baseline.row, p.row);
    }
    const comparedKeys = new Set();
    for (const r of update.variants) {
      if (!settings.overwrite && current.groups.has(r.handle)) { stats.ignoredExistingUpdateRows++; continue; }
      const key = keyOf(r), newRows = update.index.get(key), oldRows = current.index.get(key);
      if (r.unmatchable || !newRows || newRows.length !== 1 || (oldRows && oldRows.length !== 1)) { stats.unpairedUpdateRows++; continue; }
      if (!oldRows) {
        stats.unpairedUpdateRows++;
        add('UPDATE_ROW_UNMATCHED', 'warning', null, r, 'Handle + SKU', '', r.sku,
          current.groups.has(r.handle) ? 'No exact baseline match under this handle. Could be a new variant, changed SKU, or incomplete baseline. No before/after comparison or new-variant prediction.' : 'Handle is absent from the supplied baseline. Could be a new product or an incomplete baseline. Live-store existence is unknown.');
        continue;
      }
      const baseline = oldRows[0];
      stats.matchedVariants++; stats.comparedVariants++; comparedKeys.add(key);
      for (const k of VARIANT) if (k !== 'sku') diffField(k, baseline, r);
    }
    if (settings.overwrite) for (const r of current.variants) {
      if (r.unmatchable || comparedKeys.has(keyOf(r))) continue;
      stats.currentRowsNotCompared++;
      if (!update.index.has(keyOf(r))) add('CURRENT_ROW_NOT_IN_UPDATE', 'info', r, null, 'Handle + SKU', r.sku, '', 'No exact match in the update. This is not a deletion prediction. The update may be partial, or a SKU/handle may have changed.');
    }
    findings.sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.handle.localeCompare(b.handle) || String(a.updateRecord).localeCompare(String(b.updateRecord), undefined, { numeric: true }));
    findings.forEach((f, i) => f.id = `CG-${String(i + 1).padStart(4, '0')}`);
    const counts = { blocking: 0, high: 0, warning: 0, info: 0 };
    findings.forEach(f => counts[f.severity]++);
    const fileMeta = f => ({ name: f.name, records: f.rows.length, variants: f.variants.length,
      imageOnlyRecords: f.images.length, blankRecords: f.blankRecords, invalidRecords: f.invalid.length,
      headers: f.headers, recognizedHeaders: Object.fromEntries(Object.keys(f.map).map(k => [k, f.headers[f.map[k]]])), uncheckedColumns: f.unknown });
    return { version: VERSION, createdAt: new Date().toISOString(), settings, stats, counts,
      verdict: counts.blocking ? 'Incomplete comparison — blockers need review' : counts.high || counts.warning ? 'Review findings before any import' : counts.info ? 'Informational findings — review changes and coverage' : 'No findings within this limited rule set',
      current: fileMeta(current), update: fileMeta(update), findings, changes,
      limitations: [
        'Read-only difference report, not a Shopify import simulator or a guarantee of import safety.',
        'Exact, case-sensitive handle + SKU matches only. Shopify does not use this tool’s matching key as an import contract.',
        'Missing or duplicate keys are not guessed; unchanged keys are needed to compare variant values.',
        'Product fields are read from the first record for each handle. Conflicting repeated product fields are excluded.',
        'Blank continuation option names use the first product row for that handle in each file; option values are never inferred. Option-name findings show these effective names.',
        'Status active and the official sample spelling Active are equivalent. Other status capitalization is not established by this rule set.',
        'Images, inventory, shipping, tax, markets, metafields and unrecognized columns are not assessed.',
        'Omitted rows are not labelled as deletions. Missing columns are distinguished from blank cells; dependencies and defaults still require review.',
        'Assumes both inputs represent the same store, currency and comparable snapshot. Currency is not inferred.',
        'No live-store validation, backup creation, import execution, payment processing, AI inference, or server-side storage.'
      ], sourceCheckedOn: '2026-10-18', sources: SOURCES };
  }

  function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function safeCell(value) {
    let s = String(value ?? '');
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function findingsCSV(report) {
    const keys = ['id', 'severity', 'code', 'source', 'handle', 'sku', 'field', 'before', 'after', 'percentChange', 'currentRecord', 'updateRecord', 'message'];
    return '\uFEFF' + [keys.map(safeCell).join(','), ...report.findings.map(f => keys.map(k => safeCell(f[k])).join(','))].join('\r\n') + '\r\n';
  }
  function reportHTML(report) {
    const h = escapeHTML;
    const cell = v => v === '' || v === null || v === undefined ? '<span class="empty">(empty)</span>' : h(v);
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>CSV Change Guard — Report</title><style>body{font:14px/1.55 system-ui,sans-serif;color:#172936;margin:36px auto;max-width:1200px;padding:0 24px}h1{font-size:30px;margin-bottom:6px}h2{margin-top:28px}p,li{max-width:1000px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{text-align:left;border-bottom:1px solid #d9e1e5;padding:10px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#edf2f4}.empty{color:#707d85;font-style:italic}.note{background:#f0f4f5;padding:16px;border-left:4px solid #4c6f80}.blocking,.high{font-weight:bold;color:#982f37}.warning{color:#865200}.meta{color:#526572}@media print{body{margin:0;padding:0}thead{display:table-header}tr{break-inside:avoid}a{color:inherit}}</style></head><body><div class="meta">CSV CHANGE GUARD / READ-ONLY REPORT / v${h(report.version)}</div><h1>${h(report.verdict)}</h1><p>${h(report.createdAt)} · Threshold ${h(report.settings.threshold)}% · Overwrite assumed ${report.settings.overwrite ? 'enabled' : 'disabled'}</p><p><b>Current:</b> ${h(report.current.name)}<br><b>Update:</b> ${h(report.update.name)}</p><div class="note">${report.stats.comparedVariants} compared variants · ${report.stats.priceChanges} price changes · ${report.counts.blocking} blocking findings · ${report.counts.high} high-priority findings · ${report.counts.warning} warnings.<br>Blocking findings mean the comparison is incomplete. This is not a Shopify import approval. Record numbers include the header as record 1; quoted newlines do not create new records.</div><h2>Findings (${report.findings.length})</h2><table><thead><tr><th>Priority / code</th><th>Handle / SKU</th><th>Field / records</th><th>Before</th><th>After</th><th>Explanation</th></tr></thead><tbody>${report.findings.map(f => `<tr><td class="${h(f.severity)}">${h(f.severity.toUpperCase())}<br>${h(f.code)}</td><td>${h(f.handle)}<br>${h(f.sku)}</td><td>${h(f.field)}<br>Current: ${h(f.currentRecord)}<br>Update: ${h(f.updateRecord)}</td><td>${cell(f.before)}</td><td>${cell(f.after)}</td><td>${h(f.message)}${f.percentChange !== null && f.percentChange !== undefined ? '<br>Change: ' + h(f.percentChange) + '%' : ''}</td></tr>`).join('')}</tbody></table><h2>Coverage and limitations</h2><ul>${report.limitations.map(l => '<li>' + h(l) + '</li>').join('')}</ul><p><b>Unchecked current columns:</b> ${h(report.current.uncheckedColumns.join(', ') || 'None outside the explicitly limited scope')}<br><b>Unchecked update columns:</b> ${h(report.update.uncheckedColumns.join(', ') || 'None outside the explicitly limited scope')}</p><h2>Rule references</h2><p>Shopify documentation checked ${h(report.sourceCheckedOn)}. Platform behavior can change.</p><ul>${report.sources.map(s => '<li>' + h(s) + '</li>').join('')}</ul><p class="meta">This report may contain business-sensitive values from the selected files. Store and share it accordingly.</p></body></html>`;
  }
  return { VERSION, LIMITS, FIELDS, parseCSV, normalize, money, compare, findingsCSV, reportHTML, escapeHTML };
});
