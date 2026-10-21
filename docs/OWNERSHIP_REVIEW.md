# Bounded ownership/provenance review - 22 October 2026

The owner confirmed on 22 October that this is their own project, made with
ChatGPT/Codex, with no employer/client or copied-asset claims. The repository
audit found no declared third-party runtime library or bundled font/image in
the beta ZIP requiring an identified additional redistribution licence. This
supports drafting, not certification of title, noninfringement, exclusive
copyright in AI-assisted output or trademark rights.

## Evidence and limits

- Root commit `2e8346c` imported the prototype ZIP on 18 October. The
  [handoff](CODEX_HANDOFF.md) says it had no prior Git history. Git authorship
  does not prove pre-import ownership; the owner's confirmation is separate.
- `package.json` is `private: true`, `license: UNLICENSED`, with no npm dependencies.
  No tracked LICENSE, NOTICE or COPYING file was found. An absent notice alone
  does not prove every line is original or cleared.
- The build embeds local engine/app/demo/CSS; Node code uses built-in modules.
  The interface has text marks and system font stacks. No runtime external
  scripts, fonts, bundled images or SVGs were found in the app/release payload.
- Optional Playwright/GitHub Actions are development tools, excluded from the
  customer's ZIP and not relicensed by the proposed EULA.
- The release allowlist contains the app, optional local server, help/start/
  not-for-sale text and three synthetic CSVs, plus metadata. Test screenshots,
  comparison evidence and the official Shopify template are excluded. Public
  template availability is not a blanket redistribution licence.
- The separate prelaunch website source is outside this checkout and was not
  independently covered by this bounded repository audit.
- No similarity search, employer/client contract review or legal AI-copyright
  determination was performed. The applicable AI-service agreement at original
  creation cannot be established from Git metadata and has not been certified.

Keep original creation/export records and Git history privately. Retain any
outside permissions/assignments if contributions are introduced. Confirm the
applicable AI-service/account agreement and rights in inputs; AI output is not
assumed unique or guaranteed clear of third-party claims.

The supplier can grant only rights it holds, subject to mandatory software-user
rights. The draft does not open-source the repository. Keep `UNLICENSED` and the
current internal ZIP status unchanged. Name/trademark availability is a separate
remaining check.
