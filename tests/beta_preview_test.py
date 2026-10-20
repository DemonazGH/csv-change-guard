"""Optional package/draft checks with one installed, sandboxed Chrome or Edge.

Requires tests/requirements-browser.txt, not an application dependency. Pass
--browser-executable or CHROMIUM_PATH; outputs use a fresh UTC/UUID directory.
"""
import argparse
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
from importlib.metadata import version
import json
import os
from pathlib import Path
import platform
import re
import shutil
import sys
from urllib.parse import unquote, urlsplit
from uuid import uuid4
import zipfile

REPO = Path(__file__).resolve().parents[1]
PAYLOAD = {'DRAFT-NOT-FOR-SALE.txt', 'START_HERE.txt', 'help.html',
           'dist/index.html', 'server.cjs', 'samples/current-catalog.csv',
           'samples/proposed-update.csv', 'samples/unchanged-update.csv'}
EXPECTED = PAYLOAD | {'manifest.json', 'SHA256SUMS.txt'}
sha = lambda data: hashlib.sha256(data).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links = set(), []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, 'Duplicate HTML id'
            self.ids.add(attrs['id'])
        self.links.extend(attrs[key] for key in ('href', 'src') if key in attrs)


def check_links(file, root):
    doc = Links()
    doc.feed(file.read_text(encoding='utf-8'))
    for href in doc.links:
        url = urlsplit(href)
        assert not url.scheme and not url.netloc and not url.query, 'Nonlocal link'
        target = (file.parent / unquote(url.path)).resolve() if url.path else file
        assert target.is_relative_to(root) and target.is_file(), 'Missing local target'
        if url.fragment:
            other = Links()
            other.feed(target.read_text(encoding='utf-8'))
            assert unquote(url.fragment) in other.ids, 'Missing fragment target'


