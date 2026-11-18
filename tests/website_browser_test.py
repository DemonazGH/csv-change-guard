"""Check the built synthetic trial in an installed, sandboxed Chrome or Edge.

Uses the optional requirements-browser.txt dependencies and a temporary,
loopback-only HTTP server. No external website or signed-in profile is opened.
"""
import argparse
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from importlib.metadata import version
import json
from pathlib import Path
import platform
import threading
from urllib.parse import urlsplit
from uuid import uuid4

from playwright.sync_api import expect, sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def check_layout(page):
    layout = page.evaluate("""() => {
        const width = window.innerWidth;
        const outside = [...document.querySelectorAll('body *')].filter(element => {
            const rect = element.getBoundingClientRect();
            const table = element.closest('.guide-table-scroll');
            return rect.width > 0 && rect.height > 0 && (!table || table === element)
                && (rect.left < -1 || rect.right > width + 1);
        }).slice(0, 8).map(element => ({
            selector: element.tagName.toLowerCase() + (element.id ? '#' + element.id
                : '.' + [...element.classList].join('.')),
            left: Math.round(element.getBoundingClientRect().left),
            right: Math.round(element.getBoundingClientRect().right)
        }));
        return {viewport: width, page: document.documentElement.scrollWidth, outside};
    }""")
    assert layout['page'] <= layout['viewport'], 'Horizontal page overflow: ' + repr(layout)


def check_focus_ring(locator):
    ring = locator.evaluate("""element => {
        const style = getComputedStyle(element);
        return {visible: element.matches(':focus-visible'), style: style.outlineStyle,
                width: parseFloat(style.outlineWidth), color: style.outlineColor};
    }""")
    assert ring['visible'] and ring['style'] != 'none' and ring['width'] >= 1, repr(ring)


def check_scaling_and_preferences(browser, base, out):
    pages = [('index.html', 'home'), ('demo.html', 'demo'),
             ('shopify-csv-price-changes.html', 'guide'), ('privacy.html', 'privacy'),
             ('free-beta-terms.html', 'terms')]
    metrics = []
    baseline = {}
    for width in (320, 1440):
        for scale in (1, 2):
            context = browser.new_context(viewport={'width': width, 'height': 1000})
            page = context.new_page()
            cdp = context.new_cdp_session(page)
            cdp.send('Emulation.setEmulatedOSTextScale', {'scale': scale})
            for filename, name in pages:
                page.goto(base + filename)
                expect(page.locator('meta[name="text-scale"]')).to_have_attribute('content', 'scale')
                page.keyboard.press('Tab')
                expect(page.locator('.skip')).to_be_focused()
                page.keyboard.press('Enter')
                heading = page.get_by_role('heading', level=1)
                expect(heading).to_be_focused()
                check_focus_ring(heading)
                fonts = page.evaluate("""() => ({
                    root: parseFloat(getComputedStyle(document.documentElement).fontSize),
                    body: parseFloat(getComputedStyle(document.body).fontSize),
                    heading: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize)
                })""")
                if scale == 1:
                    baseline[(width, name)] = fonts
                else:
                    normal = baseline[(width, name)]
                    detail = repr({'page': filename, 'viewport': width, 'normal': normal, 'scaled': fonts})
                    assert fonts['root'] >= normal['root'] * 1.99, 'Root text did not scale: ' + detail
                    # Font-relative breakpoints can also select a smaller rem
                    # multiplier at 2x. Text must grow while the root doubles.
                    assert fonts['body'] > normal['body'], 'Body text did not scale: ' + detail
                    assert fonts['heading'] > normal['heading'], 'Heading text did not scale: ' + detail
                    page.screenshot(path=str(out / f'{name}-{width}-text-scale-2.png'))
                metrics.append({'page': filename, 'viewport': width, 'os_text_scale': scale,
                                'font_px': fonts})
                check_layout(page)
                for styled_list in page.locator('.steps, .demo-findings').all():
                    expect(styled_list).to_have_attribute('role', 'list')
                if name == 'demo' and scale == 2:
                    page.locator('#demo-tour-start').focus()
                    page.keyboard.press('Enter')
                    expect(page.locator('#demo-tour-step-title')).to_be_focused()
                    check_focus_ring(page.locator('#demo-tour-step-title'))
                    expect(page.locator('#demo-findings > li')).to_have_count(15)
                    check_layout(page)
                    page.locator('#demo-tour').screenshot(
                        path=str(out / f'tour-{width}-text-scale-2.png'))
                    page.locator('#demo-filter-priority').click()
                    expect(page.locator('#demo-findings > li')).to_have_count(6)
                    check_layout(page)
                    page.locator('#demo-reset').click()
                    expect(page.locator('#demo-results')).to_be_hidden()
                    expect(page.locator('#demo-run')).to_be_focused()
                    page.keyboard.press('Enter')
                    expect(page.locator('#demo-results-title')).to_be_focused()
                    check_focus_ring(page.locator('#demo-results-title'))
                    check_layout(page)
            cdp.detach()
            context.close()

    context = browser.new_context(viewport={'width': 390, 'height': 1000},
                                  reduced_motion='reduce', forced_colors='active')
    page = context.new_page()
    page.goto(base + 'demo.html')
    expect(page.locator('html')).to_have_css('scroll-behavior', 'auto')
    page.locator('#demo-tour-start').focus()
    page.keyboard.press('Enter')
    expect(page.locator('#demo-tour-step-title')).to_be_focused()
    check_focus_ring(page.locator('#demo-tour-step-title'))
    check_layout(page)
    page.locator('#demo-tour').screenshot(path=str(out / 'tour-forced-colors-reduced-motion.png'))
    context.close()
    return metrics


