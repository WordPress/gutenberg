# Comment summary template

Used in CI mode only. Defines the shape of `comment-body.md`, the single comment that gets posted to the source issue when the verdict is `Reproduced` or `Not reproduced` AND the source issue lives in the same repo as the workflow (see SKILL.md Step 8.5).

The visible part above the fold must be scannable from the issue feed — keep it short. The detailed report goes inside a `<details>` block so triagers only expand it when they want more.

## Shape

```markdown
**Verdict: <Reproduced | Not reproduced>**<optional " [low confidence]">

<one-sentence summary, ≤200 chars>

Tested against `trunk` @ `<short SHA>` · <n> attempt(s) · <duration>

<details>
<summary>Full report</summary>

<verbatim render of report.md per references/report-template.md>

</details>

<sub>Automated by `/gutenberg-repro` (CI mode). Re-run by removing and re-adding the `ai-reproduce` label. Screenshots and machine-grep logs are uploaded as workflow artifacts on the run.</sub>
```

## Constraints

- **Verdict line.** Exactly one of `Reproduced` or `Not reproduced` — these are the only verdicts that produce a comment in CI mode. Other verdicts skip posting entirely (see SKILL.md Step 8.5).
- **Low-confidence suffix.** If Step 4 auto-proceeded on `low` confidence, append the literal `[low confidence]` after the verdict word: `**Verdict: Reproduced [low confidence]**`. The `Notes` section of the embedded report.md must explain why.
- **One-sentence summary.** ≤200 chars. For `Reproduced`: what was observed. For `Not reproduced`: what was tried.
- **Metadata line.** `Tested against \`trunk\` @ \`<sha>\` · <n> attempt(s) · <duration>` — `<sha>` is the short SHA from `git rev-parse --short HEAD`, `<n>` is the number of attempts actually executed (1–3), `<duration>` is wall-clock from start of Step 5 to end of Step 7 formatted as `<m>m<s>s` (e.g., `4m17s`).
- **No embedded screenshots.** GitHub issue comments cannot reference local files. v1 keeps screenshots in the workflow artifact and lets the trailer line direct readers there. Don't try to embed images via base64 or external image hosts.
- **Full report rendered verbatim.** Inside the `<details>` block, render the entire content of `report.md` as produced per `references/report-template.md`. Do not restructure or trim.
- **Pre-fold byte budget.** Everything above `<details>` should fit in roughly 600 chars including the verdict, summary sentence, and metadata line. If the summary sentence runs long, cut it — the full report has the detail.

## Why this shape

- **Single comment, not multiple.** Triagers shouldn't have to scroll through repro chatter; one comment with a fold is enough.
- **Verdict-first formatting.** The bold verdict line is the most important signal — it shows up as the first line of the comment in the issue feed and email notifications.
- **Fold protects the issue thread.** The full report can run several hundred lines (preconditions, plan, three attempt logs, console/network noise). Burying it behind a `<summary>` keeps the thread readable while preserving everything.
- **No-comment exit when nothing useful.** Verdicts other than `Reproduced` / `Not reproduced` mean the repro didn't run cleanly; posting that to the issue would be noise. The workflow artifact has the full story for anyone who wants to debug.
