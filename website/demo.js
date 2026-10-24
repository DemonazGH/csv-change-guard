'use strict';

// This page compares only the two shipped synthetic strings. It has no file
// loader, pasted input, URL-supplied data, storage or network operations.
(() => {
  const byId = id => document.getElementById(id);
  const runButton = byId('demo-run');
  const resetButton = byId('demo-reset');
  const saveButton = byId('demo-save');
  const results = byId('demo-results');
  const status = byId('demo-status');
  const error = byId('demo-error');
  const allFilter = byId('demo-filter-all');
  const priorityFilter = byId('demo-filter-priority');
  let report = null;
  let priorityOnly = false;

  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = String(text);
    if (className) element.className = className;
    return element;
  }

  function valueText(value) {
    return value === '' || value === null || value === undefined ? '(empty)' : String(value);
  }

  function renderFindings() {
    const findings = report.findings.filter(finding => !priorityOnly || finding.severity === 'blocking' || finding.severity === 'high');
    const cards = document.createDocumentFragment();
    for (const finding of findings) {
      const item = node('li', undefined, 'demo-finding demo-finding-' + finding.severity);
      const heading = node('div', undefined, 'demo-finding-heading');
      heading.append(node('span', finding.severity === 'blocking' ? 'Blocking' : finding.severity === 'high' ? 'High priority' : finding.severity === 'warning' ? 'Warning' : 'Info', 'demo-severity demo-severity-' + finding.severity));
      heading.append(node('span', finding.code.toLowerCase().replaceAll('_', ' '), 'demo-finding-code'));
      item.append(heading);
      item.append(node('h4', finding.handle ? finding.handle + (finding.sku ? ' / ' + finding.sku : '') : finding.source === 'current' ? 'Current catalog — coverage' : finding.source === 'update' ? 'Proposed update — coverage' : 'File-level coverage'));
      item.append(node('p', finding.field, 'demo-field'));
      item.append(node('p', finding.message, 'demo-finding-message'));
      const pairs = finding.source === 'comparison' ? [['Before', finding.before], ['After', finding.after]] : [];
      if (finding.source !== 'comparison') {
        if (finding.before !== '' && finding.before !== null && finding.before !== undefined) pairs.push(['Current value', finding.before]);
        if (finding.after !== '' && finding.after !== null && finding.after !== undefined) pairs.push(['Update value', finding.after]);
      }
      if (pairs.length) {
        const values = node('dl', undefined, 'demo-values');
        for (const [label, value] of pairs) {
          const pair = node('div');
          pair.append(node('dt', label), node('dd', valueText(value)));
          values.append(pair);
        }
        item.append(values);
      }
      if (finding.percentChange !== null && finding.percentChange !== undefined) {
        item.append(node('p', 'Price movement: ' + finding.percentChange + '%', 'demo-price-movement'));
      }
      const records = 'Current record ' + (finding.currentRecord || '—') + ' · Update record ' + (finding.updateRecord || '—');
      item.append(node('p', (finding.field ? finding.field + ' · ' : '') + records, 'demo-records'));
      cards.append(item);
    }
    byId('demo-findings').replaceChildren(cards);
    allFilter.setAttribute('aria-pressed', String(!priorityOnly));
    priorityFilter.setAttribute('aria-pressed', String(priorityOnly));
    byId('demo-shown').textContent = 'Showing ' + findings.length + ' of ' + report.findings.length + ' findings.';
  }

  function clearResults() {
    report = null;
    priorityOnly = false;
    results.hidden = true;
    byId('demo-findings').replaceChildren();
    byId('demo-limitations').replaceChildren();
    for (const id of ['demo-verdict', 'demo-shown', 'demo-report-files', 'demo-unchecked', 'demo-rule-date']) byId(id).textContent = '';
    for (const id of ['demo-compared', 'demo-prices', 'demo-priority', 'demo-unpaired', 'demo-total', 'demo-all-count', 'demo-priority-count']) byId(id).textContent = '0';
    allFilter.setAttribute('aria-pressed', 'true');
    priorityFilter.setAttribute('aria-pressed', 'false');
    saveButton.disabled = true;
    resetButton.disabled = true;
    error.hidden = true;
    error.textContent = '';
  }

  if (!globalThis.ChangeGuard || !globalThis.ChangeGuardDemo) {
    status.textContent = 'The interactive demo could not load. Open the complete example report instead.';
    return;
  }

  runButton.disabled = false;
  status.textContent = 'Ready. Both synthetic files are supplied; no files to choose.';

  runButton.addEventListener('click', () => {
    clearResults();
    runButton.disabled = true;
    try {
      report = globalThis.ChangeGuard.compare(globalThis.ChangeGuardDemo.current, globalThis.ChangeGuardDemo.update, {
        threshold: 30,
        overwrite: true,
        currentName: 'demo-current-catalog.csv',
        updateName: 'demo-proposed-update.csv'
      });
      const priority = report.counts.blocking + report.counts.high;
      for (const [id, value] of [
        ['demo-compared', report.stats.comparedVariants],
        ['demo-prices', report.stats.priceChanges],
        ['demo-priority', priority],
        ['demo-unpaired', report.stats.unpairedUpdateRows],
        ['demo-total', report.findings.length],
        ['demo-all-count', report.findings.length],
        ['demo-priority-count', priority]
      ]) byId(id).textContent = String(value);
      byId('demo-verdict').textContent = report.verdict;
      byId('demo-report-files').textContent = 'Current: ' + report.current.name + '. Update: ' + report.update.name + '. Threshold: 30%. Overwrite assumed enabled. Record numbering includes the header as record 1.';
      const limitations = document.createDocumentFragment();
      for (const limitation of report.limitations) limitations.append(node('li', limitation));
      byId('demo-limitations').replaceChildren(limitations);
      byId('demo-unchecked').textContent = 'Unrecognized current columns: ' + (report.current.uncheckedColumns.join(', ') || 'none; documented field coverage is still limited') + '. Unrecognized update columns: ' + (report.update.uncheckedColumns.join(', ') || 'none; documented field coverage is still limited') + '.';
      byId('demo-rule-date').textContent = 'Rules checked against Shopify documentation on ' + report.sourceCheckedOn + '. Platform behavior can change.';
      renderFindings();
      results.hidden = false;
      saveButton.disabled = false;
      resetButton.disabled = false;
      status.textContent = 'Finished locally. ' + report.findings.length + ' synthetic findings. Nothing was uploaded.';
      byId('demo-results-title').focus();
    } catch (_) {
      clearResults();
      error.textContent = 'The interactive comparison could not complete. Open the complete example report, or contact support with this error and your browser version. No files or store access are needed.';
      error.hidden = false;
      status.textContent = 'Comparison unavailable. The complete example report is still linked above.';
    } finally {
      runButton.disabled = false;
    }
  });

  resetButton.addEventListener('click', () => {
    clearResults();
    status.textContent = 'Demo reset. Both synthetic examples remain available. Previously downloaded reports are not deleted.';
    runButton.focus();
  });

  allFilter.addEventListener('click', () => {
    if (!report) return;
    priorityOnly = false;
    renderFindings();
  });
  priorityFilter.addEventListener('click', () => {
    if (!report) return;
    priorityOnly = true;
    renderFindings();
  });

  saveButton.addEventListener('click', () => {
    if (!report) return;
    error.hidden = true;
    error.textContent = '';
    let url;
    let link;
    try {
      const file = new Blob([globalThis.ChangeGuard.reportHTML(report)], { type: 'text/html;charset=utf-8' });
      url = URL.createObjectURL(file);
      link = node('a');
      link.href = url;
      link.download = 'csv-change-guard-synthetic-report.html';
      document.body.append(link);
      link.click();
      status.textContent = 'HTML report download requested. It includes all ' + report.findings.length + ' synthetic findings, regardless of the filter.';
    } catch (_) {
      error.textContent = 'Your browser could not start the report download. You can open the complete example report linked above instead.';
      error.hidden = false;
    } finally {
      if (link) link.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
})();
