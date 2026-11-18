'use strict';
// Informational website only. Never bundle this file with the utility or demo.
(() => {
  const key = 'csv-change-guard.web-analytics';
  const panel = document.getElementById('analytics-choice');
  const allow = document.getElementById('analytics-allow');
  const decline = document.getElementById('analytics-decline');
  const status = document.getElementById('analytics-status');
  const change = document.getElementById('analytics-change');
  if (!panel || !allow || !decline || !status || !change) return;

  let loaded = false;
  let choice = null;
  let storageAvailable = true;
  try { choice = sessionStorage.getItem(key); }
  catch { storageAvailable = false; }

  function render() {
    status.textContent = !storageAvailable
      ? 'Analytics stays off because this browser cannot remember the choice. Downloads still work.'
      : choice === 'granted'
        ? 'Allowed for this browser tab. Choose Decline to withdraw consent and reload this page.'
        : choice === 'denied'
          ? 'Analytics is off. Your choice is remembered for this browser tab.'
          : 'Analytics is off until you allow it. Your choice is remembered for this browser tab.';
    allow.disabled = !storageAvailable || choice === 'granted';
    decline.disabled = !storageAvailable || choice === 'denied';
    change.hidden = false;
  }

  function load() {
    // Local previews, test hosts and Cloudflare preview deployments never send
    // analytics. A tab preference alone is not permission for another host.
    if (loaded || !storageAvailable || choice !== 'granted' ||
        location.protocol !== 'https:' || location.hostname !== 'csv-change-guard.pages.dev') return;
    loaded = true;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    // This is a public ingestion token, not a credential. Cloudflare's mutable
    // vendor tag cannot be version-pinned for SRI. Only this hashed local
    // consent loader can introduce it under the page's strict-dynamic CSP.
    script.setAttribute('data-cf-beacon', JSON.stringify({ token: '44f605835c8a4c93b8ffbf10d122f832' }));
    document.body.append(script);
  }

  function remember(value) {
    try { sessionStorage.setItem(key, value); choice = value; }
    catch { storageAvailable = false; render(); return false; }
    render();
    return true;
  }

  function stopConnections() {
    const stop = document.createElement('meta');
    stop.httpEquiv = 'Content-Security-Policy';
    stop.content = "connect-src 'none'";
    document.head.append(stop);
  }

  function synchronizeChoice() {
    // Back/forward cache can restore an older document and its running vendor
    // tag after another page in this tab withdrew permission. Check before the
    // vendor's lifecycle listeners can send more measurements.
    try { choice = sessionStorage.getItem(key); storageAvailable = true; }
    catch { choice = null; storageAvailable = false; }
    if (loaded && (!storageAvailable || choice !== 'granted')) {
      stopConnections();
      if (storageAvailable) location.reload();
      else {
        render();
        status.textContent = 'Analytics connections stopped for this page. Your choice cannot be read; close this tab before continuing.';
      }
      return;
    }
    render();
    load();
  }

  allow.addEventListener('click', () => {
    if (remember('granted')) load();
  });
  decline.addEventListener('click', () => {
    const wasLoaded = loaded;
    // Stop future beacon connections before reloading without the vendor tag.
    // Requests already sent cannot be recalled. This only tightens the CSP.
    if (wasLoaded) stopConnections();
    if (remember('denied')) {
      if (wasLoaded) location.reload();
    } else if (wasLoaded) {
      // A storage failure must not leave a running beacon while claiming off.
      try { sessionStorage.removeItem(key); } catch { /* unavailable */ }
      status.textContent = 'Analytics connections stopped for this page. Your choice could not be saved; close this tab before continuing.';
    }
  });
  change.addEventListener('click', () => {
    panel.scrollIntoView({ block: 'center' });
    document.getElementById('analytics-title').focus({ preventScroll: true });
  });
  window.addEventListener('pageshow', synchronizeChoice);
  document.addEventListener('visibilitychange', synchronizeChoice);
  render();
  load();
})();
