---
name: gutenberg-fix
description: This skill should be used ONLY when the user explicitly invokes the `/gutenberg-fix` slash command. Takes a `/gutenberg-repro` report whose verdict is `Reproduced` and explores a fix: diagnoses the root cause, creates a `fix/issue-<N>` branch with two commits (a Playwright e2e test that fails on unfixed code, then the fix that makes it pass), and writes a `fix-report.md` next to the original `report.md` with red-green evidence. Refuses early if the report's verdict is anything other than `Reproduced`. Do not auto-fire on conversational mentions of bugs, fixes, or patches.
version: 0.1.0
argument-hint: <report-path | issue-number>?
arguments:
  - name: target
    required: false
    description: |
      What to fix. Accepts:
      - An absolute path to a `report.md` from `/gutenberg-repro`, e.g. `/tmp/gutenberg-repro/12345-20260520-141022/report.md`.
      - A bare GitHub issue number (assumed `WordPress/gutenberg`): `12345`.
      - A short ref: `WordPress/gutenberg#12345`.
      - Omitted entirely: the skill picks the most recently modified `report.md` under `/tmp/gutenberg-repro/`.
---

# Gutenberg Fix

Take a confirmed-reproduced Gutenberg bug and explore a fix end-to-end against a freshly-pulled `trunk`, producing a `fix/issue-<N>` branch with a red-green test+fix pair and a structured markdown report. The skill is paired with `/gutenberg-repro`: it consumes that skill's report and never re-runs the reproduction itself.

## Prerequisites

- Current working directory is the WordPress/Gutenberg checkout.
- A `/gutenberg-repro` report exists on disk with verdict `Reproduced`.
- `gh` CLI authenticated.
- Playwright MCP tools available (`mcp__plugin_playwright_playwright__*`).
- Node, npm, composer installed.

If any prerequisite is missing, stop and tell the user.

## Workflow

Follow each step in order. Track progress with TodoWrite. Do not skip steps.

### Step 1 — Resolve the target report

Resolve `target` (see frontmatter) into an absolute path to a `report.md`:

- **Explicit path** → use as-is. Refuse if the file doesn't exist.
- **Issue number / short ref** → glob `/tmp/gutenberg-repro/<number>-*/report.md`, pick newest by mtime.
- **Omitted** → glob `/tmp/gutenberg-repro/*/report.md`, pick newest by mtime overall (`ls -t /tmp/gutenberg-repro/*/report.md | head -1`).

If no matching report is found, stop and tell the user to run `/gutenberg-repro` first.

Read the report. Parse:

- The `**Verdict:**` line. If it is anything other than `Reproduced`, refuse with a one-line explanation (e.g., "report's verdict is `Not reproduced` — this may already be fixed on trunk; out of scope for `/gutenberg-fix`"). Do not proceed.
- The issue number, issue title, and issue URL.
- The `**Tested against:**` SHA — record it for the fix report.
- The Setup section's allocated ports (the `<port>` / `<tests-port>` pair from `/gutenberg-repro`).
- The repro plan (preconditions, steps, expected, actual).
- The execution log of the attempt that reproduced the bug.

### Step 2 — Verify entry state

Refuse to proceed without explicit user consent under any of:

- `git status --porcelain` is non-empty (dirty working tree).
- Current branch is not `trunk` (`git rev-parse --abbrev-ref HEAD`).
- A branch named `fix/issue-<N>` already exists locally. Quote the last commit message on it (`git log -1 --format='%s' fix/issue-<N>`) so the user can decide whether to delete it or rename.

For the wp-env check, do **not** prompt — auto-recover:

- Probe `http://localhost:<port>` (the dev port from the report). If reachable, assume the existing wp-env is the one `/gutenberg-repro` left running.
- If unreachable, restart wp-env using the report's ports:
  ```bash
  WP_ENV_PORT=<port> WP_ENV_TESTS_PORT=<tests-port> npm run wp-env start -- --runtime=playground
  ```

Never run `wp-env destroy`, `wp-env clean`, `git reset --hard`, branch switches, or any destructive operation without explicit user consent.

### Step 3 — Diagnose the root cause

Form a hypothesis about where the bug lives. Use, in roughly this order:

