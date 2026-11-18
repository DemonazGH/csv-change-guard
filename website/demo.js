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
  const tourStart = byId('demo-tour-start');
  const tourPanel = byId('demo-tour-panel');
  const tourStatus = byId('demo-tour-status');
  const tourBack = byId('demo-tour-back');
  const tourNext = byId('demo-tour-next');
  let report = null;
  let priorityOnly = false;
  let tourStep = 0;

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
    tourStep = 0;
    tourPanel.hidden = true;
    tourStart.hidden = false;
    tourStart.textContent = 'Start quick tour';
    tourStatus.textContent = 'Follow three short steps with the supplied synthetic files.';
    byId('demo-tour-content').replaceChildren();
  }

  function renderTour() {
    const content = byId('demo-tour-content');
    content.replaceChildren();
    const title = byId('demo-tour-step-title');
    byId('demo-tour-progress').textContent = 'Step ' + (tourStep + 1) + ' of 3';
    tourBack.disabled = tourStep === 0;
    tourNext.textContent = tourStep === 2 ? 'Finish tour' : 'Next';
    if (tourStep === 0) {
      const lamp = report.findings.find(finding => finding.code === 'PRICE_THRESHOLD' && finding.handle === 'desk-lamp' && finding.sku === 'LAMP-001');
      title.textContent = 'Spot the large price change';
      content.append(node('p', lamp.handle + ' / ' + lamp.sku, 'demo-tour-key'));
      const values = node('dl', undefined, 'demo-tour-values');
      for (const [label, value] of [['Before', lamp.before], ['After', lamp.after], ['Movement', lamp.percentChange + '%']]) {
        const pair = node('div');
        pair.append(node('dt', label), node('dd', value));
        values.append(pair);
      }
      content.append(values);
      content.append(node('p', 'The selected 30% threshold flags movements in either direction. This price drop is a high-priority finding. Decide whether the proposed price is intentional. Currency is not inferred.'));
    } else if (tourStep === 1) {
      const duplicate = report.findings.find(finding => finding.code === 'DUPLICATE_KEY');
      title.textContent = 'Check what could not be compared';
      content.append(node('p', report.verdict, 'demo-tour-verdict'));
      content.append(node('p', 'The proposed update repeats ' + duplicate.handle + ' / ' + duplicate.sku + '. The tool excludes those rows because it cannot choose a reliable match. Their prices are not compared.'));
      content.append(node('p', 'The report compares ' + report.stats.comparedVariants + ' variants and shows ' + report.stats.unpairedUpdateRows + ' unpaired update rows. Review the blocker and unmatched rows before drawing conclusions from the price counts.'));
    } else {
      title.textContent = 'Keep all findings and the coverage';
      const priority = report.counts.blocking + report.counts.high;
      content.append(node('p', 'The full report contains ' + report.findings.length + ' findings, including ' + priority + ' priority findings. Saving includes them all, even if you select the priority filter.'));
      content.append(node('p', 'Save the HTML report, then open the downloaded file in your browser. It includes before/after values, filenames, settings and limitations, and can be read after closing this demo.'));
      const saveTourReport = node('button', 'Save complete report', 'demo-secondary');
      saveTourReport.type = 'button';
      saveTourReport.id = 'demo-tour-save';
      saveTourReport.addEventListener('click', () => saveButton.click());
      content.append(saveTourReport);
      content.append(node('p', 'Images, inventory, taxes, shipping, market prices and metafields are outside comparison coverage. The report supports your review and does not approve an import.'));
    }
    tourPanel.hidden = false;
    tourStart.hidden = true;
    tourStatus.textContent = 'Tour running. Use Next and Back to continue at your own pace.';
    title.focus();
  }

  if (!globalThis.ChangeGuard || !globalThis.ChangeGuardDemo) {
    status.textContent = 'The interactive demo could not load. Open the complete example report instead.';
    return;
  }

  runButton.disabled = false;
  tourStart.disabled = false;
  status.textContent = 'Ready. Both synthetic files are supplied; no files to choose.';
  tourStatus.textContent = 'Follow three short steps with the supplied synthetic files.';

  function runComparison(focusResults) {
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
      if (focusResults) byId('demo-results-title').focus();
    } catch (_) {
      clearResults();
      error.textContent = 'The interactive comparison could not complete. Open the complete example report, or contact support with this error and your browser version. No files or store access are needed.';
      error.hidden = false;
      status.textContent = 'Comparison unavailable. The complete example report is still linked above.';
    } finally {
      runButton.disabled = false;
    }
  }

  runButton.addEventListener('click', () => runComparison(true));

  tourStart.addEventListener('click', () => {
    runComparison(false);
    if (report) renderTour();
  });
  tourBack.addEventListener('click', () => {
    tourStep -= 1;
    renderTour();
  });
  tourNext.addEventListener('click', () => {
    if (tourStep < 2) {
      tourStep += 1;
      renderTour();
      return;
    }
    tourPanel.hidden = true;
    tourStart.hidden = false;
    tourStart.textContent = 'Restart quick tour';
    tourStatus.textContent = 'Quick tour complete. Explore the full findings below or read the price-change guide.';
    tourStart.focus();
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
