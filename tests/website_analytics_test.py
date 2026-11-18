"""Verify consent-scoped website analytics without sending production beacons.

The production hostname is served from the reviewed local website build through
Playwright routes. The Cloudflare script/transport is a local test double, so
these checks prove browser policy and consent boundaries, not vendor ingestion.
Only the ZIP link in the routed HTML is adapted to a controlled loopback server:
Chromium's native download process can bypass Playwright renderer routes. Public
hosts are also DNS-blocked for this test browser, with sandboxing left enabled.
No signed-in profile, customer CSV or real analytics endpoint is used.
"""
import argparse
from datetime import datetime, timezone
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib.metadata import version
import json
import mimetypes
from pathlib import Path
import platform
import re
import shutil
import sys
import threading
from urllib.parse import unquote, urlsplit
from uuid import uuid4
import zipfile

from playwright.sync_api import expect, sync_playwright


ORIGIN = 'https://csv-change-guard.pages.dev'
BEACON = 'https://static.cloudflareinsights.com/beacon.min.js'
TRANSPORT = 'https://cloudflareinsights.com/cdn-cgi/rum'
PREFERENCE = 'csv-change-guard.web-analytics'
# Consent controls are deliberately stable test seams, not visual selectors.
CHOICE = '#analytics-choice'
ALLOW = '#analytics-allow'
DECLINE = '#analytics-decline'
CHANGE = '#analytics-change'
MARKER = 'data-test-analytics-loaded'
PUBLIC_DNS_BLOCK = ('--host-resolver-rules=MAP csv-change-guard.pages.dev ~NOTFOUND, '
                    'MAP static.cloudflareinsights.com ~NOTFOUND, '
                    'MAP cloudflareinsights.com ~NOTFOUND')


def now():
    return datetime.now(timezone.utc).isoformat()


class NativeDownloads:
    """Serve exactly one reviewed local ZIP, never arbitrary local paths."""
    def __init__(self, site):
        archives = list((site / 'downloads').glob('*.zip'))
        assert len(archives) == 1, 'Expected exactly one reviewed website ZIP'
        self.archive = archives[0]
        self.bytes = self.archive.read_bytes()
        self.requests = []
        self.unexpected = []
        fixture = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_GET(self):
                if self.path != '/downloads/' + fixture.archive.name:
                    fixture.unexpected.append(self.path)
                    self.send_error(404)
                    return
                fixture.requests.append(self.path)
                self.send_response(200)
                self.send_header('Content-Type', 'application/zip')
                self.send_header('Content-Length', str(len(fixture.bytes)))
                self.send_header('Content-Disposition', 'attachment; filename="' + fixture.archive.name + '"')
                self.send_header('Cache-Control', 'no-store')
                self.send_header('X-Content-Type-Options', 'nosniff')
                self.end_headers()
                self.wfile.write(fixture.bytes)

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.origin = f'http://127.0.0.1:{self.server.server_port}'
        self.url = self.origin + '/downloads/' + self.archive.name
        self.worker = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.worker.start()

    def close(self):
        self.server.shutdown()
        self.server.server_close()
        self.worker.join()
        assert not self.unexpected, 'Unexpected loopback download path'


