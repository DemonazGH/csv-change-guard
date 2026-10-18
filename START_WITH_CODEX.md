# Start CSV Change Guard in Codex

## Recommended setup

Use an extracted local Git repository and the official Codex extension in VS Code
for the first development session. Keep a private GitHub remote as the canonical
shared copy. Codex Cloud is an optional second working environment, not a separate
copy of the product to maintain manually.

You do not need to paste the HTML or the complete brainstorming conversation.
The source tree and the included handoff documents provide the project context.

## 1. Extract the whole archive

Suggested Windows project path:

```text
C:\Projects\csv-change-guard
```

Open the folder containing `package.json` and `AGENTS.md`, not just `dist/` or the
outer ZIP folder. All original source, tests, samples, and reports are included.

## 2. Verify and checkpoint

With Node.js/npm and Git installed, open PowerShell in that project folder.
Run each command separately and stop if a command fails:

```powershell
node --version
npm.cmd --version
npm.cmd test
npm.cmd run build
```

There are no npm dependencies, so do not add an unnecessary installation step.

For a newly extracted folder that is not already a Git repository:

```powershell
git init -b main
git status --short
git add .
git diff --cached --stat
git commit -m "Import CSV Change Guard v0.1.0 with Codex handoff"
```

Review staged files before committing. Do not add merchant data or secrets.
If Git has no commit identity configured, set your intended personal identity
locally for this repository rather than overwriting an employer's global identity.
No remote is created or changed by these commands.

Keep the source tree private. Publish it to a private repository in your personal
GitHub account using your preferred Git client. Commit the extracted files, not
only the ZIP or standalone HTML. Give Codex access only to the repository needed
for this project. No real customer data or credentials should be in that remote.

## 3. Open local Codex

Open the project in VS Code. Install the official Codex extension through the
OpenAI documentation's installation link and sign in with your ChatGPT account.
Use the Codex sidebar in this workspace. Keep workspace-scoped permissions and
review requests for extra network/filesystem access; unrestricted access is not
needed to reproduce the engine tests and build.

Alternatively, use an already configured Codex desktop/local client or launch
`codex` from the same repository directory in the terminal. The files and handoff
are the same regardless of client. GitHub is not a prerequisite for that local
session; it is recommended for history sharing and the cloud workflow.

## 4. Start with the provided task

Read `docs/CODEX_FIRST_TASK.md` and paste its prompt into Codex.
The first output should be a reviewed baseline and a small next task, not a new
application. Keep completed changes in focused commits or pull requests.

Codex reads repository `AGENTS.md` guidance before starting work. It contains
persistent engineering constraints and points to the longer project handoff.
This is more reliable than assuming all earlier chat context has been attached.

## Optional: browser-based Codex Cloud

After the source is in the private GitHub repository:

1. Open Codex on the web, or the cloud task interface in the desktop client.
2. Create a cloud environment and select the repository; connect GitHub if prompted.
3. Tell setup that the engine/build need Node/npm but no package installation.
   Use `npm test` and `npm run build` as the initial verification commands.
   No environment secrets or product API keys are required.
4. Review the environment configuration and network permissions, then publish
   the environment for your own use. This prepares a development environment;
   it does not launch the product publicly.
5. Start a task with `docs/CODEX_FIRST_TASK.md`, then review the output and changes
   before committing or opening/merging a pull request.

The current documented creation route is Work in > Cloud > Select environment >
Create environment, or Settings > Codex Cloud > Environments. UI labels and
availability can differ by rollout/workspace; use the current official guide.
Cloud access is subject to account and workspace eligibility.

## What this handoff changed

Only new documentation and verification metadata were added. Every original
archive file, including `dist/index.html`, is unchanged. Engine tests and the build
were rerun; browser checks were not rerun. See `docs/HANDOFF_VERIFICATION.json`.

No GitHub repository, Codex environment, public deployment, account connection,
subscription, or payment setup has been created by preparing this archive.

## Official references (checked 18 October 2026)

- [Codex IDE extension](https://learn.chatgpt.com/docs/codex/ide)
- [AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex Cloud setup](https://learn.chatgpt.com/docs/environments/cloud-environments)
- [CLI and Git checkpoints](https://learn.chatgpt.com/docs/codex/cli)
- [Account access and sign-in](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
- [Windows sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox)
