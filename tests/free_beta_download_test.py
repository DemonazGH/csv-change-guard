"""Download the public free-beta ZIP, then use its extracted app locally.

Optional Python/Playwright verification against a built website and an installed
sandboxed Chrome or Edge. Uses synthetic bundled CSVs and a temporary loopback
HTTP server only; no signed-in profile, account service or merchant file.
"""
import argparse
from datetime import datetime, timezone
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from importlib.metadata import version
import json
from pathlib import Path
import platform
import re
import stat
import sys
import threading
from urllib.parse import urlsplit
from uuid import uuid4
import zipfile

from playwright.sync_api import expect, sync_playwright

from beta_preview_test import EXPECTED, check_links, check_package

REPO = Path(__file__).resolve().parents[1]
ARCHIVE_NAME = 'csv-change-guard-0.1.0-beta.2.zip'
INCOMPLETE = 'Incomplete comparison — blockers need review'


def now():
    return datetime.now(timezone.utc).isoformat()


def sha(data):
    return hashlib.sha256(data).hexdigest()


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def extract_reviewed_archive(archive, out):
    """Extract exact reviewed regular files only, without extractall traversal."""
    package = out / 'CSV-Change-Guard'
    with zipfile.ZipFile(archive) as zipped:
        assert zipped.testzip() is None, 'ZIP CRC failure'
        entries = zipped.infolist()
        expected_names = {'CSV-Change-Guard/' + name for name in EXPECTED}
        assert len(entries) == len(expected_names), 'Duplicate/unexpected ZIP entry count'
        assert {entry.filename for entry in entries} == expected_names, 'Unexpected ZIP membership'
        for entry in entries:
            mode = entry.external_attr >> 16
            assert not stat.S_ISLNK(mode), 'Linked ZIP entry'
            target = out.joinpath(*entry.filename.split('/')).resolve()
            assert target.is_relative_to(out) and not entry.is_dir(), 'Unsafe ZIP destination'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(zipped.read(entry))
    return package


def observe_local_page(page, errors, http):
    page.on('pageerror', lambda _: errors.append('JavaScript page error'))
    page.on('console', lambda message: errors.append('Console error')
            if message.type == 'error' else None)
    page.on('request', lambda request: http.append(request.method)
            if urlsplit(request.url).scheme in ('http', 'https') else None)


def assert_results(page, compared, prices, priority, unpaired, findings, verdict):
    expect(page.locator('#results')).to_be_visible()
    for selector, value in [('metric-compared', compared), ('metric-prices', prices),
                            ('metric-priority', priority), ('metric-unpaired', unpaired),
                            ('count-all', findings)]:
        expect(page.locator('#' + selector)).to_have_text(str(value))
    expect(page.locator('#verdict strong')).to_have_text(verdict)


def clear_files(page):
    page.locator('#reset').click()
    expect(page.locator('#current-name')).to_have_text('Choose a CSV file')
    expect(page.locator('#update-name')).to_have_text('Choose a CSV file')
    expect(page.locator('#current-file')).to_have_value('')
    expect(page.locator('#update-file')).to_have_value('')
    expect(page.locator('#results')).to_be_hidden()
    expect(page.locator('#findings')).to_be_empty()
    expect(page.locator('#coverage-body')).to_be_empty()
    expect(page.locator('#error')).to_be_hidden()
    expect(page.locator('#error')).to_be_empty()
    expect(page.locator('#compare')).to_be_disabled()


def select_samples(page, package, update_name):
    page.locator('#current-file').set_input_files(str(package / 'samples/current-catalog.csv'))
    page.locator('#update-file').set_input_files(str(package / 'samples' / update_name))
    expect(page.locator('#current-name')).to_have_text('current-catalog.csv')
    expect(page.locator('#update-name')).to_have_text(update_name)
    expect(page.locator('#threshold')).to_have_value('30')
    expect(page.locator('#overwrite')).to_have_value('true')
    expect(page.locator('#compare')).to_be_enabled()
    page.locator('#compare').click()


