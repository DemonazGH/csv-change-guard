# First task for Codex

Copy the prompt below into a new Codex session opened at this repository root.
The first task establishes an independent baseline, not a redesign.

```text
You are taking over CSV Change Guard v0.1.0, an existing local, read-only
Shopify CSV comparison prototype. Continue this project; do not recreate it.

Read AGENTS.md, docs/CODEX_HANDOFF.md, README.md, docs/PRODUCT_SCOPE.md,
docs/SECURITY_AND_PRIVACY.md, and docs/TEST_REPORT.md. Inspect the actual source,
package scripts, and tests rather than trusting the documentation alone.

The business goal is a small, self-service product with minimal ongoing manual
work. Keep deterministic local processing, explicit scope limits, and the
standalone build. No store writes, data uploads, model APIs, billing, analytics,
framework migration, or deployment are part of this task.

First:
1. Record the runtime/tool versions and inspect git status. Do not discard any
   existing edits. Run npm test and npm run build from the repository root
   (npm.cmd is an alternative on Windows). No npm install is required today.
2. Explain the architecture, comparison identity rules, and major limitations.
3. Inspect the browser-test harness. Attempt normal localhost and file launch
   only where the environment permits. Do not bypass security restrictions.
   Record tests as passed, failed, blocked, or not run with their actual mode.
   Do not report the historical 11 browser checks as a new successful run.
4. Produce docs/BASELINE_REVIEW.md with evidence-backed issues and the smallest
   proposed next PR: portable browser smoke tests and a reproducible setup.
5. Recommend acceptance criteria for that PR and flag any urgent correctness
   or security finding separately, with file locations and reproduction steps.

Do not modify application logic or install dependencies in this first task.
Do not create a remote repository, push, merge, publish, spend money, or access
real customer data. Do not claim full Shopify import compatibility.

Finish with: files changed, commands actually executed, results, blocked checks,
and a short next-step recommendation. Stop after the baseline review.
```

## Suggested second task, after reviewing the baseline

Implement only the reviewed browser-test portability change. Preserve application
behavior and add a documented dependency setup. Run the suite against the actual
localhost application and the standalone file when allowed. Keep policy-blocked
checks explicit and retain all existing assertions. Any browser sandbox disabling
must be a justified opt-in for a constrained environment, not a global default.
Do not add a runtime dependency to the application merely to run development tests.

Keep CI as a separate small reviewable task unless the owner explicitly combines
it with this change. No auto-deployment, credentials, or paid integrations.
