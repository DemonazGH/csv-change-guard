"""Optional browser checks; the application does not depend on Python/Playwright.

Install the pinned test requirements, then use --help for navigation options.
Normal localhost navigation is the default. Content mode is always explicit.
"""
import argparse
from datetime import datetime, timezone
from importlib.metadata import version
import json
import os
from pathlib import Path
import platform
import shutil
import sys
import traceback
from urllib.parse import urlsplit, urlunsplit
from urllib.request import url2pathname
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / 'dist/index.html'
EXPECTED_CHECKS = 16


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    navigation = parser.add_mutually_exclusive_group()
    navigation.add_argument(
        '--url', metavar='URL',
        help='Localhost HTTP(S) URL (default: http://127.0.0.1:8080/); start the server separately.')
    navigation.add_argument(
        '--file', nargs='?', const=BUILD.as_uri(), metavar='PATH_OR_URI',
        help='Navigate to a file path or file:// URI (default: dist/index.html).')
    navigation.add_argument(
        '--content', action='store_true',
        help='Explicitly render dist/index.html with set_content; does not verify normal navigation.')
    parser.add_argument(
        '--artifacts-dir', type=Path, default=ROOT / '.local-test-artifacts' / 'browser',
        help='Parent of a fresh per-run output directory (default: .local-test-artifacts/browser).')
    parser.add_argument(
        '--no-sandbox', action='store_true',
        help='Explicitly disable Chromium sandboxing for a constrained, isolated test environment.')
    args = parser.parse_args()
    if not __debug__:
        parser.error('Assertions are required; run Python without -O or PYTHONOPTIMIZE.')
    if args.content:
        args.mode, args.target, args.source = 'content', None, BUILD
    elif args.file is not None:
        args.mode = 'file'
        if args.file.startswith('file:'):
            parts = urlsplit(args.file)
            if parts.scheme != 'file' or parts.netloc not in ('', 'localhost') or parts.query or parts.fragment:
                parser.error('--file requires a local file URI without a query or fragment.')
            args.source = Path(url2pathname(parts.path)).resolve()
        else:
            args.source = Path(args.file).expanduser().resolve()
        args.target = args.source.as_uri()
    else:
        args.mode, args.source = 'url', BUILD
        try:
            parts = urlsplit(args.url or 'http://127.0.0.1:8080/')
            # Validate the port as well as the hostname before contacting anything.
            parts.port
        except ValueError as error:
            parser.error(f'Invalid --url: {error}')
        if (parts.scheme not in ('http', 'https')
                or parts.hostname not in ('localhost', '127.0.0.1', '::1')
                or parts.username is not None or parts.password is not None):
            parser.error('--url must be a localhost HTTP(S) URL without credentials.')
        args.target = urlunsplit((parts.scheme, parts.netloc, parts.path or '/', parts.query, parts.fragment))
    return args


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def write_result(out, result):
    destination = out / 'browser-test-results.json'
    temporary = destination.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    temporary.replace(destination)


def hold_next_comparison(page):
    from playwright.sync_api import expect

    # Hold the app's rendering yield so input changes exercise the pending run
    # deterministically, without depending on machine speed or arbitrary sleeps.
    # A test-only DOM marker exposes hook readiness to a CSP-safe locator assertion.
    page.evaluate('''() => {
        const original = window.setTimeout;
        window.setTimeout = (callback, delay, ...args) => {
            if (delay === 25) {
                window.setTimeout = original;
                window.resumeComparison = () => callback(...args);
                document.documentElement.setAttribute('data-test-comparison-held', 'true');
                return 0;
            }
            return original(callback, delay, ...args);
        };
    }''')
    page.locator('#compare').click()
    expect(page.locator('html')).to_have_attribute('data-test-comparison-held', 'true', timeout=15000)
    assert page.locator('#reset').is_disabled()


