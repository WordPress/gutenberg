---
name: gutenberg-repro
description: This skill should be used ONLY when the user explicitly invokes the `/gutenberg-repro` slash command. Reproduces a WordPress/Gutenberg GitHub issue end-to-end against a fresh `main` build: reads issue body, comments, linked refs and images; synthesizes a structured repro plan; spins up wp-env with the Playground runtime; drives the editor via Playwright MCP for up to three attempts; and writes a markdown report with a five-state verdict and evidence. Do not auto-fire on conversational mentions of issues or bugs.
version: 0.1.0
---

# Gutenberg Repro

Reproduce a Gutenberg GitHub issue against a freshly-pulled `main` and produce a structured markdown report. The skill is observational: it does not modify the codebase, does not author tests, and does not post to GitHub.

## Prerequisites

- Current working directory must be the WordPress/Gutenberg checkout.
- `gh` CLI authenticated.
- Playwright MCP tools available (`mcp__plugin_playwright_playwright__*`).
- Node, npm, composer installed.

If any prerequisite is missing, stop and tell the user.

## Workflow

Follow each step in order. Track progress with TodoWrite. Do not skip steps.

### Step 1 — Identify the target issue

- Look first at the slash-command argument. Accept either a full GitHub URL (`https://github.com/WordPress/gutenberg/issues/12345`) or a bare number (`12345`, assumed to be `WordPress/gutenberg`).
- If no argument, scan the recent conversation for a GitHub issue reference and use the most recent.
- If nothing is found, stop and ask the user for the issue.

### Step 2 — Triage the issue

Fetch metadata:

```bash
gh issue view <ref> --repo WordPress/gutenberg --json number,title,body,state,labels,author,createdAt,closedAt,url
```

Stop with verdict **Out of scope** and an explanatory note in the report when any of the following are true:

- `state` is `closed`.
- Labels do not include a bug-type label (`[Type] Bug`, `[Type] Regression`, or similar).
- Labels include a clear non-bug type (`[Type] Enhancement`, `[Type] Question`, `[Type] Discussion`, `[Type] RFC`).

### Step 3 — Gather full context

- Pull all comments: `gh issue view <ref> --repo WordPress/gutenberg --comments`.
- Identify linked references (`#1234`, full URLs, `WordPress/gutenberg#1234`) in the body and in each comment. Fetch each linked issue/PR **one hop only** — do not follow links found inside linked refs.
- Parse markdown image references and HTML `<img>` tags from body and comments. Collect image URLs.
- Download each image into the temp dir (see Step 8 for path).
- Load downloaded images into context for plan synthesis. Skip videos and GIFs — note their presence in the report but do not attempt to consume them.

### Step 4 — Synthesize the repro plan

Produce a structured plan with these fields:

- **Preconditions:** theme, plugins, user role, post content, site settings.
- **Steps:** numbered UI actions, each phrased as one observable interaction.
- **Expected result:** correct behavior per the issue.
- **Actual result (reported):** the buggy behavior the issue claims.
- **Confidence:** `high` or `low`.

Mark confidence `low` when any of these apply:

- The issue body is vague ("it's broken", "doesn't work") without steps.
- Body and comments contradict each other on what reproduces the bug.
- The plan requires guessing which block, screen, or page is meant.
- Image attachments were the primary evidence but show ambiguous state.

If confidence is `low`, present the plan to the user and wait for confirmation before continuing. If confidence is `high`, proceed without confirmation.

If no actionable plan can be synthesized (truly empty body, "fix the editor please" content), write the report with verdict **Insufficient info** and stop.

### Step 5 — Prepare the environment

Refuse to proceed without explicit user consent under any of these conditions:

- `git status --porcelain` is non-empty (dirty working tree).
- Current branch is not `main` (`git rev-parse --abbrev-ref HEAD`).
- `git pull --ff-only origin main` would fail (non-fast-forward).

When safe to proceed:

