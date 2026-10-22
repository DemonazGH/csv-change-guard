# Unassisted synthetic beta trial owner protocol

**Prepared 22 October 2026. Trials: Not run.** This packet prepares an observed,
uncoached usability trial. It supplies no new participant, browser, payment or
merchant-validation evidence. Live sales remain disabled. The application,
help and existing `0.1.0-beta.1` ZIP are unchanged.

## Purpose and permissions

Find out whether an intended catalog operator can start from the internal ZIP,
use its help, understand comparison limits and read a saved report without live
coaching. This is a small qualitative trial, not a general usability score,
proof of paid demand, Shopify import test or launch approval.

Before recruiting anyone or sharing a candidate, the owner must deliberately
authorise the recipient, review purpose and permission to use the candidate.
This packet does not send an invitation, authorise distribution, or grant an
effective commercial licence. Keep the existing `UNLICENSED` status and
`internal-preview-not-for-sale` package status. Do not remove draft markers.

Use only shipped synthetic files. No store access, purchase, catalog upload,
private merchant files, credentials or customer data are needed. Separate
authorisation and a separate protocol are needed for later merchant-file work.
Do not enable sales or change account settings for this trial.

## Prepare the session

1. Identify the candidate using its archive SHA-256 and `manifest.json`:
   candidate `0.1.0-beta.1`, app `0.1.0`, status
   `internal-preview-not-for-sale`. Follow the integrity checks in
   [the release procedure](RELEASE_PACKAGE.md). Verify the actual file selected
   for this trial; a matching name alone is insufficient. Do not rebuild or
   replace the candidate as part of these instructions.
2. Confirm that the existing ZIP contains `CSV-Change-Guard/START_HERE.txt`,
   `help.html`, `dist/index.html`, `server.cjs`, and the three CSV files under
   `samples/`: `current-catalog.csv`, `proposed-update.csv` and
   `unchanged-update.csv`. `manifest.json`, `SHA256SUMS.txt` and the draft notice
   remain with the package. Scenario fixtures elsewhere in this repository are
   outside this trial.
3. Choose an intended user familiar with preparing catalog updates. Record only
   an anonymous trial ID and role category. An owner rehearsal or someone who
   has already been coached can help check the packet, but does not replace an
   independent intended-user trial. Aim for several intended users before
   drawing broader conclusions; do not invent a sample size already completed.
4. Give the participant only the separately authorised candidate and
   [participant task card](UNASSISTED_BETA_TASK_CARD.md). Keep the observer
   criteria below separate until the tasks and questions are finished. The
   ordinary packaged help is allowed and already contains demo answers; record
   help use rather than claiming unaided discovery or recall.
5. Explain that stopping or asking for help is welcome. Ask only to observe the
   synthetic app workflow; close unrelated tabs before any agreed observation.
   Do not record audio/video or collect screenshots by default. Save a blank
   copy of the record below outside Git and the AI-accessible checkout before
   filling it in. Do not put names, emails, company names or identifying free
   text into the record.

The usual route is Windows extraction and an installed Chrome or Edge browser.
If local HTML is blocked, the participant may use the packaged help's localhost
route when Node.js is already installed and device policy permits it. Record
the blocked first route and any assistance. Stop the copied server afterwards.
Do not install dependencies, terminate unfamiliar processes, or disable browser
security or sandboxing to obtain a successful outcome.

## Observe without coaching

Start timing when the participant receives the ZIP and card. Record elapsed
time to the first report and to completion, including pauses or technical
blocks. Time is descriptive; there is no speed-based pass mark.

Let the participant work through the card and use the supplied help. Do not
point to controls, supply expected counts, explain a finding, confirm an answer
or operate the app for them before recording their attempt. Use the same neutral
prompt, such as "Please explain how you reached that conclusion," when needed.

If help is requested, record the task, elapsed time, problem and exact
intervention before assisting. Mark the affected task or answer **Assisted**,
even if it later succeeds. A privacy or device-policy concern ends that attempt;
mark it **Blocked**. Do not leave a participant stuck merely to preserve an
unassisted label. Record confusion before explaining it in a later debrief.

## Observer criteria

Keep this section separate from the participant card until the tasks are done.

