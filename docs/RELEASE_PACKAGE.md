# Free beta download package

The owner selected free distribution of the full existing utility on
18 November 2026. Package `0.1.0-beta.2` is the **free beta**, with the unchanged
v0.1.0 application and explicit [free-use terms](../release/free-beta-terms.html).
It accepts users' own supported files, processes them locally and contains no
payment, account, activation or upload integration. Live sales remain disabled.

The terms accompany the package as `FREE_BETA_TERMS.html`. They permit continued
use of the delivered version without a fee under their stated conditions;
they do not promise lifetime updates, support or hosted downloads. The grant
is specific to the official free-beta package. The public repository retains
its `UNLICENSED` designation; free distribution does not make it open source.

The earlier `0.1.0-beta.1` was an internal preview, not a public free-use release.
Its [preparation evidence](BETA_PREPARATION_VALIDATION.md), historical marker
source and paid-commerce drafts retain their dated scope. They do not govern
the new free-beta download.

## Build from the repository root

Node.js is needed to build the package, not to open the delivered app. No npm
dependencies or install step are required.

```powershell
npm.cmd test
npm.cmd run package:beta -- --output .local-test-artifacts/free-beta-release
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
  FREE_BETA_TERMS.html
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
Source history, tests, evidence, credentials, private fixtures, marketing drafts,
paid-commerce drafts and the old internal-preview marker are excluded. Inputs
must be ordinary files without linked path components. Outputs within protected
source directories are refused.
Do not choose an output destination managed by another process.

The manifest records candidate/app versions, `free-beta` status, the terms-file
path, payload sizes and SHA-256 digests. `SHA256SUMS.txt` covers the payload and
manifest, but cannot hash itself.
The archive SHA-256 is printed separately by the builder. Archive entries use
fixed metadata and no compression for reproducibility. Identical input bytes
produce identical ZIP bytes; Git line-ending conversion can change input bytes
between checkouts, so do not assume cross-platform archive hashes match without
comparing inputs. Checksums detect changes, not publisher authenticity or safety.

`release/help.html` is the source template for the packaged help; its app/sample
links target the package layout. Open the extracted package's `help.html` for a
working customer preview rather than the template in the source directory.
The release builder exports `getReleaseMetadata(applicationVersion)` for the
website builder to use the exact version, archive filename and terms filename.
Version and archive naming must agree across package, download link and help.

## Verify the free download

1. Run tests/build and record source revision, runtime and archive checksum.
2. Extract the ZIP into a fresh folder. On Windows, use Extract All. Check the
   manifest/digests and confirm no unexpected files are present.
3. Follow the packaged start instructions. Verify help links, the demo, sample
   selection, clearing and independent report opening in the intended browser.
   Keep sandboxing enabled; do not weaken managed-browser settings.
4. If testing the optional server, run the copied `server.cjs` from the extracted
   package and stop it afterwards. It binds only to localhost and accepts no uploads.
5. Compare the bundled app bytes with `dist/index.html`. Customer help changes
   must not silently change the comparison engine.
6. Follow the website's actual download link, compare the downloaded ZIP hash
   with the built artifact, and confirm the website and packaged terms match.
   A localhost test of this route is separate from verifying public HTTPS delivery.

Automated package tests exercise archive integrity, exact terms delivery,
free-beta metadata, unchanged application bytes and repository licensing,
deterministic output, allowlisting, checksums and refusal behavior. CI also
builds the real package. Earlier Windows evidence for beta.1 is historical;
record fresh beta.2 checks separately, including how extraction was performed.
Do not label scripted extraction as a manual Windows Extract All confirmation.

The [unassisted synthetic trial protocol](UNASSISTED_BETA_TRIAL.md) and
[participant task card](UNASSISTED_BETA_TASK_CARD.md) remain useful for planned
independent trials. Preparing or distributing a package does not establish
that a participant completed a trial or found the report useful.

Any later paid offer requires a separate decision, clear applicable terms and
completion of the [remaining purchase gates](PAID_BETA_PREPARATION.md). A later
price decision does not retrospectively revoke the free version's granted use
rights. Do not activate sales or add a payment gate to this free release.
