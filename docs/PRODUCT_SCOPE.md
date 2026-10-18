# Product scope — v0.1.0

## Customer hypothesis

A small ecommerce operator or catalog administrator wants a second, understandable review of a bulk product update without installing a store app or providing credentials. This customer/problem hypothesis is not yet validated by paid usage.

## Product promise to test

> Review the changes before the import.

Do not claim “100% safe”, “all errors detected”, “Shopify-certified”, or guaranteed financial savings.

## Core comparison contract

1. Inputs are a baseline and a proposed update in the supported Shopify product-CSV subset.
2. Exact handle + SKU pairs establish comparison identity; no fuzzy matching or row-position inference.
3. Identifiers remain case-sensitive. Invalid surrounding whitespace is reported, not silently repaired.
4. Missing/duplicate SKUs are excluded; the report shows incomplete comparison.
5. Product fields are read from the first row for each handle. Conflicting populated continuation values exclude the affected product field.
   Blank Option1/2/3 names on continuation variants use the clear first product
   row's name within the same handle and input file. Values are never inherited;
   omitted columns, whitespace names, populated names and unclear first rows
   are not filled or repaired. Findings show effective option names.
6. Images and image-only continuation records are outside variant comparison.
7. Only columns present in both files are compared. Explicit blanks differ from missing columns. Omitted columns can still participate in platform dependencies/defaults; preservation is not guaranteed.
8. Omitted rows are not deletion instructions.
9. Monetary threshold arithmetic is deterministic and exact within the supported decimal range. AI makes no matching or pricing decisions.
10. Overwrite-disabled mode does not compare changes for handles already present in the baseline. Live-store existence is unknown.
11. Exactly `Active`, as used in Shopify's official template, is equivalent to
    `active` in status validation, comparison and repeated product fields. Other
    capitalization or whitespace is not normalized. Genuine changes retain the
    raw status text in findings and exports.

## Finding levels

| Level | Meaning |
|---|---|
| Blocking | The tool could not reliably assess some input, or found a selected structural issue. Does not claim that Shopify will reject the file. |
| High | Potentially consequential change needing human review, such as a zero price, threshold breach, clearing, or changed option value. |
| Warning | Coverage gap, unmatched update record, selected inconsistency, or visibility change. |
| Info | Ordinary change or scope information, such as a baseline row absent from a partial update. |

A record can generate several findings. Counters distinguish compared variants, changed prices, and finding totals.

## Deliberately excluded

Live import simulation; backup execution; inventory and multi-location rules; taxes; shipping; product and variant images; markets; metafields; comprehensive option-combination validation; all Shopify field dependencies; arbitrary supplier schemas; PDFs; XLSX; semicolon CSV; payments; accounts; telemetry; API inference.

## Version-one architecture

Static browser application with a dependency-free JavaScript core. A standalone HTML file is built from readable source. Selected input files are decoded and compared in memory. Exported reports are local downloads. The optional development server serves only the static HTML; it has no upload endpoint.

## Future reuse

Keep the deterministic comparison engine separate from the interface so it could later be wrapped as a CLI, paid API, marketplace component, or licensed partner tool. This preserves the original reusable-tool backlog idea without requiring consulting or a BC/AX-specific product.