class LocalProduction:
    """Resolve only allowlisted built files and locally simulate vendor traffic."""
    def __init__(self, site, downloads, blocked=False):
        self.site = site
        self.downloads = downloads
        self.blocked = blocked
        self.vendor = []
        self.transport = []
        self.unexpected = []
        self.requests = []

    def route(self, route):
        request = route.request
        url = urlsplit(request.url)
        self.requests.append((request.url, request.method))
        if request.url == self.downloads.url and request.method == 'GET':
            # Let the controlled loopback server supply native download bytes.
            # Native downloads may skip this renderer route altogether.
            route.continue_()
            return
        if request.url.split('?')[0] == BEACON:
            self.vendor.append(request.url)
            if self.blocked:
                route.abort()
            else:
                # Fixed test payload: no browser state, identities or CSV data.
                # The marker means the dynamically inserted script executed.
                route.fulfill(status=200, content_type='application/javascript',
                              headers={'Access-Control-Allow-Origin': '*'}, body=f"""
window.addEventListener('pageshow', event => {{
  if (event.persisted) navigator.sendBeacon('{TRANSPORT}', 'synthetic resumed-page probe');
}});
document.addEventListener('visibilitychange', () => {{
  if (document.visibilityState === 'visible') navigator.sendBeacon('{TRANSPORT}', 'synthetic visible-page probe');
}});
fetch('{TRANSPORT}', {{method: 'POST', body: '{{"test":"consent-boundary"}}', credentials: 'omit'}})
  .then(() => document.documentElement.setAttribute('{MARKER}', 'loaded'));
""")
            return
        if request.url.split('?')[0] == TRANSPORT:
            self.transport.append(request.method)
            route.fulfill(status=204, headers={'Access-Control-Allow-Origin': ORIGIN})
            return
        if url.scheme == 'https' and url.netloc == urlsplit(ORIGIN).netloc and request.method == 'GET':
            name = unquote(url.path).lstrip('/') or 'index.html'
            if not Path(name).suffix:
                name += '.html'
            file = (self.site / name).resolve()
            if file.is_relative_to(self.site) and file.is_file():
                body = file.read_bytes()
                if file.name == 'index.html':
                    html = body.decode('utf-8')
                    pattern = r'(<a\b[^>]*\bid="beta-download"\s+href=")([^\"]+)(")'
                    matches = list(re.finditer(pattern, html))
                    assert len(matches) == 1, 'Expected one native ZIP link'
                    assert matches[0].group(2) == 'downloads/' + self.downloads.archive.name
                    html = re.sub(pattern, lambda match: match.group(1) + self.downloads.url + match.group(3), html, count=1)
                    body = html.encode('utf-8')
                headers = {'X-Content-Type-Options': 'nosniff',
                           'Content-Security-Policy': "frame-ancestors 'none'",
                           'Referrer-Policy': 'no-referrer'}
                route.fulfill(status=200, body=body, headers=headers,
                              content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
                return
        self.unexpected.append((request.url, request.method))
        route.abort()


def context_for(browser, site, downloads, **options):
    local = LocalProduction(site, downloads, blocked=options.pop('blocked', False))
    context = browser.new_context(viewport={'width': 1440, 'height': 1000},
                                  accept_downloads=True, **options)
    context.route('**/*', local.route)
    return context, local


def preference(page):
    return page.evaluate('(key) => sessionStorage.getItem(key)', PREFERENCE)


def assert_no_vendor(local, count=0):
    assert len(local.vendor) == count, 'Cloudflare script was requested before valid consent'
    assert not local.unexpected, 'Unreviewed network request: ' + repr(local.unexpected)


def assert_download(page, site, downloads, out, name):
    # Validate the destination before clicking so native download bypasses can
    # never touch the real production ZIP, even if renderer routing changes.
    expect(page.locator('#beta-download')).to_have_attribute('href', downloads.url)
    before = len(downloads.requests)
    page.locator('#beta-download').focus()
    with page.expect_download() as pending:
        page.keyboard.press('Enter')
    download = pending.value
    assert download.url == downloads.url, 'Download escaped the controlled loopback server'
    assert download.failure() is None, 'Free ZIP download failed'
    saved = out / name
    download.save_as(saved)
    expected = site / 'downloads' / download.suggested_filename
    assert saved.read_bytes() == expected.read_bytes(), 'Download differs from reviewed ZIP'
    assert len(downloads.requests) == before + 1, 'Native download was not supplied by the loopback server'
    return hashlib.sha256(saved.read_bytes()).hexdigest()


def check_default_and_decline(browser, site, downloads, out, result):
    context, local = context_for(browser, site, downloads)
    page = context.new_page()
    page.goto(ORIGIN + '/')
    expect(page.locator(CHOICE)).to_be_visible()
    expect(page.locator(ALLOW)).to_be_enabled()
    expect(page.locator(DECLINE)).to_be_enabled()
    assert preference(page) is None
    assert_no_vendor(local)
    result['archive_sha256'] = assert_download(page, site, downloads, out, 'no-choice.zip')
    assert_no_vendor(local)
    page.locator(CHOICE).screenshot(path=str(out / 'default-choice.png'))
    page.locator(DECLINE).click()
    expect(page.locator(DECLINE)).to_be_disabled()
    expect(page.locator('#analytics-status')).to_contain_text('Analytics is off')
    assert preference(page) == 'denied'
    assert page.evaluate('Object.keys(sessionStorage)') == [PREFERENCE]
    page.reload()
    expect(page.locator(DECLINE)).to_be_disabled()
    assert_no_vendor(local)
    page.goto(ORIGIN + '/shopify-csv-price-changes.html')
    expect(page.get_by_role('heading', level=1)).to_be_visible()
    expect(page.locator(DECLINE)).to_be_disabled()
    assert_no_vendor(local)
    page.locator(CHANGE).click()
    expect(page.locator(CHOICE)).to_be_visible()
    expect(page.locator('#analytics-title')).to_be_focused()
    assert_no_vendor(local)
    assert context.cookies() == [], 'Unexpected website cookie'
    assert page.evaluate('localStorage.length') == 0, 'Unexpected persistent storage'
    context.close()
    result['checks'].append('Default/no-choice and decline send no vendor requests; free ZIP works before choosing; denied choice persists across reload/navigation without cookies or localStorage')


def check_grant_and_withdraw(browser, site, downloads, out, result):
    context, local = context_for(browser, site, downloads)
    page = context.new_page()
    page.goto(ORIGIN + '/')
    page.locator(ALLOW).click()
    expect(page.locator(ALLOW)).to_be_disabled()
    expect(page.locator('html')).to_have_attribute(MARKER, 'loaded')
    assert preference(page) == 'granted'
    assert page.evaluate('Object.keys(sessionStorage)') == [PREFERENCE]
    vendor_config = json.loads(page.locator(f'script[src="{BEACON}"]').get_attribute('data-cf-beacon'))
    assert set(vendor_config) == {'token'} and re.fullmatch(r'[0-9a-f]{32}', vendor_config['token'])
    assert len(local.vendor) == 1
    assert local.transport == ['POST'], 'Reviewed test transport is not permitted by CSP'
    for filename in ('shopify-csv-price-changes.html', 'privacy.html'):
        before = len(local.vendor)
        page.goto(ORIGIN + '/' + filename)
        expect(page.locator('html')).to_have_attribute(MARKER, 'loaded')
        expect(page.locator(ALLOW)).to_be_disabled()
        assert len(local.vendor) == before + 1
        assert preference(page) == 'granted'
    page.locator(CHANGE).click()
    expect(page.locator(CHOICE)).to_be_visible()
    page.locator(CHOICE).screenshot(path=str(out / 'change-choice.png'))
    before = len(local.vendor)
    page.locator(DECLINE).click()
    expect(page.locator(DECLINE)).to_be_disabled()
    expect(page.locator('html')).not_to_have_attribute(MARKER, 'loaded')
    assert preference(page) == 'denied'
    assert_no_vendor(local, before)
    page.goto(ORIGIN + '/')
    expect(page.locator(DECLINE)).to_be_disabled()
    assert_no_vendor(local, before)
    assert context.cookies() == []
    assert page.evaluate('localStorage.length') == 0
    context.close()
    result['checks'].append('Explicit grant permits only the three informational pages and stubbed vendor transport; saved session choice is used; withdrawal reloads without vendor and remains denied')


def check_demo_boundary(browser, site, downloads, result):
    context, local = context_for(browser, site, downloads)
    page = context.new_page()
    page.goto(ORIGIN + '/')
    page.locator(ALLOW).click()
    expect(page.locator('html')).to_have_attribute(MARKER, 'loaded')
    before = len(local.vendor)
    page.goto(ORIGIN + '/demo.html')
    expect(page.locator('#demo-run')).to_be_enabled()
    expect(page.locator('script[src="analytics.js"]')).to_have_count(0)
    expect(page.locator(CHOICE)).to_have_count(0)
    page.locator('#demo-run').click()
    expect(page.locator('#demo-findings > li')).to_have_count(15)
    page.locator('#demo-filter-priority').click()
    expect(page.locator('#demo-findings > li')).to_have_count(6)
    page.locator('#demo-reset').click()
    expect(page.locator('#demo-results')).to_be_hidden()
    assert_no_vendor(local, before)
    page.goto(ORIGIN + '/free-beta-terms.html')
    expect(page.locator('script')).to_have_count(0)
    assert_no_vendor(local, before)
    page.goto(ORIGIN + '/demo-report.html')
    expect(page.get_by_text('Findings (15)', exact=True)).to_be_visible()
    expect(page.locator('script')).to_have_count(0)
    assert_no_vendor(local, before)
    context.close()
    result['checks'].append('Existing analytics permission does not add analytics to demo, free-use terms or report; synthetic comparison/filter/reset still works')


def check_withdraw_storage_failure(browser, site, downloads, out, result):
    context, local = context_for(browser, site, downloads)
    page = context.new_page()
    page.goto(ORIGIN + '/')
    page.locator(ALLOW).click()
    expect(page.locator('html')).to_have_attribute(MARKER, 'loaded')
    before = len(local.transport)
    page.evaluate("""(key) => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function(name, value) {
            if (name === key && value === 'denied') throw new Error('Synthetic storage write failure');
            return original.call(this, name, value);
        };
    }""", PREFERENCE)
    page.locator(DECLINE).click()
    expect(page.locator('#analytics-status')).to_contain_text('Analytics connections stopped for this page')
    expect(page.locator('#analytics-status')).to_contain_text('close this tab')
    expect(page.locator(ALLOW)).to_be_disabled()
    expect(page.locator(DECLINE)).to_be_disabled()
    assert preference(page) is None, 'Old granted preference was not removed after write failure'
    assert page.evaluate("""async (url) => {
        try { await fetch(url, {method: 'POST', body: 'synthetic blocked probe'}); return false; }
        catch { return true; }
    }""", TRANSPORT), 'Withdrawal failed to block later analytics connections'
    assert len(local.transport) == before, 'Withdrawal leaked a subsequent transport request'
    assert_no_vendor(local, 1)
    page.locator(CHOICE).screenshot(path=str(out / 'withdraw-storage-failure.png'))
    context.close()
    result['checks'].append('Withdrawal still blocks subsequent analytics connections when saving the denied preference fails; old grant removed and close-tab instruction shown')


def check_lifecycle_resynchronization(browser, site, downloads, out, result):
    # Routing can affect BFCache eligibility. Dispatch the lifecycle events
    # explicitly to test stale-document state without claiming a real restore.
    for event in ('pageshow', 'visibilitychange'):
        context, local = context_for(browser, site, downloads)
        page = context.new_page()
        page.goto(ORIGIN + '/')
        page.locator(ALLOW).click()
        expect(page.locator('html')).to_have_attribute(MARKER, 'loaded')
        before = len(local.transport)
        assert page.evaluate('document.visibilityState') == 'visible'
        page.evaluate("""({key, event}) => {
            sessionStorage.setItem(key, 'denied');
            if (event === 'pageshow') window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
            else document.dispatchEvent(new Event('visibilitychange'));
        }""", {'key': PREFERENCE, 'event': event})
        expect(page.locator('html')).not_to_have_attribute(MARKER, 'loaded')
        expect(page.locator(DECLINE)).to_be_disabled()
        expect(page.locator('#analytics-status')).to_contain_text('Analytics is off')
        assert preference(page) == 'denied'
        assert len(local.transport) == before, 'Stale document sent a vendor lifecycle beacon after withdrawal'
        assert_no_vendor(local, 1)
        context.close()

    context, local = context_for(browser, site, downloads)
    page = context.new_page()
    page.goto(ORIGIN + '/')
    page.locator(ALLOW).click()
    expect(page.locator('html')).to_have_attribute(MARKER, 'loaded')
    before = len(local.transport)
    page.evaluate("""(key) => {
        const original = Storage.prototype.getItem;
        Storage.prototype.getItem = function(name) {
            if (name === key) throw new Error('Synthetic storage read failure after grant');
            return original.call(this, name);
        };
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
    }""", PREFERENCE)
    expect(page.locator('#analytics-status')).to_contain_text('Your choice cannot be read; close this tab')
    expect(page.locator(ALLOW)).to_be_disabled()
    expect(page.locator(DECLINE)).to_be_disabled()
    assert len(local.transport) == before, 'Unreadable consent did not stop the restored vendor lifecycle beacon'
    assert_no_vendor(local, 1)
    page.locator(CHOICE).screenshot(path=str(out / 'lifecycle-storage-read-failure.png'))
    context.close()
    result['lifecycle_test_scope'] = 'Synthetic persisted pageshow and visibilitychange events; full browser BFCache navigation/restore not established'
    result['checks'].append('Simulated stale-page lifecycle events re-read denied consent and reload without vendor; restored unreadable consent stops connections before vendor lifecycle probes')


def check_failure_and_no_javascript(browser, site, downloads, out, result):
    context, local = context_for(browser, site, downloads, blocked=True)
    page = context.new_page()
    page.goto(ORIGIN + '/')
    page.locator(ALLOW).click()
    expect(page.locator(ALLOW)).to_be_disabled()
    assert_download(page, site, downloads, out, 'blocked-beacon.zip')
    assert local.vendor and not local.transport
    assert not local.unexpected
    page.get_by_role('link', name='Take the one-minute tour', exact=True).click()
    expect(page.locator('#demo-tour-start')).to_be_enabled()
    context.close()

    context, local = context_for(browser, site, downloads, java_script_enabled=False)
    page = context.new_page()
    page.goto(ORIGIN + '/')
    expect(page.locator(ALLOW)).to_be_disabled()
    expect(page.locator(DECLINE)).to_be_disabled()
    assert_download(page, site, downloads, out, 'javascript-disabled.zip')
    assert_no_vendor(local)
    context.close()

    context, local = context_for(browser, site, downloads)
    context.add_init_script("Object.defineProperty(window, 'sessionStorage', {get() { throw new Error('Storage unavailable for this synthetic test'); }});")
    page = context.new_page()
    page.goto(ORIGIN + '/')
    expect(page.locator('#analytics-status')).to_contain_text('cannot remember the choice')
    expect(page.locator(ALLOW)).to_be_disabled()
    expect(page.locator(DECLINE)).to_be_disabled()
    assert_download(page, site, downloads, out, 'storage-unavailable.zip')
    assert_no_vendor(local)
    context.close()
    result['checks'].append('Blocked vendor script, JavaScript-disabled browsing and unavailable session storage do not gate the free ZIP; trial navigation remains available')


def check_distinct_local_archive(browser, site, out, result):
    # The first Windows run accidentally matched production ZIP bytes, masking
    # native downloads bypassing renderer routes. A distinct valid local ZIP
    # makes this isolation guarantee testable even when production is identical.
    variant = out / 'synthetic-download-site'
    shutil.copytree(site, variant)
    archive = next((variant / 'downloads').glob('*.zip'))
    with zipfile.ZipFile(archive, 'a') as zipped:
        zipped.comment = b'Synthetic local transport sentinel; never publish this fixture.'
    assert archive.read_bytes() != (site / 'downloads' / archive.name).read_bytes()
    downloads = NativeDownloads(variant)
    try:
        context, local = context_for(browser, variant, downloads)
        page = context.new_page()
        page.goto(ORIGIN + '/')
        expect(page.locator(ALLOW)).to_be_enabled()
        result['synthetic_transport_sha256'] = assert_download(page, variant, downloads, out, 'distinct-local-archive.zip')
        assert_no_vendor(local)
        context.close()
    finally:
        downloads.close()
    result['checks'].append('Native ZIP transport delivered an intentionally distinct valid local archive byte-for-byte; loopback receipt verified with public hosts DNS-blocked')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site-dir', required=True, type=Path)
    parser.add_argument('--browser-executable', required=True, type=Path)
    parser.add_argument('--artifacts-dir', required=True, type=Path)
    args = parser.parse_args()
    if not __debug__:
        parser.error('Run without -O/PYTHONOPTIMIZE so assertions stay enabled.')
    site = args.site_dir.resolve()
    if not (site / 'analytics.js').is_file():
        parser.error('Pass the freshly built analytics-enabled website.')
    run = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid4().hex[:8]
    out = args.artifacts_dir.resolve() / run
    out.mkdir(parents=True, exist_ok=False)
    result = {'status': 'running', 'started_at': now(), 'artifacts': str(out),
              'os': platform.platform(), 'python': platform.python_version(),
              'playwright': version('playwright'), 'checks': [],
              'network_scope': 'Production-origin renderer responses and vendor transport fulfilled locally; public host DNS blocked; real Cloudflare ingestion not tested',
              'download_scope': 'Only the ZIP href in routed HTML is adapted to a controlled loopback server; native bytes and server receipt verified. Unmodified website download covered separately by free_beta_download_test.py.'}
    downloads = NativeDownloads(site)
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=str(args.browser_executable.resolve()),
                                                 headless=True, chromium_sandbox=True,
                                                 args=['--enable-automation', PUBLIC_DNS_BLOCK])
            result['browser_version'] = browser.version
            cdp = browser.new_browser_cdp_session()
            arguments = cdp.send('Browser.getBrowserCommandLine')['arguments']
            forbidden = {'--no-sandbox', '--disable-web-security', '--disable-setuid-sandbox',
                         '--disable-seccomp-filter-sandbox'}
            assert not forbidden.intersection(arg.split('=')[0] for arg in arguments)
            assert PUBLIC_DNS_BLOCK in arguments, 'Public-host DNS isolation flag missing'
            cdp.detach()
            result['sandbox_enabled'] = True
            result['public_hosts_dns_blocked'] = True
            check_default_and_decline(browser, site, downloads, out, result)
            check_grant_and_withdraw(browser, site, downloads, out, result)
            check_demo_boundary(browser, site, downloads, result)
            check_withdraw_storage_failure(browser, site, downloads, out, result)
            check_lifecycle_resynchronization(browser, site, downloads, out, result)
            check_failure_and_no_javascript(browser, site, downloads, out, result)
            check_distinct_local_archive(browser, site, out, result)
            browser.close()
        result['status'] = 'passed'
    except Exception as error:
        result['status'] = 'failed'
        result['error'] = {'type': type(error).__name__, 'message': str(error)}
    finally:
        downloads.close()
        result['finished_at'] = now()
        (out / 'result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, indent=2))
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(main())
