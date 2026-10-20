"""Synthetic pagination/export contract, called by the optional browser runner."""
import csv
import io
import json
import traceback


def pagination_fixture():
    """Independent expected values: 100 changes, 60 high and 40 informational."""
    header = ['Handle', 'Title', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price']
    current, proposed, expected = [header], [header], []
    for number in range(1, 101):
        handle, sku = f'page-item-{number:03}', f'PAGE-{number:03}'
        high = number <= 60
        after = '14.00' if high else '11.00'
        row = [handle, f'Synthetic pagination item {number:03}', 'Title', 'Default Title', sku]
        current.append(row + ['10.00'])
        proposed.append(row + [after])
        expected.append({
            'handle': handle, 'sku': sku, 'before': '10.00', 'after': after,
            'severity': 'high' if high else 'info',
            'code': 'PRICE_THRESHOLD' if high else 'PRICE_CHANGED',
            'percentChange': 40 if high else 10,
            'currentRecord': number + 1, 'updateRecord': number + 1,
        })

    def encode(rows):
        stream = io.StringIO(newline='')
        csv.writer(stream, lineterminator='\n').writerows(rows)
        return stream.getvalue()

    return encode(current), encode(proposed), expected


def check_pagination_exports(browser, target, out, source_html=None):
    from playwright.sync_api import expect

    out.mkdir()
    current, proposed, expected = pagination_fixture()
    for name, text in [('current.csv', current), ('proposed.csv', proposed)]:
        (out / name).write_text(text, encoding='utf-8', newline='\n')
    (out / 'expected-findings.json').write_text(json.dumps(expected, indent=2) + '\n', encoding='utf-8')
    result = {'status': 'running', 'expected_findings': 100, 'page_sizes': [],
              'visited_skus': [], 'http_requests': [], 'page_errors': [], 'checks': []}
    context = None

    def watch(page, allow_initial=False):
        initial_seen = False

        def request_seen(request):
            nonlocal initial_seen
            if not request.url.startswith(('http://', 'https://')):
                return
            initial = (allow_initial and not initial_seen and request.url == target
                       and request.is_navigation_request() and request.frame == page.main_frame
                       and request.redirected_from is None)
            initial_seen = initial_seen or initial
            result['http_requests'].append({'url': request.url, 'initial_document': initial})

        page.on('request', request_seen)
        page.on('pageerror', lambda error: result['page_errors'].append(str(error)))

    try:
        # A separate context lets us close the comparison before reopening its report.
        context = browser.new_context(viewport={'width': 1440, 'height': 1100}, accept_downloads=True)
        page = context.new_page()
        page.set_default_timeout(15000)
        watch(page, allow_initial=True)
        if source_html is None:
            page.goto(target, wait_until='load')
        else:
            # Preserve the runner's explicitly requested in-memory mode; never fall back.
            page.set_content(source_html, wait_until='load')
        for side, name in [('current', 'current.csv'), ('update', 'proposed.csv')]:
            page.locator(f'#{side}-file').set_input_files(str(out / name))
        expect(page.locator('#compare')).to_be_enabled(timeout=15000)
        page.locator('#compare').click()
        expect(page.locator('#results')).to_be_visible()
        for selector, value in [('metric-compared', '100'), ('metric-prices', '100'),
                                ('metric-priority', '60'), ('metric-unpaired', '0'),
                                ('count-all', '100'), ('count-high', '60'), ('count-info', '40')]:
            expect(page.locator('#' + selector)).to_have_text(value)

        expected_skus = [finding['sku'] for finding in expected]

        def visible_skus():
            return page.locator('#findings tr td:nth-child(2) .sku').all_text_contents()

        def assert_page(first, last, total):
            expect(page.locator('#shown')).to_have_text(
                f'Showing {first}–{last} of {total} findings · full values in exports')
            expect(page.locator('#findings tr')).to_have_count(last - first + 1)

        def screenshot(name):
            page.locator('#shown').scroll_into_view_if_needed()
            page.screenshot(path=str(out / name))

        for index, (first, last) in enumerate([(1, 40), (41, 80), (81, 100)]):
            if index:
                page.locator('#next').click()
            assert_page(first, last, 100)
            skus = visible_skus()
            assert skus == expected_skus[first - 1:last], skus
            result['page_sizes'].append(len(skus))
            result['visited_skus'].extend(skus)
            if index == 0:
                expect(page.locator('#previous')).to_be_disabled()
                screenshot('page-1.png')
            if index == 2:
                expect(page.locator('#next')).to_be_disabled()
                screenshot('page-3.png')
        assert result['visited_skus'] == expected_skus
        assert len(set(result['visited_skus'])) == 100
        for first, last in [(41, 80), (1, 40)]:
            page.locator('#previous').click()
            assert_page(first, last, 100)
            assert visible_skus() == expected_skus[first - 1:last]
        expect(page.locator('#previous')).to_be_disabled()
        result['checks'].append('All 100 identities visited exactly once across 40/40/20 rows; reverse navigation and end buttons correct')

        # Search from the last page must reset to the first matching page.
        page.locator('#next').click()
        page.locator('#next').click()
        page.locator('#search').fill('page-item-09')
        assert_page(1, 10, 10)
        assert visible_skus() == expected_skus[89:99]
        expect(page.locator('#previous')).to_be_disabled()
        expect(page.locator('#next')).to_be_disabled()
        page.locator('#search').fill('no-such-synthetic-item')
        expect(page.locator('#shown')).to_have_text('0 matching findings')
        expect(page.locator('#findings')).to_contain_text('No findings match this filter')
        expect(page.locator('#previous')).to_be_disabled()
        expect(page.locator('#next')).to_be_disabled()
        page.locator('#search').fill('')
        assert_page(1, 40, 100)

        # Severity changes from later pages must also reset and recompute bounds.
        page.locator('#next').click()
        page.locator('#next').click()
        page.locator('[data-filter="high"]').click()
        assert_page(1, 40, 60)
        assert visible_skus() == expected_skus[:40]
        expect(page.locator('#previous')).to_be_disabled()
        page.locator('#next').click()
        assert_page(41, 60, 60)
        assert visible_skus() == expected_skus[40:60]
        expect(page.locator('#next')).to_be_disabled()
        page.locator('[data-filter="info"]').click()
        assert_page(1, 40, 40)
        assert visible_skus() == expected_skus[60:]
        expect(page.locator('#previous')).to_be_disabled()
        expect(page.locator('#next')).to_be_disabled()
        page.locator('[data-filter="all"]').click()
        assert_page(1, 40, 100)
        result['checks'].append('Search, empty search results and high/info/all filters reset later-page pagination correctly')

        page.locator('[data-filter="high"]').click()
        page.locator('#search').fill('PAGE-055')
        assert_page(1, 1, 1)
        assert visible_skus() == ['PAGE-055']
        screenshot('filtered-before-export.png')
        for button, suffix in [('export-html', 'html'), ('export-csv', 'csv'), ('export-json', 'json')]:
            with page.expect_download() as download_info:
                page.locator('#' + button).click()
            download = download_info.value
            download.save_as(out / ('complete-report.' + suffix))
            assert download.failure() is None
        assert visible_skus() == ['PAGE-055'], 'Export must preserve the active view'

        exported = json.loads((out / 'complete-report.json').read_text(encoding='utf-8'))
        assert len(exported['findings']) == len(exported['changes']) == 100
        assert exported['counts'] == {'blocking': 0, 'high': 60, 'warning': 0, 'info': 40}
        assert exported['stats']['comparedVariants'] == exported['stats']['priceChanges'] == 100
        assert exported['stats']['unpairedUpdateRows'] == 0
        for observed, wanted in zip(exported['findings'], expected):
            assert {key: observed[key] for key in wanted} == wanted
        csv_rows = list(csv.DictReader(io.StringIO((out / 'complete-report.csv').read_text(encoding='utf-8-sig'))))
        assert len(csv_rows) == 100
        for observed, wanted in zip(csv_rows, expected):
            assert {key: observed[key] for key in wanted} == {key: str(value) for key, value in wanted.items()}
        result['checks'].append('JSON and CSV exports retain all 100 exact identities, values, severity, codes, percentages and record numbers while only one filtered row is visible')

        context.close()
        context = browser.new_context(viewport={'width': 1440, 'height': 1100})
        report_page = context.new_page()
        watch(report_page)
        if source_html is None:
            report_page.goto((out / 'complete-report.html').as_uri(), wait_until='load')
        else:
            report_page.set_content((out / 'complete-report.html').read_text(encoding='utf-8'), wait_until='load')
        assert report_page.title() == 'CSV Change Guard — Report'
        expect(report_page.get_by_role('heading', name='Findings (100)', exact=True)).to_be_visible()
        expect(report_page.locator('tbody tr')).to_have_count(100)
        assert report_page.locator('script').count() == 0
        rows = report_page.locator('tbody tr').evaluate_all(
            '(rows) => rows.map(row => Array.from(row.cells, cell => cell.innerText))')
        for observed, wanted in zip(rows, expected):
            assert observed[0].splitlines() == [wanted['severity'].upper(), wanted['code']]
            assert observed[1].splitlines() == [wanted['handle'], wanted['sku']]
            assert observed[3] == wanted['before'] and observed[4] == wanted['after']
            assert f"Change: {wanted['percentChange']}%" in observed[5]
        expect(report_page.get_by_role('heading', name='Coverage and limitations', exact=True)).to_be_visible()
        report_page.evaluate('window.scrollTo(0, 0)')
        report_page.screenshot(path=str(out / 'report-open.png'))
        report_page.locator('tbody tr').last.scroll_into_view_if_needed()
        report_page.screenshot(path=str(out / 'report-last-finding.png'))
        report_route = 'file navigation' if source_html is None else 'explicit in-memory rendering'
        result['report_route'] = report_route
        result['checks'].append(f'Static HTML checked by {report_route} in a fresh context after comparison context closed; all 100 rows/values present and no scripts')
        assert result['page_errors'] == []
        assert all(request['initial_document'] for request in result['http_requests'])
        assert len(result['http_requests']) == (1 if target.startswith(('http://', 'https://')) else 0)
        result['checks'].append('No page errors or HTTP requests beyond the localhost application document')
        result['status'] = 'passed'
    except Exception:
        result['status'] = 'failed'
        result['error'] = traceback.format_exc()
        raise
    finally:
        if context is not None:
            context.close()
        (out / 'pagination-results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
