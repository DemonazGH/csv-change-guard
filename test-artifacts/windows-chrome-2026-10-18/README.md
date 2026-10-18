# Windows/Chrome evidence — 18 October 2026

Captured from commit `99ca694a23dff180642a7a3c84d2765450a41a3a`, with installed
Google Chrome 155.0.8059.80 on Windows 11. Sandboxing was enabled on every launch.
See [the validation report](../../docs/WINDOWS_VALIDATION.md) for results,
commands, screenshot links and limitations.

This directory is an immutable record of that run, not evidence of later
commits passing. Historical files at the `test-artifacts/` root are preserved.
Future runs should use fresh ignored `.local-test-artifacts/` directories.

- `engine-tests.txt`: 92 passing engine/scenario tests.
- `browser/file-*` and `browser/url-*`: 14 passing browser groups in each mode,
  screenshots, synthetic HTML/CSV/JSON exports and the original result schema.
- `start-here/`: demo/sample workflow, downloaded reports, nine browser-selected
  scenarios, screenshots and the supplemental result with Chrome launch flags.
- `run-summary.json`: run timing, commands, exit codes and repository integrity.
- `tracked-files-before.json`: SHA-256 values of all 59 tracked checkout files
  before testing; all matched after the run.
- `start_here_test.py.txt`: historical supplemental script snapshot, with local
  paths replaced; restore paths and select a fresh output directory before any
  reproduction. It is not a maintained test runner.
- `artifact-manifest.json`: original and published SHA-256 values. Screenshots,
  exports, plain-text logs and dependency-version records were copied without
  edits. Recorded JSON results, including JSON console logs, use the path
  normalization below.

Metadata normalization replaces the checkout with `<repository>`, this artifact
directory with `<validation-artifacts>`, the temporary Codex task directory with
`<codex-task>` and the Windows user home with `<user-profile>`. These are literal
placeholders, including inside recorded file URIs. Result counts, timestamps,
errors, versions and sandbox flags are unchanged. The script snapshot uses the
same replacements. The original local evidence remains outside the repository.

All catalog data is synthetic. Do not add real merchant files or reports here.
