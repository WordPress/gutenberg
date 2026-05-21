# Fix report template

Render `fix-report.md` using exactly the structure below. Replace placeholders in angle brackets. Omit sections that don't apply (e.g., iteration history when only one iteration was used), but always keep the header and verdict line.

The first non-blank line under the title must be `**Verdict:**` so the report is greppable.

```markdown
# Fix report: issue #<number> — <issue title>

**Verdict:** <Fixed | Tier-1 fixed | Stuck>
**Issue:** <full URL>
**Repro report:** `./report.md`
**Branch:** `fix/issue-<N>` (local only; not pushed)
**Base:** trunk @ <short SHA from repro report>
**Iterations used:** <0–2>
**Date:** <ISO 8601 timestamp>

## Hypothesis

**Root cause:** <one or two sentences, with `file:line` reference>

**Why this causes the symptom:** <chain from cause to user-visible effect>

**Observable via Playwright:** <yes | no — if "no", which Tier-1 fallback path was taken and why>

## Changes

<Omit if verdict is Stuck/Case B (no commit).>

**Files touched:**
- `packages/<area>/<file>.js` — <one-line description of change>
- ...

**Diff:** `./final.patch` <only when verdict is Fixed; omit otherwise>

**Test:** `test/e2e/specs/<area>/issue-<N>-<slug>.spec.js`

## Red-green evidence

<Omit under Tier-1 fallback — replace with a "Manual verification" subsection instead.>

### Before fix (test must fail)

- Command: `WP_ENV_PORT=<test-port> WP_BASE_URL=... npm run test:e2e -- <path>`
- Outcome: failed at `<assertion or step>`
- Excerpt: ```<terse, the assertion error or expect() output>```

### After fix (test must pass)

- Command: <same as above>
- Outcome: passed
- Duration: <wall clock>

### Manual verification (Tier-1 fallback only)

<Replace red-green section under Tier-1.>

- Re-drove the repro plan steps through Playwright MCP after applying the fix.
- Observed: <free text describing what changed in the editor vs the original `actual` from the repro plan>
- Screenshot: `./fixed-state.png`

## Iteration history

<Omit if iterations used is 0.>

### Iteration 1

- Side: <test | fix>
- What changed in the refinement: <one or two sentences>
- Result: <passed | still failed — describe>

### Iteration 2

<same shape; omit if not used>

## Rejected attempts

<Omit if `<temp-dir>/attempts/` is empty.>

- `./attempts/attempt-1.patch` — <one-line reason this was rejected>
- ...

## Notes

<Free text for anything that doesn't fit the structure: surprising file locations, related PRs found during code reading, places where the fix touches a layering boundary that the user should review (e.g., a `block-editor` change with `core-data` smell), gotchas about the test itself (e.g., requires a specific theme), confidence caveats. Anything a human reviewer should know before promoting this to a PR.>
```

## Notes on filling the template

- **Verdict line:** exactly one of the three values, no qualifiers. Caveats go in `Notes`.
- **Verdict semantics:**
  - `Fixed` — full red-green held; test+fix both committed.
  - `Tier-1 fixed` — non-UI bug; fix committed and manually verified via the running browser; no test commit because user opted (b) at the Step 4 checkpoint.
  - `Stuck` — 2 iterations exhausted without red-green holding. Branch may have a failing-test commit (Case A) or be deleted entirely (Case B). Either way the `Notes` section must explain where the run got stuck and what the most promising lead is for human follow-up.
- **`./final.patch`:** the path is relative to the temp dir (which is also where this report lives). Same convention as `/gutenberg-repro`'s `./bug-state.png`.
- **Branch state on Stuck:** the report's `Changes` section reflects whatever ended up on disk. If the branch has only a failing-test commit, list the test file but omit the `final.patch` line. If the branch was deleted (Case B), omit the entire `Changes` section.
- **Layering call-outs:** Gutenberg has a strict three-layer editor architecture (`block-editor` → `editor` → `edit-post`/`edit-site`). If the fix touches `block-editor` with what looks like WordPress-specific logic, flag it in `Notes` so the reviewer can sanity-check the abstraction boundary isn't being broken.
