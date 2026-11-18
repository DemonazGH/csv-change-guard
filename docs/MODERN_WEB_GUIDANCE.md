# Modern Web Guidance application

Reviewed and applied on **18 November 2026** to `website/`, based on `05daafb`.
This record covers the local implementation and tests. Publication progress is
recorded in the change's PR. Live sales are disabled.

## Source and installation

The owner requested Google's Modern Web Guidance 1.0. The installed skill is
[`modern-web-guidance` v1.0.0](https://github.com/GoogleChrome/modern-web-guidance/tree/v1.0.0/skills/modern-web-guidance),
from commit `4dd968349e54ca45a05dd5c818fb035c9054b022`, with skill-version marker
`2026_11_09-5bcc021b`. It was installed into the owner's Codex skills directory
using the bundled skill-installer. It becomes discoverable on the next turn and
was read and applied directly during this task.

`AGENTS.md` now instructs future website work to read that skill, search focused
UI topics, retrieve relevant guides, follow their compatibility/fallback advice
and record actual evidence. It includes portable upstream references and pinned
CLI examples. CLI telemetry was disabled for each process using
`DISABLE_TELEMETRY=1`. The skill, CLI and audit dependencies are development
tools outside the application and public build.

## Applied guidance

| Guide | Website change |
| --- | --- |
| [`respect-os-text-scale`](https://github.com/GoogleChrome/modern-web-guidance/blob/v1.0.0/skills/modern-web-guidance/guides/accessibility/respect-os-text-scale.md) | Relative font sizes, scalable control spacing, em breakpoints and native text-scale opt-in on the four authored pages. The browser controls the root font size. |
| [`responsive-design`](https://github.com/GoogleChrome/modern-web-guidance/blob/v1.0.0/skills/modern-web-guidance/guides/css/responsive-design.md) and [`typography`](https://github.com/GoogleChrome/modern-web-guidance/blob/v1.0.0/skills/modern-web-guidance/guides/css/typography.md) | Fluid heading sizes combine rem and viewport units with relative bounds. Header/price content wraps, grid children can shrink, and tour values reflow as text grows. |
| [`accessibility`](https://github.com/GoogleChrome/modern-web-guidance/blob/v1.0.0/skills/modern-web-guidance/guides/accessibility/accessibility.md) | Keyboard skip links target focusable headings, programmatically focused demo headings retain visible outlines, and styled lists retain explicit list semantics for Safari's documented behavior. |
| [`security`](https://github.com/GoogleChrome/modern-web-guidance/blob/v1.0.0/skills/modern-web-guidance/guides/security/security.md) | Adds HTTP `Content-Security-Policy: frame-ancestors 'none'` alongside `X-Frame-Options: DENY`. Existing restrictive meta CSPs still apply. |

The previously compressed CSS was expanded into readable rules while converting
font units. The branding, supplied examples, report content and comparison
logic are preserved. The small guide table keeps its native headers, caption
and named keyboard-focusable overflow container. Its four rows do not require
a new stacked-table widget.

The `css`, `responsive-table`, `privacy` and `performance` disciplines were also
reviewed. Existing native controls, deferred same-origin scripts, system fonts,
textContent-based rendering and limited static payload already address the
applicable patterns. No backend, tracking, reporting endpoint, external font,
runtime dependency, new data flow or payment behavior was introduced.

The text-scale meta feature has limited availability in the pinned guide. Its
documented fallback is normal browser text sizing and manual zoom where the
opt-in is unsupported. The relative CSS remains useful in those browsers.
No Firefox, Safari or physical mobile-device pass is claimed.

## Fresh Windows evidence

Windows 11 build 26100, Node **24.12.0**, Python **3.14.0**, Playwright **1.62.0**.
Installed Chrome **157.0.8103.79** and Edge **157.0.4341.60** were launched
headlessly in fresh contexts with sandboxing enabled. Launch arguments were
checked for security-disabling flags.

| Check | Result |
| --- | --- |
| `npm.cmd test` before changes | 114 passed |
| `npm.cmd test` after changes | 114 passed |
| `npm.cmd run build:website` | 14 allowlisted files |
| Existing website browser workflow, 1440 and 390 px | Passed in both browsers |
| All four pages, 320 and 1440 px, 1× and 2× emulated OS text scale | Passed in both browsers |
| Keyboard skip links and visible heading focus | Passed in both browsers |
| Enlarged-text demo run, filters, reset and ordinary comparison | Passed in both browsers |
| Emulated reduced motion and forced colors | Passed in both browsers |
| Generated report download and independent reopening after closing demo context | Passed in both browsers at 1440 and 390 px |
| JavaScript-disabled and failed-engine-load static report fallbacks | Passed in both browsers |
| Source app and generated `dist/` diff | No changes |

The scaling check uses the documented CDP
[`Emulation.setEmulatedOSTextScale`](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setEmulatedOSTextScale)
with scale 1 and 2. The root font changed from 16 to 32 px. At 320 px, body text
changed from 16 to 32 px. At 1440 px, the em breakpoint changed the body base
from 17 to 32 px while the root doubled. Fluid headings grew according to their
relative/viewport formula. The tests check actual font growth, focus and reflow
across responsive breakpoints rather than assuming every computed size has an
identical multiplier.

No horizontal page overflow was found. The essential data table can scroll
within its named focusable wrapper. Selected normal, enlarged-text and
forced-color screenshots were visually inspected. These are browser emulations
and automated checks. Physical OS settings, assistive technology and independent
user comprehension remain separate checks.

The optional **axe-core 4.14.1** audit found zero violations across eight states
at 1440 × 1000 in sandboxed Chrome. Checked tags were `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa` and `wcag22aa`. States covered the four pages, comparison
results and all three tour steps. Incomplete color-contrast checks concerned
only decorative `aria-hidden` arrow spans reported as non-text characters.
These automated results establish no full WCAG conformance claim.

Evidence is in [the synthetic-only artifact folder](../test-artifacts/modern-web-guidance-2026-11-18/).

- [Chrome focus indication](../test-artifacts/modern-web-guidance-2026-11-18/chrome-tour-focus-390.png)
- [Chrome enlarged-text tour](../test-artifacts/modern-web-guidance-2026-11-18/chrome-tour-text-scale-2.png)
- [Edge forced colors](../test-artifacts/modern-web-guidance-2026-11-18/edge-forced-colors.png)

## Commands and remaining checks

The skill workflow used focused searches for text scaling, keyboard focus,
responsive tables and secure rendering, followed by retrieval of the relevant
guides. The commands below show the pinned workflow and browser checks. The
existing test virtual environment is reused.

```powershell
$env:DISABLE_TELEMETRY='1'
npx.cmd -y modern-web-guidance@1.0.0 search 'respect text scale' --skill-version 2026_11_09-5bcc021b
npx.cmd -y modern-web-guidance@1.0.0 retrieve 'respect-os-text-scale,responsive-design,typography,css'
npm.cmd test
npm.cmd run build:website
.local-test-artifacts/website-venv/Scripts/python.exe tests/website_browser_test.py `
  --site-dir .local-test-artifacts/public-site `
  --browser-executable 'C:/Program Files/Google/Chrome/Application/chrome.exe' `
  --artifacts-dir .local-test-artifacts/mwg-final-chrome-2026-11-18
.local-test-artifacts/website-venv/Scripts/python.exe tests/website_browser_test.py `
  --site-dir .local-test-artifacts/public-site `
  --browser-executable 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' `
  --artifacts-dir .local-test-artifacts/mwg-final-edge-2026-11-18
```

The axe script was obtained with `npm.cmd pack axe-core@4.14.1` in the ignored
audit directory. Its local reproduction helper and raw results remain in
`.local-test-artifacts/mwg-audit/`. Neither is included in the website output.

After reviewed publication, check the new HTTP framing policy and public page
behavior. Independent screen-reader and physical-device checks remain open.
Earlier purchase/privacy/withdrawal, delivery, refund and paid-demand gaps
remain separate from this website guidance update.