def check_download(browser, base, site, out, result):
    # The download and terms must be usable without JavaScript or a signup gate.
    context = browser.new_context(viewport={'width': 1440, 'height': 1000},
                                  accept_downloads=True, java_script_enabled=False)
    page = context.new_page()
    errors, requests = [], []
    page.on('pageerror', lambda _: errors.append('Website page error'))
    page.on('request', lambda request: requests.append((request.url, request.method)))
    page.goto(base)
    link = page.locator('#beta-download')
    expect(link).to_have_attribute('href', 'downloads/' + ARCHIVE_NAME)
    expect(link).to_have_attribute('download', re.compile('.*'))
    assert page.locator('input, form, iframe').count() == 0, 'Unexpected signup/submission surface'
    page.locator('.download-checksum summary').click()
    expect(page.locator('#beta-sha256')).to_be_visible()
    displayed_hash = page.locator('#beta-sha256').inner_text().strip()
    assert re.fullmatch(r'[0-9a-f]{64}', displayed_hash), 'Missing displayed SHA-256'
    page.screenshot(path=str(out / 'home-desktop.png'), full_page=True)
    page.set_viewport_size({'width': 390, 'height': 1000})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Narrow home overflows'
    page.screenshot(path=str(out / 'home-mobile.png'), full_page=True)
    page.set_viewport_size({'width': 1440, 'height': 1000})
    link.focus()
    expect(link).to_be_focused()
    with page.expect_download() as pending:
        page.keyboard.press('Enter')
    download = pending.value
    assert download.suggested_filename == ARCHIVE_NAME, 'Unexpected download filename'
    assert download.failure() is None, 'ZIP delivery failed'
    archive = out / ARCHIVE_NAME
    download.save_as(archive)
    digest = sha(archive.read_bytes())
    assert digest == displayed_hash, 'Displayed ZIP hash differs from downloaded bytes'
    assert archive.read_bytes() == (site / 'downloads' / ARCHIVE_NAME).read_bytes(), 'Delivered ZIP differs from site build'
    response = context.request.get(base + 'downloads/SHA256SUMS.txt')
    assert response.status == 200, 'Checksum delivery failed'
    assert response.text() == f'{digest}  {ARCHIVE_NAME}\n', 'Published checksum differs'
    page.locator('a[href="free-beta-terms.html"]').first.click()
    expect(page.get_by_role('heading', level=1)).to_be_visible()
    expect(page.locator('body')).to_contain_text('0.1.0-beta.2')
    assert page.locator('script, form, input, iframe').count() == 0, 'Terms contain active content'
    for width, name in [(1440, 'desktop'), (390, 'mobile')]:
        page.set_viewport_size({'width': width, 'height': 1000})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Terms overflow'
        page.screenshot(path=str(out / f'terms-{name}.png'), full_page=True)
    unexpected = [(url, method) for url, method in requests
                  if urlsplit(url).netloc != urlsplit(base).netloc or method != 'GET']
    assert not unexpected and not errors, 'Unexpected website request or page error'
    context.close()
    package = extract_reviewed_archive(archive, out)
    result['archive'] = check_package(package, archive)
    assert (package / 'FREE_BETA_TERMS.html').read_bytes() == (site / 'free-beta-terms.html').read_bytes(), 'Website/package terms differ'
    assert (package / 'FREE_BETA_TERMS.html').read_bytes() == (REPO / 'release/free-beta-terms.html').read_bytes(), 'Canonical/package terms differ'
    for name in ('help.html', 'FREE_BETA_TERMS.html'):
        check_links(package / name, package)
    result['checks'].append('JavaScript-disabled native keyboard ZIP download; displayed/published SHA-256; exact safe ZIP extraction, CRC, manifest, checksums and canonical terms passed')
    result['checks'].append('Homepage and terms fit 1440/390px; website page requests were same-origin GETs only')
    return package