def resume_comparison(page):
    from playwright.sync_api import expect

    page.evaluate('''() => {
        const resume = window.resumeComparison;
        delete window.resumeComparison;
        document.documentElement.removeAttribute('data-test-comparison-held');
        resume();
    }''')
    expect(page.locator('#reset')).to_be_enabled(timeout=15000)


def check_pending_file_change(page):
    from playwright.sync_api import expect

    page.locator('#demo').click()
    page.locator('#results').wait_for(state='visible')
    hold_next_comparison(page)
    page.evaluate('''() => {
        const original = File.prototype.arrayBuffer;
        File.prototype.arrayBuffer = function () {
            File.prototype.arrayBuffer = original;
            return new Promise((resolve, reject) => {
                window.finishFileRead = () => original.call(this).then(resolve, reject);
                document.documentElement.setAttribute('data-test-file-read-held', 'true');
            });
        };
    }''')
    page.locator('#update-file').set_input_files({
        'name': 'replacement-update.csv', 'mimeType': 'text/csv',
        'buffer': (ROOT / 'samples/unchanged-update.csv').read_bytes()})
    expect(page.locator('html')).to_have_attribute('data-test-file-read-held', 'true', timeout=15000)
    resume_comparison(page)
    assert page.locator('#results').is_hidden(), 'Changed files must cancel the pending report'
    assert page.locator('#error').is_hidden(), 'Cancellation must not show an internal comparison error'
    assert page.locator('#compare').is_disabled(), 'The replacement file has not finished reading'
    page.evaluate('''async () => {
        const finish = window.finishFileRead;
        delete window.finishFileRead;
        document.documentElement.removeAttribute('data-test-file-read-held');
        await finish();
    }''')
    expect(page.locator('#compare')).to_be_enabled(timeout=15000)
    assert page.locator('#update-name').inner_text() == 'replacement-update.csv'
    assert page.locator('#results').is_hidden(), 'Reading a replacement must not run an unrequested comparison'
    assert page.locator('#error').is_hidden()
    assert 'Both files ready' in page.locator('#run-state').inner_text()
    page.locator('#compare').click()
    page.locator('#results').wait_for(state='visible')
    assert page.locator('#metric-compared').inner_text() == '7'
    assert page.locator('#metric-prices').inner_text() == '0'
    assert 'replacement-update.csv' in page.locator('#coverage-body').text_content()


def check_pending_settings_change(page):
    for setting, value in [('threshold', '95'), ('overwrite', 'false')]:
        page.locator('#demo').click()
        page.locator('#results').wait_for(state='visible')
        hold_next_comparison(page)
        if setting == 'threshold':
            page.locator('#threshold').fill(value)
        else:
            page.locator('#overwrite').select_option(value)
        resume_comparison(page)
        assert page.locator('#results').is_hidden(), 'Changed settings must cancel the pending report'
        assert page.locator('#error').is_hidden()
        assert page.locator('#compare').is_enabled()
        assert page.locator('#' + setting).input_value() == value
        assert 'Settings changed' in page.locator('#run-state').inner_text()
        page.locator('#compare').click()
        page.locator('#results').wait_for(state='visible')
        if setting == 'threshold':
            assert page.locator('#metric-priority').inner_text() == '4'
        else:
            assert page.locator('#metric-compared').inner_text() == '0'


def check_clear_rejected_filename(page):
    rejected_name = 'synthetic-sensitive-store-name.csv'
    page.locator('#update-file').set_input_files({
        'name': rejected_name, 'mimeType': 'text/csv', 'buffer': b'a;b\n1;2'})
    page.locator('#error').wait_for(state='visible')
    assert rejected_name in page.locator('#error').inner_text()
    page.locator('#reset').click()
    assert page.locator('#error').is_hidden()
    assert page.locator('#error').text_content() == '', 'Clear files must remove rejected names from the DOM'
    assert rejected_name not in page.locator('body').text_content()
    assert page.locator('#results').is_hidden()
    assert page.locator('#compare').is_disabled()


