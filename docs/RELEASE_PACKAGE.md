# Internal beta package

The package is a review candidate, **not for sale**. It keeps CSV processing
local and contains no payment integration. Version `0.1.0-beta.1` identifies
the packaging candidate; the bundled app remains v0.1.0. Nothing in the
package grants an effective commercial license.

## Build from the repository root

Node.js is needed to build the package, not to open the delivered app. No npm
dependencies or install step are required.

```powershell
npm.cmd test
npm.cmd run package:beta -- --output .local-test-artifacts/release
```

On other platforms, use `npm` in place of `npm.cmd`. The command rebuilds
`dist/index.html`, then creates a dedicated version directory with a ZIP and
an inspectable extracted tree. It refuses an existing candidate directory;
choose a new output parent for a second build. It does not delete old outputs.
For a source checkout, run `git diff --exit-code -- dist/index.html` after
building and investigate unexpected changes.

## Explicit contents

```text
CSV-Change-Guard/
  DRAFT-NOT-FOR-SALE.txt
  START_HERE.txt
  help.html
  dist/index.html
  server.cjs
  samples/current-catalog.csv
  samples/proposed-update.csv
  samples/unchanged-update.csv
  manifest.json
  SHA256SUMS.txt
```

The builder reads a fixed allowlist. It never recursively archives the checkout.
Source history, tests, evidence, credentials, private fixtures, marketing drafts
and draft contracts are excluded. Inputs must be ordinary files without linked
path components. Outputs within protected source directories are refused.
Do not choose an output destination managed by another process.

The manifest records candidate/app versions, status, payload sizes and SHA-256
digests. `SHA256SUMS.txt` covers the payload and manifest, but cannot hash itself.
The archive SHA-256 is printed separately by the builder. Archive entries use
fixed metadata and no compression for reproducibility. Identical input bytes
produce identical ZIP bytes; Git line-ending conversion can change input bytes
between checkouts, so do not assume cross-platform archive hashes match without
comparing inputs. Checksums detect changes, not publisher authenticity or safety.

`release/help.html` is the source template for the packaged help; its app/sample
links target the package layout. Open the extracted package's `help.html` for a
working customer preview rather than the template in the source directory.

## Verify before sharing an approved release

1. Run tests/build and record source revision, runtime and archive checksum.
2. Extract the ZIP into a fresh folder using Windows Extract All. Check the
   manifest/digests and confirm no unexpected files are present.
3. Follow the packaged start instructions. Verify help links, the demo, sample
   selection, clearing and independent report opening in the intended browser.
   Keep sandboxing enabled; do not weaken managed-browser settings.
4. If testing the optional server, run the copied `server.cjs` from the extracted
   package and stop it afterwards. It binds only to localhost and accepts no uploads.
5. Compare the bundled app bytes with `dist/index.html`. Customer help changes
   must not silently change the comparison engine.

Automated package tests exercise archive integrity, deterministic output,
allowlisting, checksums and refusal behavior. CI also builds the real candidate.
Fresh Windows browser results for the extracted candidate are recorded in
[beta preparation validation](BETA_PREPARATION_VALIDATION.md). These are separate
from the earlier manual owner confirmations and do not validate payments.

The [unassisted synthetic trial protocol](UNASSISTED_BETA_TRIAL.md) and separate
[participant task card](UNASSISTED_BETA_TASK_CARD.md) are prepared for a later
owner-authorised review using this unchanged candidate. No trial has been run
by preparing the packet. It is not added to the ZIP and grants no new licence
or distribution permission.

Before any paid release, finish the [remaining gates](PAID_BETA_PREPARATION.md),
approve effective terms and contact details, and deliberately update the package
status/version/content policy. Removing a draft marker alone is insufficient.