1. **The report's repro plan and execution log** — what step produced the bug, what the observed final state looked like, any filtered console errors.
2. **The `bug-state.png` screenshot** in the report's temp dir.
3. **The live browser** that `/gutenberg-repro` left running. You may navigate around it, take snapshots, run `browser_evaluate` for non-destructive probing (e.g., reading store state with `wp.data.select(...)`). Do not perform UI actions that mutate content.
4. **Code reading.** Trace from the symptom toward the cause. Use the Gutenberg layering as a navigation hint: `block-editor` (generic) → `editor` (post-aware) → `edit-post`/`edit-site` (screens). Console errors often name the file directly.

Produce a hypothesis with these fields:

- **Root cause:** one or two sentences. Reference the relevant `file:line`.
- **Why this causes the symptom:** the chain from cause to user-visible effect.
- **Proposed patch shape:** what change you would make and where. Do not write code yet.
- **Test approach:** how a Playwright spec would assert the bug exists. Be specific about selectors, expected DOM state, and the assertion.
- **Observable via Playwright?** `yes` or `no`, with one-line reasoning. Bugs in the REST contract that aren't surfaced in the UI, internal data-layer regressions not visible in the editor, or timing/race conditions are common reasons for `no`.

Do not start writing test or patch code in this step. Diagnosis only.

### Step 4 — Checkpoint (single user approval gate)

Present the hypothesis from Step 3 to the user and wait for approval.

The checkpoint has two shapes:

**If "observable via Playwright" is `yes`:** present hypothesis + patch shape + test approach. Ask the user to confirm or push back. On approval, proceed to Step 5.

**If "observable via Playwright" is `no`:** present hypothesis + patch shape + reasoning, then offer three choices:

- **(a) Abort.** Skill stops; no branch, no commits. User picks up manually.
- **(b) Tier-1 fallback.** Proceed with patch + manual re-verification through Playwright MCP, but do **not** write or commit a test. This produces only a fix commit and a fix report.
- **(c) Push back.** User describes a test approach Claude missed; restart Step 3 with that approach in mind.

This is the only user gate in the workflow. Everything after this runs autonomously. Errors during Step 5 or later are handled by the iteration discipline (Step 6) or terminate with a structured failure report (Step 7) — they do not prompt the user mid-run.

### Step 5 — Write the test (commit 1)

Skip this entire step under the Tier-1 fallback path; jump straight to Step 6.

Create the fix branch:

```bash
git switch -c fix/issue-<N>
```

Choose the test location. Areas: `admin`, `editor`, `interactivity`, `preload`, `site-editor`, `widgets`. Pick the one whose name best matches where the bug lives. The path is:

```
test/e2e/specs/<area>/issue-<N>-<slug>.spec.js
```

`<slug>` is a kebab-case condensation of the issue title (≤ 40 chars). Tests use `require( '@wordpress/e2e-test-utils-playwright' )` — see existing files in the area folder for the local conventions.

Write the test. The assertions must be the strongest available expression of the bug. For UI bugs, prefer accessible-name selectors (`page.getByRole(...)`) over CSS selectors; reach for DOM structure only when a role isn't expressive enough.

Run the test:

```bash
# Allocate a random port for the test-runner wp-env (separate from the
# dev wp-env that /gutenberg-repro left running).
TEST_PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("",0)); print(s.getsockname()[1])')
WP_ENV_PORT=$TEST_PORT WP_BASE_URL=http://localhost:$TEST_PORT \
  npm run test:e2e -- test/e2e/specs/<area>/issue-<N>-<slug>.spec.js
```

The test **must fail**. That is the proof the test catches the bug. If it passes on unfixed code, the test is wrong — go to Step 6's iteration discipline with the failure tagged as "test side."

If it fails as expected, format and commit:

```bash
npm run format -- test/e2e/specs/<area>/issue-<N>-<slug>.spec.js
git add test/e2e/specs/<area>/issue-<N>-<slug>.spec.js
git commit -m "$(cat <<'EOF'
<Area>: Add e2e test for issue #<N>

Demonstrates the bug from <issue URL>. The test currently fails on
trunk; the accompanying fix in the next commit makes it pass.
EOF
)"
```

Use the area-prefixed style standard in this repo (`Widgets:`, `Block Editor:`, `Site Editor:`, etc.). Look at `git log --oneline -20` for nearby examples.

### Step 6 — Apply the fix (commit 2)

Apply the patch from Step 3 to the source files. After every JS edit, rebuild:

```bash
npm run build
```

PHP edits need no rebuild — wp-env mounts the checkout, so changes are picked up on next request.