def check_sample_compatibility(page):
    from playwright.sync_api import expect

    # Independently constructed synthetic data; no network/template dependency.
    header = 'URL handle,Title,Status,Option1 name,Option1 value,SKU,Price\n'
    current = header + 'sample-shirt,Sample shirt,Active,Size,S,COMPAT-S,10.00\n' + 'sample-shirt,,,Size,M,COMPAT-M,10.00\n'
    update = header + 'sample-shirt,Sample shirt,active,Size,S,COMPAT-S,10.00\n' + 'sample-shirt,,,,M,COMPAT-M,10.00\n'
    page.locator('#reset').click()
    page.locator('#overwrite').select_option('true')
    page.locator('#threshold').fill('30')
    for selector, name, text in [('current-file', 'compat-current.csv', current),
                                 ('update-file', 'compat-update.csv', update)]:
        page.locator('#' + selector).set_input_files({
            'name': name, 'mimeType': 'text/csv', 'buffer': text.encode('utf-8')})
    expect(page.locator('#compare')).to_be_enabled(timeout=15000)
    page.locator('#compare').click()
    page.locator('#results').wait_for(state='visible')
    assert page.locator('#metric-compared').inner_text() == '2'
    assert page.locator('#metric-prices').inner_text() == '0'
    assert page.locator('#metric-priority').inner_text() == '0'
    assert page.locator('#metric-unpaired').inner_text() == '0'
    assert page.locator('#count-all').inner_text() == '0'

    page.locator('#update-file').set_input_files({
        'name': 'compat-changed.csv', 'mimeType': 'text/csv',
        'buffer': update.replace(',M,COMPAT-M,', ',L,COMPAT-M,').encode('utf-8')})
    expect(page.locator('#compare')).to_be_enabled(timeout=15000)
    page.locator('#compare').click()
    page.locator('#results').wait_for(state='visible')
    assert page.locator('#metric-priority').inner_text() == '1'
    assert page.locator('#count-all').inner_text() == '1'
    assert 'option changed' in page.locator('#findings').inner_text()
    assert 'COMPAT-M' in page.locator('#findings').inner_text()


