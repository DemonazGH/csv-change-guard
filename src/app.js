(function () {
  'use strict';
  const G = globalThis.ChangeGuard, h = G.escapeHTML, $ = id => document.getElementById(id);
  const state = { current: null, update: null, report: null, filter: 'all', page: 0, busy: false, reads: { current: 0, update: 0 } };
  const PAGE = 40;
  function hideReport() { state.report = null; $('results').hidden = true; $('error').hidden = true; for (const id of ['findings', 'coverage-body', 'verdict']) $(id).replaceChildren(); }
  function sync() { $('compare').disabled = state.busy || !state.current || !state.update; $('demo').disabled = state.busy; }
  function setFile(side, text, name) {
    const parsed = G.parseCSV(text, name); G.normalize(parsed, side);
    state[side] = { text, name };
    $(side + '-name').textContent = name;
    $(side + '-meta').textContent = `${parsed.rows.length.toLocaleString()} data records · ${parsed.headers.length} columns · local only`;
    $(side + '-card').classList.add('loaded');
    $('run-state').textContent = state.current && state.update ? 'Both files ready. Confirm the settings and compare.' : 'Choose the other file to continue.';
    sync();
  }
  function clearSide(side) {
    state[side] = null; $(side + '-file').value = '';
    $(side + '-name').textContent = 'Choose a CSV file';
    $(side + '-meta').textContent = 'UTF-8 · comma-delimited · up to 10 MiB';
    $(side + '-card').classList.remove('loaded');
  }
  function showError(error) { $('error').textContent = error.message || String(error); $('error').hidden = false; $('run-state').textContent = 'The comparison did not complete. Review the message above.'; }
  for (const side of ['current', 'update']) $(side + '-file').addEventListener('change', async event => {
    const file = event.target.files[0], request = ++state.reads[side];
    hideReport(); clearSide(side); sync();
    if (!file) return;
    try {
      if (file.size > G.LIMITS.bytes) throw new Error(`${file.name}: exceeds the 10 MiB prototype limit.`);
      const buffer = await file.arrayBuffer();
      if (request !== state.reads[side]) return;
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
      catch (_) { throw new Error(`${file.name}: not valid UTF-8. Export a UTF-8, comma-delimited CSV and try again.`); }
      setFile(side, text, file.name);
    } catch (e) { if (request === state.reads[side]) { clearSide(side); showError(e); sync(); } }
  });
  function reset() {
    for (const side of ['current', 'update']) { state.reads[side]++; clearSide(side); }
    hideReport(); state.filter = 'all'; state.page = 0; $('search').value = '';
    $('run-state').textContent = 'Choose both files or use the demo to begin.'; sync();
  }
  $('reset').addEventListener('click', reset);
  for (const id of ['threshold', 'overwrite']) $(id).addEventListener('input', () => { hideReport(); $('run-state').textContent = 'Settings changed. Run the comparison again.'; });
  async function run() {
    if (!state.current || !state.update || state.busy) return;
    hideReport(); state.busy = true; sync(); $('reset').disabled = true;
    $('run-state').textContent = 'Comparing locally…';
    await new Promise(resolve => setTimeout(resolve, 25));
    try {
      if ($('threshold').value.trim() === '') throw new Error('Enter a price-change threshold.');
      const report = G.compare(state.current.text, state.update.text, { threshold: Number($('threshold').value), overwrite: $('overwrite').value === 'true', currentName: state.current.name, updateName: state.update.name });
      state.report = report; state.filter = 'all'; state.page = 0; $('search').value = '';
      renderReport(); $('results').hidden = false;
      $('run-state').textContent = `Finished locally. ${report.findings.length} findings. No files were uploaded.`;
      $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { showError(e); }
    finally { state.busy = false; $('reset').disabled = false; sync(); }
  }
  $('compare').addEventListener('click', run);
  $('demo').addEventListener('click', () => {
    reset(); $('threshold').value = '30'; $('overwrite').value = 'true';
    try { setFile('current', ChangeGuardDemo.current, 'demo-current-catalog.csv'); setFile('update', ChangeGuardDemo.update, 'demo-proposed-update.csv'); run(); }
    catch (e) { showError(e); }
  });
  function renderReport() {
    const r = state.report;
    $('verdict').className = 'verdict ' + (r.counts.blocking ? 'blocked' : r.counts.high || r.counts.warning ? '' : 'neutral');
    $('verdict').innerHTML = `<strong>${h(r.verdict)}</strong><small>Blocking findings mean part of the comparison was excluded—not that Shopify will necessarily reject the file. This is not an import approval.</small>`;
    $('metric-compared').textContent = r.stats.comparedVariants.toLocaleString(); $('metric-prices').textContent = r.stats.priceChanges.toLocaleString();
    $('metric-priority').textContent = (r.counts.blocking + r.counts.high).toLocaleString(); $('metric-unpaired').textContent = r.stats.unpairedUpdateRows.toLocaleString();
    $('count-all').textContent = r.findings.length;
    for (const k of ['blocking', 'high', 'warning', 'info']) $('count-' + k).textContent = r.counts[k];
    $('coverage-body').innerHTML = `<p><b>Current:</b> ${h(r.current.name)} · ${r.current.records} data records · ${r.current.variants} variant candidates · ${r.current.imageOnlyRecords} image-only records.</p><p><b>Update:</b> ${h(r.update.name)} · ${r.update.records} data records · ${r.update.variants} variant candidates · ${r.update.imageOnlyRecords} image-only records.</p><p><b>Assumptions:</b> overwrite matching handles ${r.settings.overwrite ? 'enabled' : 'disabled'}; price threshold ${h(r.settings.threshold)}%; same store and currency. ${r.stats.ignoredExistingUpdateRows} existing-handle update records ignored due to the overwrite setting.</p><p><b>Record numbering:</b> header is record 1; quoted multiline values do not create extra records. Files may contain sensitive business data.</p><ul>${r.limitations.map(l => '<li>' + h(l) + '</li>').join('')}</ul><details><summary>Recognized header mappings and unassessed columns</summary><pre>${h(JSON.stringify({ current: r.current.recognizedHeaders, update: r.update.recognizedHeaders, uncheckedCurrent: r.current.uncheckedColumns, uncheckedUpdate: r.update.uncheckedColumns }, null, 2))}</pre></details><p>Rules checked against Shopify documentation on ${h(r.sourceCheckedOn)}. Platform behavior can change.</p>${r.sources.map(s => '<p>' + h(s) + '</p>').join('')}`;
    renderRows();
  }
  const displayValue = v => v === '' || v === null || v === undefined ? '<span class="empty">—</span>' : `<span class="value">${h(String(v).length > 180 ? String(v).slice(0, 180) + '…' : v)}</span>`;
  function renderRows() {
    if (!state.report) return;
    const query = $('search').value.trim().toLowerCase();
    const rows = state.report.findings.filter(f => (state.filter === 'all' || state.filter === f.severity) && (!query || [f.handle, f.sku, f.field, f.code, f.message, f.before, f.after].join(' ').toLowerCase().includes(query)));
    const pages = Math.max(1, Math.ceil(rows.length / PAGE)); state.page = Math.max(0, Math.min(state.page, pages - 1));
    const chunk = rows.slice(state.page * PAGE, (state.page + 1) * PAGE);
    $('findings').innerHTML = chunk.map(f => `<tr><td><span class="pill ${h(f.severity)}">${h(f.severity[0].toUpperCase() + f.severity.slice(1))}</span></td><td>${h(f.handle || 'File-level check')}<span class="sku">${h(f.sku)}</span></td><td><span class="finding-title">${h(f.field)} · ${h(f.code.toLowerCase().replaceAll('_', ' '))}</span><span class="finding-message">${h(f.message)}</span></td><td>${displayValue(f.before)}</td><td>${displayValue(f.after)}${f.percentChange !== null && f.percentChange !== undefined ? '<span class="percent">' + (f.percentChange > 0 ? '+' : '') + h(f.percentChange) + '%</span>' : ''}</td><td><span class="row-ref">Current ${h(f.currentRecord || '—')}<br>Update ${h(f.updateRecord || '—')}</span></td></tr>`).join('') || '<tr><td colspan="6">No findings match this filter. Check coverage before drawing conclusions.</td></tr>';
    $('shown').textContent = rows.length ? `Showing ${state.page * PAGE + 1}–${Math.min((state.page + 1) * PAGE, rows.length)} of ${rows.length} findings · full values in exports` : '0 matching findings';
    $('previous').disabled = state.page === 0; $('next').disabled = state.page >= pages - 1;
    document.querySelectorAll('[data-filter]').forEach(b => { const active = b.dataset.filter === state.filter; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  }
  document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { state.filter = b.dataset.filter; state.page = 0; renderRows(); }));
  $('search').addEventListener('input', () => { state.page = 0; renderRows(); });
  $('previous').addEventListener('click', () => { state.page--; renderRows(); });
  $('next').addEventListener('click', () => { state.page++; renderRows(); });
  function download(text, type, suffix) {
    const blob = new Blob([text], { type }), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `csv-change-guard-report.${suffix}`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('export-html').addEventListener('click', () => { if (state.report) download(G.reportHTML(state.report), 'text/html;charset=utf-8', 'html'); });
  $('export-csv').addEventListener('click', () => { if (state.report) download(G.findingsCSV(state.report), 'text/csv;charset=utf-8', 'csv'); });
  $('export-json').addEventListener('click', () => { if (state.report) download(JSON.stringify(state.report, null, 2), 'application/json;charset=utf-8', 'json'); });
})();