def check_package(package, archive):
    assert package.is_dir() and not package.is_symlink(), 'Expected extracted package'
    assert not any(path.is_symlink() for path in package.rglob('*')), 'Linked package input'
    actual = {path.relative_to(package).as_posix() for path in package.rglob('*') if path.is_file()}
    assert actual == EXPECTED, 'Unexpected extracted package contents'
    with zipfile.ZipFile(archive) as zipped:
        assert zipped.testzip() is None, 'ZIP CRC failure'
        names = [entry.filename for entry in zipped.infolist()]
        assert len(names) == len(EXPECTED), 'Incorrect ZIP entry count'
        assert set(names) == {'CSV-Change-Guard/' + name for name in EXPECTED}, 'Unexpected ZIP paths'
        for name in EXPECTED:
            assert zipped.read('CSV-Change-Guard/' + name) == (package / name).read_bytes(), 'Extraction mismatch'
    manifest = json.loads((package / 'manifest.json').read_text(encoding='utf-8'))
    app_version = json.loads((REPO / 'package.json').read_text(encoding='utf-8'))['version']
    assert manifest['packageRoot'] == 'CSV-Change-Guard', 'Unexpected package root'
    assert manifest['applicationVersion'] == app_version, 'Application version mismatch'
    assert manifest['candidateVersion'] == app_version + '-beta.1', 'Candidate version mismatch'
    assert manifest['status'] == 'internal-preview-not-for-sale', 'Expected draft status'
    assert len(manifest['files']) == len(PAYLOAD), 'Incorrect manifest entry count'
    assert {entry['path'] for entry in manifest['files']} == PAYLOAD, 'Incorrect manifest paths'
    for entry in manifest['files']:
        data = (package / entry['path']).read_bytes()
        assert len(data) == entry['bytes'] and sha(data) == entry['sha256'], 'Manifest digest mismatch'
    sums = (package / 'SHA256SUMS.txt').read_text(encoding='utf-8').splitlines()
    assert len(sums) == len(EXPECTED) - 1, 'Expected nine checksum entries'
    checked = set()
    for line in sums:
        match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
        assert match and match[2] in EXPECTED - {'SHA256SUMS.txt'}, 'Invalid checksum line'
        assert match[2] not in checked, 'Duplicate checksum path'
        checked.add(match[2])
        assert sha((package / match[2]).read_bytes()) == match[1], 'Checksum mismatch'
    assert (package / 'dist/index.html').read_bytes() == (REPO / 'dist/index.html').read_bytes(), 'App bytes changed'
    return {'filename': archive.name, 'bytes': archive.stat().st_size,
            'sha256': sha(archive.read_bytes()), 'entries': len(EXPECTED),
            'packaged_app_sha256': sha((package / 'dist/index.html').read_bytes())}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--package-dir', required=True, type=Path)
    parser.add_argument('--archive', required=True, type=Path)
    parser.add_argument('--artifacts-dir', required=True, type=Path)
    parser.add_argument('--browser-executable', type=Path)
    args = parser.parse_args()
    if not __debug__:
        parser.error('Assertions are required; run without -O or PYTHONOPTIMIZE.')
    run = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-') + uuid4().hex[:8]
    out = args.artifacts_dir.expanduser().resolve() / run
    out.mkdir(parents=True, exist_ok=False)
    package, archive = args.package_dir.expanduser().resolve(), args.archive.expanduser().resolve()
    result = {'status': 'running', 'started_at': now(), 'python': platform.python_version(),
              'os': platform.system(), 'package_directory': package.name, 'artifacts_run': run,
              'checks': [], 'pages': [], 'source_sha256': {}}
    phase = 'environment'
    try:
        result['playwright'] = version('playwright')
        from playwright.sync_api import sync_playwright
        executable = str(args.browser_executable or os.environ.get('CHROMIUM_PATH') or
                         shutil.which('google-chrome') or shutil.which('msedge') or '')
        assert executable and Path(executable).is_file(), 'Set CHROMIUM_PATH or --browser-executable'
        result['browser_executable'] = Path(executable).name
        sources = ['commerce-draft/index.html', 'commerce-draft/checkout.html',
                   'commerce-draft/confirmation.html', 'commerce-draft/styles.css',
                   'release/help.html', 'release/START_HERE.txt', 'release/DRAFT-NOT-FOR-SALE.txt',
                   'scripts/build-release.cjs', 'tests/beta_preview_test.py', 'dist/index.html', 'package.json']
        result['source_sha256'] = {name: sha((REPO / name).read_bytes()) for name in sources}
        phase = 'archive, manifest, extracted payloads and application identity'
        result['archive'] = check_package(package, archive)
        assert (package / 'help.html').read_bytes() == (REPO / 'release/help.html').read_bytes(), 'Help bytes changed'
        result['checks'].append('Exact ZIP/extracted membership, CRCs, manifest, nine checksums and unchanged app verified')
        pages = [('product', REPO / 'commerce-draft/index.html'),
                 ('checkout', REPO / 'commerce-draft/checkout.html'),
                 ('delivery', REPO / 'commerce-draft/confirmation.html'), ('help', package / 'help.html')]
        phase = 'local links, styles and fragment targets'
        for name, file in pages:
            check_links(file, package if name == 'help' else REPO / 'commerce-draft')
        result['checks'].append('All help/commerce links, local assets and fragments resolve')
        phase = 'sandboxed installed browser launch'
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=executable, headless=True,
                                        chromium_sandbox=True, args=['--enable-automation'])
            cdp = browser.new_browser_cdp_session()
            arguments = cdp.send('Browser.getBrowserCommandLine')['arguments']
            blocked = {'--no-sandbox', '--disable-web-security', '--disable-setuid-sandbox', '--disable-seccomp-filter-sandbox'}
            assert not blocked.intersection(arg.split('=')[0] for arg in arguments), 'Security-disabling launch argument'
            cdp.detach()
            result.update(browser_version=browser.version, sandbox_enabled=True,
                          no_sandbox_argument=False, disable_web_security_argument=False)
            for name, file in pages:
                phase = name + ' file navigation and preview'
                context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
                page = context.new_page()
                errors, http = [], []
                page.on('pageerror', lambda _: errors.append('pageerror'))
                page.on('console', lambda msg: errors.append('console error') if msg.type == 'error' else None)
                page.on('request', lambda req: http.append('HTTP request') if req.url.startswith(('http:', 'https:')) else None)
                page.goto(file.as_uri(), wait_until='load')
                assert page.locator('script,form,iframe,input,textarea,select,object,embed').count() == 0, 'Active form/script content'
                assert page.locator('h1').is_visible(), 'Missing visible title'
                banner = page.locator('.notice' if name == 'help' else '.draft-banner').first.inner_text().lower()
                assert re.search(r'not (?:yet )?for sale', banner), 'Missing draft notice'
                assert all(button.is_disabled() for button in page.get_by_role('button').all()), 'Enabled action button'
                assert page.evaluate('getComputedStyle(document.body).margin') == '0px', 'Local stylesheet did not load'
                for viewport, width, height in [('desktop', 1440, 1000), ('mobile', 390, 844)]:
                    phase = name + ' ' + viewport + ' viewport and screenshot'
                    page.set_viewport_size({'width': width, 'height': height})
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Document overflows viewport'
                    for heading in page.locator('h1,h2').all():
                        bounds = heading.bounding_box()
                        assert bounds and bounds['x'] >= -1 and bounds['x'] + bounds['width'] <= width + 1, 'Heading outside viewport'
                    page.screenshot(path=str(out / f'{name}-{viewport}.png'), full_page=False)
                assert not errors and not http, 'Page/console error or HTTP request'
                result['pages'].append({'page': name, 'desktop_mobile_fit': True, 'local_styles': True,
                                        'inert_controls': True, 'http_requests': 0, 'page_console_errors': 0})
                context.close()
            browser.close()
        result['status'] = 'passed'
    except Exception as error:
        result['status'] = 'failed'
        result['error'] = {'check': phase, 'type': type(error).__name__,
                           'message': str(error) if isinstance(error, AssertionError) else 'Check failed; no browser logs or machine paths retained.'}
    finally:
        result['finished_at'] = now()
        (out / 'preview-results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, indent=2))
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(main())