def run_checks(page, out, checks, requests, errors, source_html, mode):
    from playwright.sync_api import expect

    # Preserve the eleven original groups, including real input and download events.
    OUT = out
    assert page.title() == 'CSV Change Guard — Review before you import'
    assert page.locator('#compare').is_disabled()
    page.screenshot(path=str(OUT / 'desktop-start.png'), full_page=True)
    checks.append(f'{mode} mode renders standalone HTML; compare disabled before input')

    page.locator('#demo').click()
    page.locator('#results').wait_for(state='visible')
    assert page.locator('#metric-compared').inner_text() == '4'
    assert page.locator('#metric-prices').inner_text() == '4'
    assert page.locator('#metric-priority').inner_text() == '6'
    assert page.locator('#metric-unpaired').inner_text() == '4'
    assert 'Incomplete comparison' in page.locator('#verdict').inner_text()
    checks.append('demo computes expected metrics and incomplete-comparison verdict')
    page.wait_for_timeout(400)
    page.screenshot(path=str(OUT / 'desktop-results.png'), full_page=True)

    page.locator('[data-filter="high"]').click()
    assert page.locator('#findings tr').count() == 5
    page.locator('#search').fill('desk-lamp')
    assert page.locator('#findings tr').count() == 1
    assert '-90%' in page.locator('#findings').inner_text()
    checks.append('severity filter and text search work together')

    for button, suffix in [('export-html','html'),('export-csv','csv'),('export-json','json')]:
        with page.expect_download() as dl:
            page.locator('#'+button).click()
        download = dl.value
        download.save_as(str(OUT / ('browser-export.'+suffix)))
        assert (OUT / ('browser-export.'+suffix)).stat().st_size > 100
    report = json.loads((OUT / 'browser-export.json').read_text())
    assert len(report['findings']) == 15
    assert len(report['findings']) > page.locator('#findings tr').count()
    checks.append('all three downloads work; exported report is not limited by active filters')

    page.locator('#threshold').fill('95')
    assert page.locator('#results').is_hidden()
    page.locator('#compare').click()
    page.locator('#results').wait_for(state='visible')
    assert page.locator('#metric-priority').inner_text() == '4'
    checks.append('changing settings invalidates stale report and recalculates correctly')

    page.locator('#overwrite').select_option('false')
    page.locator('#compare').click()
    page.locator('#results').wait_for(state='visible')
    assert page.locator('#metric-compared').inner_text() == '0'
    assert page.locator('#metric-prices').inner_text() == '0'
    checks.append('disabled overwrite suppresses existing-handle changes')

    page.locator('#reset').click()
    assert page.locator('#results').is_hidden()
    assert page.locator('#findings').inner_html() == ''
    assert page.locator('#coverage-body').inner_html() == ''
    assert page.locator('#compare').is_disabled()
    page.locator('#overwrite').select_option('true')
    page.locator('#threshold').fill('30')
    page.locator('#current-file').set_input_files(str(ROOT / 'samples/legacy-current.csv'))
    page.locator('#update-file').set_input_files(str(ROOT / 'samples/unchanged-update.csv'))
    expect(page.locator('#compare')).to_be_enabled(timeout=15000)
    page.locator('#compare').click()
    page.locator('#results').wait_for(state='visible')
    assert page.locator('#metric-compared').inner_text() == '7'
    assert page.locator('#metric-prices').inner_text() == '0'
    checks.append('real file selection works across legacy and current headers')

    page.locator('#update-file').set_input_files({'name':'bad.csv','mimeType':'text/csv','buffer':b'a;b\n1;2'})
    page.locator('#error').wait_for(state='visible')
    assert 'comma-separated' in page.locator('#error').inner_text()
    assert page.locator('#compare').is_disabled()
    checks.append('unsupported delimiter is rejected and previous comparison is cleared')

    page.locator('#update-file').set_input_files({'name':'bad-encoding.csv','mimeType':'text/csv','buffer':b'\xff\xff'})
    page.locator('#error').wait_for(state='visible')
    assert 'UTF-8' in page.locator('#error').inner_text()
    checks.append('invalid UTF-8 rejected in browser file loader')

    check_clear_rejected_filename(page)
    checks.append('clear files removes rejected filenames and errors from the DOM')

    check_pending_file_change(page)
    checks.append('file replacement cancels a pending comparison and requires an explicit new run')

    check_pending_settings_change(page)
    checks.append('threshold and overwrite changes cancel pending comparisons without replacing newer settings')

    check_sample_compatibility(page)
    checks.append('Active status alias and sparse continuation option names avoid false alerts while real option changes remain high priority')

    from browser_pagination import check_pagination_exports
    check_pagination_exports(page.context.browser, page.url, out / 'pagination',
                             source_html if mode == 'content' else None)
    checks.append('100-finding pagination, search/severity resets and complete HTML/CSV/JSON exports pass against independent synthetic expectations')

    page.locator('#demo').click()
    page.locator('#results').wait_for(state='visible')
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('window.scrollTo(0,0)')
    page.wait_for_timeout(400)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path=str(OUT / 'mobile.png'), full_page=True)
    checks.append('390px layout fits viewport without page-level horizontal overflow')

    application_requests = [request for request in requests if not request['initial_document']]
    assert application_requests == [], application_requests
    assert errors == [], errors
    assert 'localStorage.setItem(' not in source_html
    checks.append('no application HTTP requests or JavaScript errors observed; build contains no localStorage.setItem calls')