Run the test again with the same command from Step 5. The test **must pass**. If it still fails, the fix is wrong — go to the iteration discipline below with the failure tagged as "fix side."

If it passes, format and commit:

```bash
# JS files
npm run format -- <changed-js-paths>
# PHP files
vendor/bin/phpcbf <changed-php-paths>

git add <changed-source-paths>
git commit -m "$(cat <<'EOF'
<Area>: Fix <one-line summary>

<2-4 lines describing the root cause and the fix. Reference the issue
with "Fixes #<N>".>

Fixes #<N>
EOF
)"
```

**Iteration discipline.** Total budget: 2 refinements across the whole run. A refinement is one of:

- **Test side.** Test passed on unfixed code (or errored out due to a test bug, not infrastructure). Refine the test's assertions / setup / selectors. The fix has not been applied yet at this point.
- **Fix side.** Test still failed after the fix was applied. Refine the patch — or, if the hypothesis itself looks wrong, refine the hypothesis. Save the rejected patch as `<temp-dir>/attempts/attempt-<n>.patch` (`git diff` then save), `git restore` the changes, and try again.

The two refinements can be split however the work demands: two test-side refinements, two fix-side, or one of each. Past 2 refinements, stop and write the failure report (Step 7).

Infrastructure errors (wp-env crashes, build failures from unrelated cause, MCP errors) are not refinements — they should surface immediately and stop the run with a clear message.

### Step 7 — Iteration budget exhausted (failure path)

Only reached if the 2-iteration budget runs out without red-green holding.

Two cases:

**Case A — A test went red at some point during the run.** Commit it (it captures the bug as a runnable artifact). Save every attempted fix patch under `<temp-dir>/attempts/`. The branch ends with one commit: the failing test.

**Case B — No test ever went red** (i.e., every test refinement passed on unfixed code, so we never demonstrated the bug under test). Make no commit. Delete the branch (`git switch trunk && git branch -D fix/issue-<N>`). Save all attempted test files and patches under `<temp-dir>/attempts/`.

Either way, write the fix report with verdict `Stuck` and proceed to Step 8.

### Step 8 — Write the fix report

Write `fix-report.md` next to the original `report.md` in `/tmp/gutenberg-repro/<issue-number>-<timestamp>/`. Render using `references/fix-report-template.md`.

If the run succeeded, also write the final accepted diff:

```bash
git diff trunk..fix/issue-<N> -- '*.js' '*.php' '*.ts' '*.tsx' \
  > /tmp/gutenberg-repro/<issue-number>-<timestamp>/final.patch
```

Print the absolute path to `fix-report.md` in the conversation, along with a one-line summary of the verdict and a `cd` hint for inspecting the temp dir.

### Step 9 — Leave running

Do not close the browser. Do not stop wp-env (either instance). Do not switch off the fix branch. Do not delete the temp dir.

The user typically wants to:

- Inspect the fixed editor interactively in the browser `/gutenberg-repro` left open.
- Cherry-pick the test into a separate PR branch.
- Continue iterating on the fix manually.

Leaving everything in place makes those workflows one command away.

## Rigid rules

These constraints override any apparent shortcut:

- Never mutate the original `report.md` produced by `/gutenberg-repro`. Write new files alongside it; do not edit existing files in its temp dir.
- Never push to a remote. Branch stays local.
- Never `--amend` an existing commit; create new commits if iteration is needed.
- Never skip the diagnosis checkpoint (Step 4). The user must approve the hypothesis before any code changes.
- Never commit without first running `npm run format` (for JS/TS) or `vendor/bin/phpcbf` (for PHP) on the changed files.
- Never run `git reset --hard`, `git checkout` of branches, `git stash`, `wp-env destroy`, `wp-env clean`, or any destructive command without explicit user consent.
- Never auto-fire. Only run when the user explicitly types `/gutenberg-fix`.
- Never post to GitHub. The fix and the report stay on the local branch and on disk; publication is a separate, user-initiated action.

## Additional resources

- **`references/fix-report-template.md`** — Exact structure for `fix-report.md`.
- **`../gutenberg-repro/references/playwright-patterns.md`** — Useful for the live-browser observation step (Step 3). Note that those patterns describe driving the browser through MCP; the e2e test itself uses the `@wordpress/e2e-test-utils-playwright` package, which has a different API.
- **`../gutenberg-repro/references/wp-env-recipes.md`** — Available if the fix requires additional preconditions to verify.