def check_trial(browser, base, out, width, errors, requests):
    context = browser.new_context(viewport={'width': width, 'height': 1000})
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text)
            if message.type == 'error' else None)
    # Scope network evidence to the website page. Edge exposes its own
    # downloads-hub UI as an additional page when a download starts.
    page.on('request', lambda request: requests.append((request.url, request.method)))
    page.goto(base)
    expect(page.get_by_role('heading', name='Try a report in a few minutes.')).to_be_visible()
    expect(page.get_by_role('link', name='Start the free trial')).to_have_attribute('href', 'demo.html')
    check_layout(page)
    page.screenshot(path=str(out / f'home-{width}.png'), full_page=True)
    page.get_by_role('link', name='Take the one-minute tour', exact=True).click()
    expect(page.locator('#demo-tour-start')).to_be_enabled()
    expect(page.locator('#demo-results')).to_be_hidden()
    assert page.locator('input, form, iframe').count() == 0
    page.locator('#demo-tour-start').focus()
    page.keyboard.press('Enter')
    expect(page.locator('#demo-tour-step-title')).to_have_text('Spot the large price change')
    expect(page.locator('#demo-tour-step-title')).to_be_focused()
    expect(page.locator('#demo-tour-back')).to_be_disabled()
    expect(page.locator('#demo-tour-content')).to_contain_text('59.00')
    expect(page.locator('#demo-tour-content')).to_contain_text('5.90')
    expect(page.locator('#demo-tour-content')).to_contain_text('-90%')
    for name, value in [('compared', '4'), ('prices', '4'), ('priority', '6'),
                        ('unpaired', '4'), ('total', '15')]:
        expect(page.locator('#demo-' + name)).to_have_text(value)
    expect(page.locator('#demo-verdict')).to_have_text('Incomplete comparison — blockers need review')
    expect(page.locator('#demo-findings > li')).to_have_count(15)
    check_layout(page)
    page.locator('#demo-tour').screenshot(path=str(out / f'tour-price-{width}.png'))
    page.locator('#demo-tour-next').click()
    expect(page.locator('#demo-tour-content')).to_contain_text('notebook / NOTE-001')
    expect(page.locator('#demo-tour-content')).to_contain_text('Their prices are not compared.')
    page.locator('#demo-tour-back').click()
    expect(page.locator('#demo-tour-progress')).to_have_text('Step 1 of 3')
    page.locator('#demo-tour-next').click()
    page.locator('#demo-tour-next').click()
    expect(page.locator('#demo-tour-progress')).to_have_text('Step 3 of 3')
    page.locator('#demo-filter-priority').click()
    expect(page.locator('#demo-findings > li')).to_have_count(6)
    with page.expect_download() as download_info:
        page.locator('#demo-tour-save').click()
    download = download_info.value
    assert download.failure() is None, 'Report download failed'
    report_file = out / f'synthetic-report-{width}.html'
    download.save_as(report_file)
    page.locator('#demo-tour-next').click()
    expect(page.locator('#demo-tour-panel')).to_be_hidden()
    expect(page.locator('#demo-tour-start')).to_be_focused()
    expect(page.locator('#demo-tour-start')).to_have_text('Restart quick tour')
    page.locator('#demo-tour-start').click()
    expect(page.locator('#demo-tour-progress')).to_have_text('Step 1 of 3')
    page.locator('#demo-reset').click()
    expect(page.locator('#demo-results')).to_be_hidden()
    expect(page.locator('#demo-tour-panel')).to_be_hidden()
    expect(page.locator('#demo-tour-start')).to_have_text('Start quick tour')
    expect(page.locator('#demo-save')).to_be_disabled()
    expect(page.locator('#demo-run')).to_be_focused()
    page.locator('#demo-run').click()
    expect(page.locator('#demo-findings > li')).to_have_count(15)
    expect(page.locator('#demo-tour-panel')).to_be_hidden()
    page.locator('#demo-filter-priority').click()
    expect(page.locator('#demo-findings > li')).to_have_count(6)
    page.locator('#demo-filter-all').click()
    expect(page.locator('#demo-findings > li')).to_have_count(15)
    page.goto(base + 'shopify-csv-price-changes.html')
    expect(page.get_by_role('heading', level=1)).to_contain_text('Review price changes.')
    expect(page.locator('tbody tr')).to_have_count(4)
    check_layout(page)
    page.screenshot(path=str(out / f'guide-{width}.png'), full_page=True)
    page.get_by_role('link', name='Try the one-minute walkthrough').click()
    expect(page.locator('#demo-tour-start')).to_be_enabled()
    context.close()

    # Reopen the download after closing the entire demo context.
    report_context = browser.new_context(viewport={'width': width, 'height': 1000})
    report_page = report_context.new_page()
    report_page.goto(report_file.as_uri())
    expect(report_page.get_by_text('Findings (15)', exact=True)).to_be_visible()
    expect(report_page.get_by_text('Incomplete comparison — blockers need review', exact=True)).to_be_visible()
    assert 'demo-current-catalog.csv' in report_page.locator('body').inner_text()
    assert 'demo-proposed-update.csv' in report_page.locator('body').inner_text()
    expect(report_page.locator('script')).to_have_count(0)
    report_context.close()


