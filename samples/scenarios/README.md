# Synthetic catalog workflow scenarios

These files contain invented products and identifiers. They are reusable inputs
for manual review and `tests/scenarios.test.cjs`; no merchant data, store access,
or external image requests are needed. Open the app, choose `catalog.csv` as the
current catalog, and choose an update below. Use the default 30% threshold with
overwrite enabled unless testing a different assumption deliberately.

The baseline has three products, six variants, and one image-only continuation
record. Linen shirts have three sizes; mugs have two colours; the tea tin has
one default variant. Product fields appear on the first record of each handle.
The shirt description contains a quoted comma, escaped quotes, a newline, and
Polish, Japanese, and French text. The image uses the reserved `example.invalid`
domain and is outside comparison coverage.

| Proposed update | Expected compared variants / price changes | What to review |
|---|---|---|
| `catalog.csv` | 6 / 0 | No changes. Both inputs disclose that images are unassessed; this is not a clean import approval. |
| `partial-prices.csv` | 2 / 2 | LINEN-M changes 30.00 → 38.999999, just below 30%; MUG-BLUE changes 12.50 → 8.75, exactly −30%. Four absent variants are informational, not deletions. Omitted product/compare-at columns are unassessed, not blanked. |
| `explicit-clears.csv` | 6 / 0 | Three explicit clears: shirt description, mug vendor, tea tin compare-at price. Blank continuation cells do not generate extra clears. |
| `reordered.csv` | 6 / 0 | Groups and variants change order. Each product's populated fields move to its new first row. No inferred changes from row positions. |
| `changed-identifiers.csv` | 3 / 0 | Shirt S gets a different SKU; both mugs get a different handle. The three rows remain unpaired despite also changing their prices. No guessed before/after prices. |
| `invalid-identifiers.csv` | 2 / 0 | One missing SKU, one spaced SKU, one spaced handle, and one missing handle leave four rows unpaired. Blocking findings make incomplete coverage visible. |
| `duplicate-identifiers.csv` | 5 / 0 | Two LINEN-M records propose different prices. Both are excluded; neither price is selected arbitrarily. Reverse the inputs to exercise ambiguous baseline prices. |
| `mixed-header-prices.csv` | 6 / 1 | Current and legacy aliases coexist for different fields. LINEN-L changes 30.00 → 39.00. Inventory is explicitly unassessed. The image-only row keeps all non-image cells empty. |
| `unusual-prices.csv` | 6 / 5 | `30.0` equals `30.00`. Four malformed or blank prices have no calculated percentage; the real zero price for MUG-RED is a high-priority change. |

The partial price file retains Title and option identifiers required by this
prototype. “Omitted” describes comparison coverage; it does not promise how an
actual importer handles dependencies or defaults. Changed identifiers, missing
identifiers, and duplicate identifiers do not prove additions or deletions.

The automated scenarios also make a conflicting continuation vendor and verify
that only that product field is excluded while an independent price change is
reported. They generate a 5,000-record, two-variants-per-product update in memory
with eight selective price changes, a renamed SKU, a missing SKU, and a duplicate
key. Expected results are 4,996 compared variants, four unpaired update rows,
and eight price changes. Prices exercise six-decimal threshold boundaries,
zero transitions, the maximum supported integer width, and a one-millionth
change. No large fixture or machine-dependent timing assertion is stored.

Run the scenario checks directly with:

```text
node --test tests/scenarios.test.cjs
```

Assertions check affected identifiers, exact before/after values, logical record
numbers, exclusions, and coverage findings. They are not snapshots of complete
reports: generated timestamps, finding IDs, and presentation order are not the
behavioral contract. These checks validate the documented comparison subset;
Shopify importer round trips and real customer workflows remain untested.