Use **Independent**, **Assisted**, **Blocked** or **Not run** for task completion.
For explanations use **Understood**, **Unclear**, **Assisted** or **Not asked**.
"Understood" means the participant can explain the point in their own words,
with normal packaged help allowed. Reading a matching counter alone does not
establish comprehension. Record unexpected technical results as discrepancies;
do not silently score them as a participant mistake.

| Task | Observable completion | Comprehension to assess |
|---|---|---|
| Start and demo | Extracted package opened; a demo report is visible | Can find and use the supplied instructions without live coaching |
| Review and saved report | A finding is inspected; a newly saved HTML report opens after the app tab closes; source filenames/settings and coverage can be located | Explains why ambiguous duplicate identifiers leave rows unmatched and the comparison incomplete; does not invent a price comparison for excluded rows; can state a useful next review action |
| Select synthetic pair | Correct current/proposed filenames selected; 30% and overwrite enabled; comparison rerun | Checks the new report's files/settings rather than assuming an earlier result is still current |
| Unchanged synthetic pair | Current catalog retained, proposed file changed to `unchanged-update.csv`, comparison rerun | Distinguishes zero price changes from complete coverage or import approval; understands remaining image warnings describe unassessed coverage |
| Clear | Both selections/results disappear and Compare is disabled | Distinguishes clearing app state from deleting source CSVs or previously downloaded reports |
| Final questions | Participant gives their own answers before the debrief | Identifies at least one material coverage limit, a separate check needed before an actual import, local CSV processing, and a support request using generic error/version information or a synthetic reproduction instead of merchant data |

For the unchanged candidate and the specified settings, observer reference values
are:

| Comparison | Compared | Price changes | Priority findings | Unpaired update rows | Total findings | Verdict |
|---|---:|---:|---:|---:|---:|---|
| Demo or `current-catalog.csv` + `proposed-update.csv` | 4 | 4 | 6 | 4 | 15 | Incomplete comparison — blockers need review |
| `current-catalog.csv` + `unchanged-update.csv` | 7 | 0 | 0 | 0 | 2 | Review findings before any import |

These are overlapping counters, not a coverage percentage. The unchanged pair's
two findings are image-coverage warnings. Read the actual rows and explanations;
matching totals do not establish that every conclusion is correct.

## Blank observer record

**Status: Not run.** Copy outside the checkout before completing. Keep only
anonymous, generic notes; no participant contact details or personal quotations.

- Trial ID:
- Date:
- Role category: intended catalog operator / owner / other
- Prior app familiarity: none / used before / previously coached
- Candidate version, actual ZIP SHA-256 and app version:
- Windows and browser versions:
- Launch route: direct HTML / localhost / blocked / not run
- First report elapsed time / whole session elapsed time:
- Help sections used / pauses or technical blocks:

| Task | Completion | Explanation | Generic observation / help used |
|---|---|---|---|
| Start and demo | Not run | Not asked | |
| Review and saved report | Not run | Not asked | |
| Select synthetic pair | Not run | Not asked | |
| Unchanged synthetic pair | Not run | Not asked | |
| Clear | Not run | Not asked | |
| Final questions | Not run | Not asked | |

| Task / elapsed time | Assistance requested or reason for intervention | Intervention given | Outcome |
|---|---|---|---|
| | | | Not run |

- Most confusing step or explanation, in generic terms:
- Technical discrepancy and synthetic reproduction, if any:
- Participant's first suggested improvement, paraphrased without personal data:
- Overall evidence: not run / owner rehearsal / guided or assisted trial /
  independent intended-user trial
- Unresolved question / smallest follow-up:

Do not collapse mixed outcomes into an overall "passed" label. An independent
participant can still need assistance on specific tasks; retain those outcomes.
Only after actual trials, reconcile anonymous findings with the existing
[validation results template](VALIDATION_RESULTS_TEMPLATE.md) if more detailed
technical logging is useful. Do not duplicate customer information in Git.

## Finish and decide

Debrief after recording the unaided attempts and answers. Explain any remaining
misunderstanding, log a small help/interface issue where warranted, and keep the
trial evidence separate from prior guided owner tests and automated browser
checks. An agent performing these tasks cannot supply independent-user evidence.
No marketing, payment, delivery, refund or real-merchant claim follows from this
synthetic trial. The other [paid-beta release gates](PAID_BETA_PREPARATION.md)
remain open until separately resolved.
