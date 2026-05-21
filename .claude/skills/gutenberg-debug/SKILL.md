---
name: gutenberg-debug
description: This skill should be used ONLY when the user explicitly invokes the `/gutenberg-debug` slash command. End-to-end debug workflow for a WordPress/Gutenberg GitHub issue: runs `/gutenberg-repro` against the issue, and if the resulting verdict is `Reproduced`, chains into `/gutenberg-fix` against the same report. Preserves the diagnosis checkpoint from `/gutenberg-fix` — the user still approves the hypothesis before any code changes. Do not auto-fire on conversational mentions of issues, bugs, or fixes.
version: 0.1.0
argument-hint: <github-issue-url-or-number>
arguments:
  - name: issue
    required: true
    description: |
      The target GitHub issue. Same shape as `/gutenberg-repro`'s `issue` argument:
      - A full GitHub URL: `https://github.com/WordPress/gutenberg/issues/12345`
      - A bare issue number (assumed to be `WordPress/gutenberg`): `12345`
      - A short form: `WordPress/gutenberg#12345`
      If omitted, the skill scans recent conversation for an issue reference; if none is found, it stops and asks the user.
---

# Gutenberg Debug

Thin orchestrator that runs `/gutenberg-repro` against a GitHub issue and, when the bug is confirmed `Reproduced`, hands the resulting report straight to `/gutenberg-fix`. The two underlying skills do all the real work; this skill exists to collapse the common "reproduce, then fix" workflow into a single command.

## Prerequisites

The same as the underlying skills:

- Current working directory is the WordPress/Gutenberg checkout.
- `gh` CLI authenticated.
- Playwright MCP tools available (`mcp__plugin_playwright_playwright__*`).
- Node, npm, composer installed.

If any prerequisite is missing, stop and tell the user — same as the underlying skills would.

## Workflow

### Step 1 — Run `/gutenberg-repro`

Follow the workflow in `../gutenberg-repro/SKILL.md` end-to-end using the `issue` argument. Do not modify, shortcut, or skip any of its steps; in particular, do not suppress its low-confidence-plan checkpoint or its dirty-tree gate.

When `/gutenberg-repro` finishes, capture from its output:

- The absolute path to `report.md`.
- The verdict line (first non-blank line under the title in `report.md`).

### Step 2 — Branch on the verdict

| Verdict           | Action                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `Reproduced`      | Proceed to Step 3.                                                                                            |
| `Not reproduced`  | Stop. Tell the user the bug couldn't be hit on clean trunk — this may already be fixed; bisecting is the obvious next move, but it's out of scope for this skill. |
| `Inconclusive`    | Stop. Tell the user the run was a mix of non-repros and errors; suggest re-running `/gutenberg-repro` to see whether it stabilizes before attempting a fix. |
| `Could not execute` | Stop. The repro tooling itself failed; report what `/gutenberg-repro` recorded and let the user resolve the env issue. |
| `Insufficient info` | Stop. The issue isn't actionable as written. Suggest the user comment on the issue asking for clarification. |
| `Out of scope`    | Stop. The issue is closed, not a bug, or otherwise outside what this skill handles.                           |

In every non-`Reproduced` case, print a one-line summary plus the path to `report.md` so the user can inspect.

### Step 3 — Run `/gutenberg-fix`

Follow the workflow in `../gutenberg-fix/SKILL.md`, passing the absolute path to `report.md` captured in Step 1 as the `target` argument.

This means the diagnosis checkpoint in `/gutenberg-fix` Step 4 is still active — the user approves the hypothesis before any code changes. The orchestrator does not bypass it. If you find yourself looking for a way to skip the checkpoint, stop: it's the safety gate that the whole trio's design depends on.

### Step 4 — Final summary

After `/gutenberg-fix` completes (success, Tier-1 fallback, or Stuck), print a single short summary to the conversation:

- One line: the combined verdict, e.g. `Reproduced → Fixed (1 iteration, branch fix/issue-12345)`.
- The absolute path to `fix-report.md`.
- The absolute path to the original `report.md` for context.

## Rigid rules

- This skill never does work that the underlying skills would do — it only delegates. If you find yourself reading code, running tests, or making commits directly from this skill, stop and check whether you're inside one of the delegated workflows.
- Never bypass any checkpoint or gate in the underlying skills. They exist for a reason and the orchestrator inherits all of them.
- Never auto-fire. Only run when the user explicitly types `/gutenberg-debug`.
- If `/gutenberg-repro` stops mid-flow (e.g., the user declines its dirty-tree gate), this skill stops too. Do not silently keep going.

## Additional resources

- **`../gutenberg-repro/SKILL.md`** — the full reproduction workflow.
- **`../gutenberg-fix/SKILL.md`** — the full fix-exploration workflow.
