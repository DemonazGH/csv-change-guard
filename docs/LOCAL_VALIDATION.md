# Try the local application

Start with the included synthetic catalogs. You do not need a Shopify store,
product export, account, or API key. This exercise checks whether the application
opens and produces an understandable report on your computer. Real merchant
workflow validation is a separate step once suitable files are available.

## Download and open

Download the local validation ZIP supplied with this task, or open
[the GitHub repository](https://github.com/DemonazGH/csv-change-guard), select
**Code → Download ZIP**, and choose **Extract All** on Windows. In the extracted
folder, open `dist`, then right-click `index.html` and choose **Open with →
Google Chrome** or **Microsoft Edge**. Do not run it from the ZIP preview.

The provided HTML is the complete application. No installation or build is
required. If your browser blocks local files, leave its security settings in
place. When Node.js is already installed, you can open a terminal in the extracted
folder, run `node server.cjs`, and open the printed local address instead. Keep
the terminal running during the test and press Ctrl+C when finished. Record a
blocked launch if neither route is available.

## First check: demo and real file selection

1. Click **Try the built-in demo**. Expect 4 compared variants, 4 price changes,
   6 priority findings, 4 unpaired update rows, and 15 total findings under **All**.
   The incomplete-comparison verdict is intentional: the demo includes a
   duplicate key that prevents part of the comparison.
2. Open **Coverage, matching rules, and limitations**. Read the recognized
   header mappings and unassessed columns. A compared variant is an exact
   identity match, not proof that every field was checked.
3. Click **Save HTML report**. Open the download in the browser and confirm that
   its explanations are understandable. Exports include all findings even if a
   filter or search is active.
4. Click **Clear files**, choose `samples/current-catalog.csv` under **Current
   catalog**, and `samples/proposed-update.csv` under **Proposed update**.
   Leave the threshold at **30%** and **Overwrite matching handles: enabled**.
   Click **Compare files**. Expect the same counts as the demo.
5. Record the result in a copy of [the results sheet](VALIDATION_RESULTS_TEMPLATE.md).
   Repeat in the other browser if available; record each browser separately.

Do not import the supplied synthetic CSVs into a store. The tool does not connect
to Shopify or make any store changes.

## A few useful follow-up comparisons

Use `samples/scenarios/catalog.csv` as the current catalog, with the same 30%
threshold and overwrite enabled:

| Proposed update in `samples/scenarios/` | Expected result |
|---|---|
| `catalog.csv` | 6 compared variants, no price changes; image coverage warnings still appear |
| `partial-prices.csv` | 2 compared variants, 2 price changes; four absent variants are informational, not deletions; omitted columns are unassessed |
| `explicit-clears.csv` | 6 compared variants, no price changes; three explicit clears: shirt description, mug vendor, tea tin compare-at price |
| `invalid-identifiers.csv` | 2 compared variants, no price changes, 4 unpaired update rows; blocking findings explain the incomplete coverage |

The [scenario reference](../samples/scenarios/README.md) lists all nine files and
their expected outcomes. A coverage warning is not automatically a false alarm.
A missing row is not a deletion prediction, and no findings is not import approval.

## When representative files become available

Use copies of a current product export and the actual proposed update from the
same store and currency, with permission to use them. Keep those copies and
their reports on your computer, outside the source repository and AI workspace.
The browser application processes selected files locally; it does not upload
them. No need to send them to this chat to perform the test.

Before comparing, write down the changes you expect from the update. Use local
case labels such as `price-case-1` in any shareable notes instead of handles or
SKUs. Include expected before/after values only in your private copy of the notes.
For a large update, state whether your expected-change list is complete or just
a sample; checking a sample cannot establish that there are no missed changes.

Both files must use the supported UTF-8, comma-delimited format, have recognized
handle, Title, and SKU columns, and be within 5,000 records, 10 MiB, and 200 columns
per file. Exact, case-sensitive handle + non-empty SKU establishes identity.
Changing those identifiers prevents pairing. Complete variant data should include
Option1 name/value. See [the product scope](PRODUCT_SCOPE.md) for the contract.
Do not silently repair identifiers or discard excluded records just to obtain a
clean result. If a real workflow does not fit the contract, record that limitation.

Choose the threshold and overwrite assumption deliberately and record them.
For each expected change, classify the result as:

- **Found:** the affected identity, field, before/after values, and explanation agree.
- **Missed:** an expected change inside the supported, paired scope has no finding.
- **False alert:** a finding asserts an in-scope change that the files do not contain.
- **Unassessed:** the record or field is excluded, ambiguous, absent, or unsupported.

Record coverage separately: compared variants, unpaired update rows, image-only
records, overwrite-ignored rows, omitted columns, and unrecognized columns. Read
these from the application; the saved HTML report does not reproduce every UI
counter. Do not add overlapping counters into a single coverage percentage.

Review unexpected results before drawing conclusions. Record **Clear files** and
export behavior too. Reports may contain original values, so keep them local.
When sharing feedback, use counts, finding codes, and generic descriptions only.
Any reproduction added to the repository must use separately constructed
synthetic data. This exercise does not perform an import or establish how the
Shopify importer will handle the update.

## Evidence still needed

The [20 October pagination/export run](PAGINATION_VALIDATION.md) passed 106 Node
tests and 16 browser groups per route in Windows Chrome and Edge, with sandboxing
enabled. It verifies 100 synthetic findings across 40/40/20 rows, filter/search
resets and complete exports after filtering. This is automated evidence, not
an extension of the manual owner confirmations below.

Automated Windows/Chrome checks passed on 18 October 2026 with sandboxing enabled
through both direct-file and localhost navigation. The demo, exact sample pair,
clearing, downloaded reports, and nine linked scenarios passed; see
[WINDOWS_VALIDATION.md](WINDOWS_VALIDATION.md) for results and screenshots.
[SCENARIO_VALIDATION.md](SCENARIO_VALIDATION.md) retains the cloud scenario record.
Automated [Windows/Edge validation](EDGE_VALIDATION.md) on 19 October 2026 also
passed 15 browser groups per route, the synthetic START_HERE workflow and nine
scenarios, with sandboxing enabled.

The separate [guided manual owner record](MANUAL_OWNER_VALIDATION.md) on
19 October 2026 transcribes owner confirmations of Chrome/Edge Explorer launch,
Windows file selection, demo/sample comparison, clearing, and independently
readable HTML reports. Four additional scenarios passed manually in Chrome,
not Edge. This is guided owner feedback, not a rerun of automated evidence.
Separate manual legacy/current-header selection, the remaining scenario matrix,
other browser versions, real merchant comparisons and controlled development-store
import round trips remain open. Each requires its own recorded outcome.

The earlier cloud attempt to retrieve Shopify's official sample returned HTTP
403. A later Windows retrieval on 18 October 2026 succeeded and reproduced two
template compatibility gaps: `Active` status and blank continuation option names.
The focused fixes and regression tests now pass, including actual official-sample
selection and report reopening in sandboxed Chrome through both launch routes.
See [SHOPIFY_SAMPLE_VALIDATION.md](SHOPIFY_SAMPLE_VALIDATION.md) for the source,
hash, before/after results and screenshots. Included `samples/` files remain
independently constructed synthetic fixtures; the public CSV is not committed.