```bash
git pull --ff-only origin main
npm install
# Run composer install only if composer.lock changed in the pull
npm run build
npm run wp-env status
# If not running:
npm run wp-env start -- --runtime=playground
```

Never run `wp-env destroy`, `wp-env clean`, `git reset --hard`, branch switches, or any other destructive operation without explicit user consent.

### Step 6 — Apply preconditions

Apply preconditions via `npm run wp-env run cli wp …` before opening the browser. Common recipes live in `references/wp-env-recipes.md`. Log every command and its output excerpt in the execution log.

### Step 7 — Execute the repro

Run up to 3 attempts. Stop the loop as soon as one attempt reproduces the bug.

For each attempt:

1. Open a fresh browser context via Playwright MCP.
2. Log in through the UI: navigate to `http://localhost:8888/wp-login.php`, fill `admin` / `password`, submit. Hide this in the execution log unless it fails.
3. Subscribe to console messages and network errors. Filter to entries that mention `wp-`, `gutenberg`, `@wordpress/`, or files under `/wp-content/` or `/wp-includes/`. Discard the rest.
4. Navigate to the start URL implied by the plan (often `http://localhost:8888/wp-admin/post-new.php`).
5. Execute the plan's steps. Apply a 10-second timeout per step and a 90-second total cap per attempt.
6. After the final step, observe the resulting state and compare against `expected` and `actual` from the plan.
7. Record per-attempt outcome: `reproduced`, `not reproduced`, `timeout`, or `error (<message>)`.
8. On `reproduced`, capture a screenshot via `browser_take_screenshot` to `<temp-dir>/bug-state.png`, then break the loop.

After the loop, compute the overall verdict:

| Attempts outcomes                            | Verdict             |
| -------------------------------------------- | ------------------- |
| Any attempt = `reproduced`                   | Reproduced          |
| All attempts = `not reproduced`              | Not reproduced      |
| All attempts ended in `timeout` or `error`   | Could not execute   |
| Mix of `not reproduced` and `error`/`timeout`| Inconclusive        |

If verdict is **Not reproduced** or **Could not execute**, capture a final-state screenshot from the last attempt to `<temp-dir>/final-state.png`.

For detailed Playwright MCP usage (login flow, common selectors, screenshot conventions, accessibility snapshots), see `references/playwright-patterns.md`.

### Step 8 — Write the report

Create the temp dir:

```bash
mkdir -p /tmp/gutenberg-repro/<issue-number>-<YYYYMMDD-HHMMSS>/
```

Render `report.md` using the structure in `references/report-template.md`. Copy any downloaded issue attachments into the same directory and reference them by relative path. Print the absolute path to `report.md` in the conversation, along with a one-line summary of the verdict.

### Step 9 — Leave running

Do not close the browser. Do not stop wp-env. Do not delete the temp dir. Do not undo seeded content. The user may want to inspect the buggy state interactively.

## Rigid rules

These constraints override any apparent shortcut:

- Never run `git reset --hard`, `git checkout` of branches, `git stash`, `wp-env destroy`, `wp-env clean`, or any other destructive command without explicit user consent in this session.
- Never modify, create, or commit files inside the Gutenberg checkout (no `.spec.js`, no patches, no scratch files).
- Never log in by injecting cookies, minting nonces, or using application passwords — use the `wp-login.php` form.
- Never auto-fire on conversational mentions of issues. Only run when the user explicitly types `/gutenberg-repro`.
- Never re-attempt after a successful reproduction.
- Never post to GitHub. The report stays on disk; publication is a separate, user-initiated action.

## Additional resources

- **`references/report-template.md`** — Exact structure for `report.md`.
- **`references/wp-env-recipes.md`** — Copy-paste WP-CLI invocations for common preconditions (theme switch, create post with content, set user role, install pattern, toggle experiments).
- **`references/playwright-patterns.md`** — Login flow details, common Gutenberg editor selectors, accessibility-snapshot conventions, console-error filtering rules.