def check_extracted_app(browser, package, out, result):
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
    page = context.new_page()
    errors, http = [], []
    observe_local_page(page, errors, http)
    for name in ('help.html', 'FREE_BETA_TERMS.html'):
        page.goto((package / name).as_uri())
        expect(page.get_by_role('heading', level=1)).to_be_visible()
        expect(page.locator('body')).to_contain_text('0.1.0-beta.2')
        assert page.locator('script, form, input, iframe').count() == 0, 'Active packaged help/terms'
    page.goto((package / 'dist/index.html').as_uri())
    expect(page.locator('#current-name')).to_have_text('Choose a CSV file')
    expect(page.locator('#update-name')).to_have_text('Choose a CSV file')
    expect(page.locator('#threshold')).to_have_value('30')
    expect(page.locator('#overwrite')).to_have_value('true')
    expect(page.locator('#compare')).to_be_disabled()
    page.locator('#demo').click()
    assert_results(page, 4, 4, 6, 4, 15, INCOMPLETE)
    page.locator('#results').screenshot(path=str(out / 'extracted-app-demo-results.png'))
    page.locator('[data-filter="high"]').click()
    expect(page.locator('#findings tr')).to_have_count(5)
    with page.expect_download() as pending:
        page.locator('#export-html').click()
    report_download = pending.value
    assert report_download.failure() is None, 'HTML report delivery failed'
    report_file = out / 'downloaded-report.html'
    report_download.save_as(report_file)
    clear_files(page)
    select_samples(page, package, 'proposed-update.csv')
    assert_results(page, 4, 4, 6, 4, 15, INCOMPLETE)
    page.locator('#results').screenshot(path=str(out / 'extracted-app-selected-results.png'))
    clear_files(page)
    assert 'proposed-update.csv' not in page.locator('body').inner_text(), 'Previous filename remains visible'
    page.locator('#workspace').screenshot(path=str(out / 'extracted-app-cleared.png'))
    select_samples(page, package, 'unchanged-update.csv')
    assert_results(page, 7, 0, 0, 0, 2, 'Review findings before any import')
    expect(page.locator('#count-warning')).to_have_text('2')
    expect(page.locator('#findings tr')).to_have_count(2)
    assert not errors and not http, 'Extracted app/help/terms made an HTTP request or browser error'
    context.close()
    result['checks'].append('Extracted help/terms and unchanged app opened with file navigation; built-in demo, real bundled file selection, clearing and unchanged-data expectations passed')
    result['checks'].append('Extracted app/help/terms observed zero HTTP(S) requests and browser errors')

    report_context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    report_page = report_context.new_page()
    report_errors, report_http = [], []
    observe_local_page(report_page, report_errors, report_http)
    report_page.goto(report_file.as_uri())
    expect(report_page.get_by_text('Findings (15)', exact=True)).to_be_visible()
    expect(report_page.locator('tbody tr')).to_have_count(15)
    expect(report_page.get_by_text(INCOMPLETE, exact=True)).to_be_visible()
    text = report_page.locator('body').inner_text()
    for value in ('59.00', '5.90', 'demo-current-catalog.csv', 'demo-proposed-update.csv',
                  '30', 'Images', 'inventory'):
        assert value.lower() in text.lower(), 'Report missing expected values/settings/coverage'
    assert report_page.locator('script, form, iframe').count() == 0, 'Exported report contains active content'
    report_page.screenshot(path=str(out / 'report-reopened.png'), full_page=True)
    assert not report_errors and not report_http, 'Independent report made an HTTP request or browser error'
    result['report_sha256'] = sha(report_file.read_bytes())
    report_context.close()
    result['checks'].append('Filtered-view HTML export retained all 15 findings and expected values/settings/limitations; report reopened after the entire app context closed with zero HTTP(S) requests')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site-dir', required=True, type=Path)
    parser.add_argument('--browser-executable', required=True, type=Path)
    parser.add_argument('--artifacts-dir', required=True, type=Path)
    args = parser.parse_args()
    if not __debug__:
        parser.error('Run without -O or PYTHONOPTIMIZE so assertions remain enabled.')
    site = args.site_dir.resolve()
    if not (site / 'downloads' / ARCHIVE_NAME).is_file():
        parser.error('Build the free-beta website and pass its output directory.')
    run = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid4().hex[:8]
    out = args.artifacts_dir.resolve() / run
    out.mkdir(parents=True, exist_ok=False)
    result = {'status': 'running', 'started_at': now(), 'artifacts_run': run,
              'os': platform.platform(), 'python': platform.python_version(),
              'playwright': version('playwright'), 'browser': args.browser_executable.name,
              'checks': []}
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(site)))
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    base = f'http://127.0.0.1:{server.server_port}/'
    phase = 'sandboxed installed browser launch'
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=str(args.browser_executable.resolve()),
                                                 headless=True, chromium_sandbox=True,
                                                 args=['--enable-automation'])
            result['browser_version'] = browser.version
            cdp = browser.new_browser_cdp_session()
            arguments = cdp.send('Browser.getBrowserCommandLine')['arguments']
            forbidden = {'--no-sandbox', '--disable-web-security', '--disable-setuid-sandbox',
                         '--disable-seccomp-filter-sandbox'}
            assert not forbidden.intersection(arg.split('=')[0] for arg in arguments), 'Security-disabling launch flag'
            cdp.detach()
            result.update(sandbox_enabled=True, no_sandbox_argument=False,
                          disable_web_security_argument=False)
            phase = 'native website download, safe extraction and free-use terms'
            package = check_download(browser, base, site, out, result)
            phase = 'extracted app, sample selection, clearing and independent saved report'
            check_extracted_app(browser, package, out, result)
            browser.close()
        result['status'] = 'passed'
    except Exception as error:
        result['status'] = 'failed'
        result['error'] = {'check': phase, 'type': type(error).__name__,
                           'message': str(error) if isinstance(error, AssertionError)
                           else 'Browser check failed; no browser log or machine path retained.'}
    finally:
        server.shutdown()
        server.server_close()
        worker.join()
        result['finished_at'] = now()
        (out / 'result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, indent=2))
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(main())