def main():
    args = parse_args()
    run_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '-' + uuid4().hex[:8]
    out = args.artifacts_dir.expanduser().resolve() / f'{args.mode}-{run_id}'
    out.mkdir(parents=True, exist_ok=False)
    checks, errors, requests = [], [], []
    result = {
        'status': 'running',
        'started_at': utc_now(),
        'finished_at': None,
        'browser': 'Chromium',
        'rendering_mode': args.mode,
        'requested_target': args.target,
        'actual_page_url': None,
        'sandbox_enabled': not args.no_sandbox,
        'sandbox_configuration': 'disabled by explicit --no-sandbox' if args.no_sandbox else 'enabled (default)',
        'versions': {'python': platform.python_version(), 'playwright': None, 'chromium': None},
        'executable_path': None,
        'browser_command_line': None,
        'checks_expected': EXPECTED_CHECKS,
        'checks_passed': 0,
        'checks': checks,
        'page_errors': errors,
        'http_requests': requests,
        'artifacts_dir': str(out),
        'error': None,
    }
    # A new run directory and an initial status make interrupted/failed runs distinct
    # from historical successful artifacts. No old result is reused or overwritten.
    write_result(out, result)
    try:
        result['versions']['playwright'] = version('playwright')
        from playwright.sync_api import sync_playwright

        source_html = args.source.read_text(encoding='utf-8')
        executable = (os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
                      or shutil.which('google-chrome'))
        with sync_playwright() as playwright:
            result['executable_path'] = executable or playwright.chromium.executable_path
            browser = playwright.chromium.launch(
                executable_path=executable, headless=True,
                chromium_sandbox=not args.no_sandbox, args=['--enable-automation'])
            session = browser.new_browser_cdp_session()
            result['browser_command_line'] = session.send('Browser.getBrowserCommandLine')['arguments']
            session.detach()
            assert ('--no-sandbox' in result['browser_command_line']) == args.no_sandbox
            result['versions']['chromium'] = browser.version
            page = browser.new_page(viewport={'width': 1440, 'height': 1100}, device_scale_factor=1)
            page.set_default_timeout(15000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            initial_document_seen = False

            def record_request(request):
                nonlocal initial_document_seen
                if not request.url.startswith(('http://', 'https://')):
                    return
                # Only the one requested main document is allowed. Same-origin
                # fetches/subresources and redirects must still fail the privacy check.
                initial_document = (
                    args.mode == 'url' and not initial_document_seen
                    and request.is_navigation_request() and request.frame == page.main_frame
                    and request.redirected_from is None)
                if initial_document:
                    initial_document_seen = True
                requests.append({'url': request.url, 'resource_type': request.resource_type,
                                 'initial_document': initial_document})

            page.on('request', record_request)
            try:
                if args.mode == 'content':
                    page.set_content(source_html, wait_until='load')
                else:
                    response = page.goto(args.target, wait_until='load')
                    if args.mode == 'url':
                        assert response is not None and response.ok, 'Localhost document did not return a successful response'
                        assert response.body() == args.source.read_bytes(), 'Localhost response differs from dist/index.html; rebuild/restart the intended server'
                result['actual_page_url'] = page.url
                run_checks(page, out, checks, requests, errors, source_html, args.mode)
                assert len(checks) == EXPECTED_CHECKS, 'Not all expected groups were executed'
                result['status'] = 'passed'
            finally:
                result['actual_page_url'] = page.url
                browser.close()
    except KeyboardInterrupt:
        result['status'] = 'interrupted'
        result['error'] = {'type': 'KeyboardInterrupt', 'message': 'Run interrupted before completion'}
    except Exception as error:
        message = str(error)
        result['status'] = 'blocked' if 'ERR_BLOCKED_BY_ADMINISTRATOR' in message else 'failed'
        result['error'] = {'type': type(error).__name__, 'message': message,
                           'traceback': traceback.format_exc()}
    finally:
        result['checks_passed'] = len(checks)
        result['finished_at'] = utc_now()
        write_result(out, result)
        print(json.dumps(result, indent=2))
    if result['status'] != 'passed':
        print(f"Browser checks {result['status']}; see {out / 'browser-test-results.json'}", file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