def check_fallback(browser, base):
    context = browser.new_context(java_script_enabled=False)
    page = context.new_page()
    page.goto(base + 'demo.html')
    expect(page.locator('#demo-run')).to_be_disabled()
    page.get_by_role('link', name='Open the complete synthetic example report').click()
    expect(page.get_by_text('Findings (15)', exact=True)).to_be_visible()
    context.close()

    context = browser.new_context()
    context.route('**/assets/engine.js', lambda route: route.abort())
    page = context.new_page()
    page.goto(base + 'demo.html')
    expect(page.locator('#demo-status')).to_contain_text('could not load')
    expect(page.locator('#demo-tour-start')).to_be_disabled()
    page.get_by_role('link', name='Read the complete example report').click()
    expect(page.get_by_text('Findings (15)', exact=True)).to_be_visible()
    context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site-dir', required=True, type=Path)
    parser.add_argument('--browser-executable', required=True, type=Path)
    parser.add_argument('--artifacts-dir', required=True, type=Path)
    args = parser.parse_args()
    if not __debug__:
        parser.error('Run without -O or PYTHONOPTIMIZE so assertions are enabled.')
    site = args.site_dir.resolve()
    if not (site / 'demo.html').is_file():
        parser.error('Build the website and pass its output directory.')
    run = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid4().hex[:8]
    out = args.artifacts_dir.resolve() / run
    out.mkdir(parents=True, exist_ok=False)
    result = {'status': 'running', 'started_at': datetime.now(timezone.utc).isoformat(),
              'os': platform.platform(), 'python': platform.python_version(),
              'playwright': version('playwright'), 'checks': []}
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(site)))
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    base = f'http://127.0.0.1:{server.server_port}/'
    errors, requests = [], []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=str(args.browser_executable.resolve()),
                                                 headless=True, chromium_sandbox=True,
                                                 args=['--enable-automation'])
            result['browser'] = args.browser_executable.name
            result['browser_version'] = browser.version
            cdp = browser.new_browser_cdp_session()
            arguments = cdp.send('Browser.getBrowserCommandLine')['arguments']
            forbidden = {'--no-sandbox', '--disable-web-security', '--disable-setuid-sandbox',
                         '--disable-seccomp-filter-sandbox'}
            assert not forbidden.intersection(arg.split('=')[0] for arg in arguments)
            cdp.detach()
            result['sandbox_enabled'] = True
            for width in (1440, 390):
                check_trial(browser, base, out, width, errors, requests)
                result['checks'].append(f'{width}px navigation, keyboard tour, report download/reopen, '
                                        'filtering, restart/reset, guide and page overflow passed')
            check_fallback(browser, base)
            result['checks'].append('JavaScript-disabled and engine-load-failure report fallbacks passed')
            result['os_text_scale_emulation'] = {
                'method': 'CDP Emulation.setEmulatedOSTextScale',
                'cases': check_scaling_and_preferences(browser, base, out)
            }
            result['checks'].append('All five pages passed 320/1440px reflow at 1x/2x emulated OS '
                                    'text scale, skip-link focus and visible heading focus rings')
            result['checks'].append('2x text-scale demo run/filter/reset and emulated reduced-motion/'
                                    'forced-colors focus checks passed')
            assert not errors, 'Browser errors: ' + repr(errors)
            unexpected = [(url, method) for url, method in requests
                          if urlsplit(url).netloc != urlsplit(base).netloc or method != 'GET']
            assert not unexpected, 'Unexpected request destination or submission: ' + repr(unexpected)
            result['checks'].append('Observed trial/guide requests were same-origin GETs; no browser errors')
            browser.close()
        result['status'] = 'passed'
    except Exception as error:
        result['status'] = 'failed'
        result['error'] = str(error)
        raise
    finally:
        server.shutdown()
        server.server_close()
        worker.join()
        result['finished_at'] = datetime.now(timezone.utc).isoformat()
        (out / 'result.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
        print(json.dumps({'artifacts': str(out), **result}, indent=2))


if __name__ == '__main__':
    main()
