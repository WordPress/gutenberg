# Report template

Render `report.md` using exactly the structure below. Replace placeholders in angle brackets. Omit sections that don't apply (e.g., per-attempt logs when the verdict is `Out of scope` or `Insufficient info`), but keep the header and verdict line in every report.

The first non-blank line under the title must be the `**Verdict:**` line so the report is greppable.

```markdown
# Repro report: issue #<number> — <issue title>

**Verdict:** <Reproduced | Not reproduced | Inconclusive | Could not execute | Insufficient info | Out of scope>
**Issue:** <full URL>
**Tested against:** trunk @ <short SHA> (clean working tree)
**Env:** wp-env playground runtime, <fresh start | already running>
**Attempts:** <n> of 3
**Date:** <ISO 8601 timestamp>

## Issue summary

<2–3 sentences synthesizing what the issue claims. Reference the original screenshots/GIFs by filename if present, e.g. `(see issue-attachment-1.png)`.>

## Repro plan (interpreted)

**Confidence:** <high | low>

**Preconditions:**
- <e.g., Theme: Twenty Twenty-Five>
- <e.g., User: administrator (default wp-env admin)>
- <e.g., A post containing a Cover block with an image>

**Steps:**
1. <observable interaction>
2. <observable interaction>
3. ...

**Expected:** <correct behavior per issue>
**Actual (per issue):** <buggy behavior reported>

## Execution log

### Setup
- `git pull --ff-only origin trunk` → up to date at `<sha>`
- `npm install` → <n> packages, <duration>
- `npm run build` → ok in <duration>
- Allocated ports: site `<port>`, tests `<tests-port>` (random free ports; site reachable at `http://localhost:<port>`)
- `WP_ENV_PORT=<port> WP_ENV_TESTS_PORT=<tests-port> npm run wp-env start -- --runtime=playground` → <ok | already running>

### Preconditions applied
- `npm run wp-env run cli wp <…>` → <output excerpt>
- ...

### Attempt 1
- Login: ok
- Navigation: `<URL>`
- Steps executed: 1–<n>
- Observed: <free text describing the resulting state>
- Console errors (filtered): <list, or "none">
- Network errors (filtered): <list, or "none">
- Outcome: <reproduced | not reproduced | timeout (step <n>) | error: <msg>>

### Attempt 2
<same shape; omit if loop stopped after attempt 1>

### Attempt 3
<same shape; omit if loop stopped earlier>

## Evidence

- Screenshot: `./bug-state.png` <only when verdict is Reproduced; else `./final-state.png`>
- Issue attachments: `./issue-attachment-1.png`, ... <only if present>
- Videos/GIFs referenced in issue: <list of URLs, not downloaded>

## Notes

<Free text for Claude to flag anything a human should know that doesn't fit the structure: ambiguity in the plan, suspicious selectors used, environment oddities, unexpected console errors that did not change the verdict, hints from the issue thread about related PRs or issues.>
```

## Notes on filling the template

- **Verdict line:** exactly one of the six values, no qualifiers. Caveats go in `Notes`.
- **Tested against:** include `(dirty working tree)` or `(branch: <name>)` if Step 5's refusal was overridden by the user — never silently hide this.
- **Confidence:** if `low`, the `Notes` section must briefly explain why.
- **Filtered errors:** include the matched substring that caused the filter to admit the message (e.g., `[wp.blockEditor] …`), so a reviewer can sanity-check the filter.
- **Outcome strings:** stick to the exact strings `reproduced`, `not reproduced`, `timeout (step <n>)`, `error: <msg>` for machine-grepping later.
