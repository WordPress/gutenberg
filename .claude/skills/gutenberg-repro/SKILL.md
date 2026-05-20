---
name: gutenberg-repro
description: This skill should be used when the user explicitly invokes the `/gutenberg-repro` slash command OR when invoked by the `ai-reproduce` label workflow (CI mode, signalled by `GUTENBERG_REPRO_CI=1`). Reproduces a WordPress/Gutenberg GitHub issue end-to-end against a fresh `trunk` build: reads issue body, comments, linked refs and images; synthesizes a structured repro plan; spins up wp-env with the Playground runtime; drives the editor via Playwright MCP for up to three attempts; and writes a markdown report with a five-state verdict and evidence. Do not auto-fire on conversational mentions of issues or bugs in interactive mode.
version: 0.2.0
---

# Gutenberg Repro

Reproduce a Gutenberg GitHub issue against a freshly-pulled `trunk` (the WordPress/gutenberg default branch) and produce a structured markdown report. The skill is observational: it does not modify the codebase and does not author tests. In interactive mode it does not post to GitHub; in CI mode it may post a single comment per the gating rules below.

## Execution mode

The skill runs in one of two modes; they share the same workflow but fork on a handful of gates and the tail-end behavior. Detect mode at the start of the run and store the result in TodoWrite so every subsequent step references the same value.

**Interactive mode (default).** Triggered when the user explicitly types `/gutenberg-repro` in Claude Code. All consent gates fire; the browser, wp-env, and the temp dir are left running so the user can inspect; nothing is posted to GitHub.

**CI mode.** Triggered when the environment variable `GUTENBERG_REPRO_CI=1` is set. The action invokes the skill via a prompt; gates that would block on user consent become hard assertions; the browser is closed and wp-env stopped at the end; a single comment may be posted to the source issue per Step 8.5's gating.

CI mode reads two additional environment variables:

- `GUTENBERG_REPRO_ISSUE` — issue ref (URL, `<owner>/<repo>#<n>`, or bare number). Replaces Step 1's argument and conversation scan. Must be set; otherwise abort.
- `GUTENBERG_REPRO_WORKSPACE` — absolute path the workflow controls (e.g., `${{ runner.temp }}/gutenberg-repro`). Replaces Step 8's hard-coded `/tmp/gutenberg-repro/...` path so the workflow can upload the directory as an artifact.

If `GUTENBERG_REPRO_CI` is set but `GUTENBERG_REPRO_ISSUE` or `GUTENBERG_REPRO_WORKSPACE` is missing, write a `Could not execute` report explaining the missing env var, skip posting (Step 8.5 gating prevents it anyway), and exit non-zero.

In interactive mode, all three vars are unset and behavior is identical to v0.1.

Below, behavior unique to CI mode is called out under each step with an "**In CI mode:**" callout. If a step has no callout, behavior is identical in both modes.

## Prerequisites

- Current working directory must be the WordPress/Gutenberg checkout (a Gutenberg fork's trunk also works).
- `gh` CLI authenticated. In CI, the workflow exports `GH_TOKEN=${{ github.token }}` so `gh` is already auth'd.
- Playwright MCP tools available. The tool prefix depends on mode — see `references/playwright-patterns.md` § Tool naming across modes.
- Node, npm, composer installed.

If any prerequisite is missing in interactive mode, stop and tell the user. In CI mode, write a `Could not execute` report explaining which prerequisite is missing and exit non-zero.

## Workflow

Follow each step in order. Track progress with TodoWrite. Do not skip steps.

### Step 1 — Identify the target issue

- Look first at the slash-command argument. Accept either a full GitHub URL (`https://github.com/WordPress/gutenberg/issues/12345`) or a bare number (`12345`, assumed to be `WordPress/gutenberg`).
- If no argument, scan the recent conversation for a GitHub issue reference and use the most recent.
- If nothing is found, stop and ask the user for the issue.

**In CI mode:** read `GUTENBERG_REPRO_ISSUE` and use it as the target. Skip the argument and conversation scans. If the env var is unset or empty, write a `Could not execute` report explaining the missing input and exit non-zero (Step 8.5 will skip posting per its gating).

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

**In CI mode:** never pause for user confirmation. On `low` confidence, auto-proceed and (a) prefix the visible-summary verdict line with `[low confidence]` and (b) explain in the report's `Notes` section why confidence was low.

If no actionable plan can be synthesized (truly empty body, "fix the editor please" content), write the report with verdict **Insufficient info** and stop.

### Step 5 — Prepare the environment

Refuse to proceed without explicit user consent under any of these conditions:

- `git status --porcelain` is non-empty (dirty working tree).
- Current branch is not `trunk` (`git rev-parse --abbrev-ref HEAD`). Note: WordPress/gutenberg uses `trunk` as its default branch, not `main`.
- `git pull --ff-only origin trunk` would fail (non-fast-forward).

When safe to proceed:

```bash
git pull --ff-only origin trunk
npm install
# Run composer install only if composer.lock changed in the pull
npm run build
```

**In CI mode:** treat the three gates above as assertions, not prompts — the workflow checks out a fresh tree at the workflow ref, so any failure is unexpected. If any assertion fails: write a `Could not execute` report with the failing assertion in the `Notes` section and exit non-zero (Step 8.5 will skip posting per its gating). Also skip the `git pull` and `npm install` lines above — the workflow already ran `actions/checkout` and `npm ci`. Proceed directly to the port-allocation block below.

**Allocate a random free port** before starting wp-env to avoid conflicts with any other wp-env instance the user may have running on the default 8888/8889. Pick a port in 20000–60000:

```bash
# Pick a free port (and a separate tests port wp-env demands even when unused).
python3 -c 'import socket
def f():
    s = socket.socket(); s.bind(("", 0)); p = s.getsockname()[1]; s.close(); return p
print(f(), f())'
```

Capture both numbers. Throughout the rest of this session:

- `<port>` is the site port; `<tests-port>` is the tests port.
- **Every** wp-env command must be prefixed `WP_ENV_PORT=<port> WP_ENV_TESTS_PORT=<tests-port>` because each `Bash` invocation is a fresh shell — env vars do not persist between calls.
- **Every** browser URL must use `http://localhost:<port>`. The site is not reachable on 8888 in this session.
- Record `<port>` and `<tests-port>` in the report's "Setup" log so the user can inspect the env afterward.

Start wp-env with the allocated ports:

```bash
WP_ENV_PORT=<port> WP_ENV_TESTS_PORT=<tests-port> npm run wp-env start -- --runtime=playground
```

Skip the pre-start `wp-env status` check — with a freshly allocated port nothing can be running on it, so the call adds noise without information.

Never run `wp-env destroy`, `wp-env clean`, `git reset --hard`, branch switches, or any other destructive operation without explicit user consent.

### Step 6 — Apply preconditions

Apply preconditions before opening the browser. The preferred mechanism is `npm run wp-env run cli wp …` (see `references/wp-env-recipes.md`).

**Playground runtime caveat:** under `--runtime=playground`, `wp-env run` is unsupported and prints `✖ The 'run' command is not supported in the Playground runtime at the moment.` Use the wp-admin UI fallbacks documented in `references/wp-env-recipes.md` § Playground fallbacks instead.

**Consent gate:** if a precondition requires `browser_file_upload` (e.g., uploading a test plugin zip), the file must be staged at a path inside the project root because Playwright MCP rejects paths outside its allowed roots (it accepts only the project root and `.playwright-mcp/`). Stop and ask the user for explicit consent before staging anything inside the checkout — same shape as the Step 5 dirty-tree gate. Do not silently write to `.playwright-mcp/` or anywhere else under the repo.

**In CI mode:** there is no user to consent. If a precondition requires `browser_file_upload`, write a `Could not execute` report explaining the unsupported precondition and stop. Step 8.5 will skip posting per its gating.

Log every command (and every UI fallback) along with an output excerpt in the execution log.

### Step 7 — Execute the repro

Run up to 3 attempts. Stop the loop as soon as one attempt reproduces the bug.

For each attempt:

1. Open a fresh browser context via Playwright MCP.
2. Log in through the UI: navigate to `http://localhost:<port>/wp-login.php`, fill `admin` / `password`, submit. Hide this in the execution log unless it fails.
3. Subscribe to console messages and network errors. Filter to entries that mention `wp-`, `gutenberg`, `@wordpress/`, or files under `/wp-content/` or `/wp-includes/`. Discard the rest.
4. Navigate to the start URL implied by the plan (often `http://localhost:<port>/wp-admin/post-new.php`).
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

**In CI mode:** use `$GUTENBERG_REPRO_WORKSPACE/<issue-number>-<YYYYMMDD-HHMMSS>/` instead. The workflow uploads this directory as an artifact, so any path under `$GUTENBERG_REPRO_WORKSPACE` is preserved.

Render `report.md` using the structure in `references/report-template.md`. Copy any downloaded issue attachments into the same directory and reference them by relative path. Print the absolute path to `report.md` in the conversation, along with a one-line summary of the verdict.

**In CI mode:** also render `comment-body.md` in the same directory, following `references/comment-summary-template.md`. The file contains the short visible verdict block followed by a `<details><summary>Full report</summary>…</details>` wrapper around the verbatim content of `report.md`.

### Step 8.5 — Post the comment (CI mode only)

Skip this step entirely in interactive mode.

Post the comment only if BOTH conditions hold:

1. Verdict is `Reproduced` or `Not reproduced`. Skip for `Could not execute`, `Inconclusive`, `Insufficient info`, `Out of scope`, or any hard failure.
2. The source issue lives in the same repo as the workflow — derive the source repo from the issue URL (`gh issue view <ref> --json url`) and compare against `$GITHUB_REPOSITORY` (or `$TARGET_REPO` if the workflow exports it). Skip when they differ (e.g., the labeled issue references an upstream `WordPress/gutenberg` issue but the workflow runs in `Automattic/gutenberg-ai-testing`).

When both hold:

```bash
gh issue comment <issue-number> --repo <owner/repo> --body-file <workspace>/<issue-number>-<ts>/comment-body.md
```

When either condition fails, log a single line `comment suppressed: <reason>` to stdout (which the workflow captures) and continue to Step 9. The full report is still uploaded as an artifact regardless.

### Step 9 — Leave running

Do not close the browser. Do not stop wp-env. Do not delete the temp dir. Do not undo seeded content. The user may want to inspect the buggy state interactively.

**In CI mode:** tear down cleanly instead. Call `browser_close`. Run `WP_ENV_PORT=<port> WP_ENV_TESTS_PORT=<tests-port> npm run wp-env stop` (best-effort — the workflow has a `wp-env stop || true` teardown step as a backstop). Leave `$GUTENBERG_REPRO_WORKSPACE` alone — the workflow's `actions/upload-artifact` step uploads it.

## Rigid rules

These constraints override any apparent shortcut:

- Never run `git reset --hard`, `git checkout` of branches, `git stash`, `wp-env destroy`, `wp-env clean`, or any other destructive command. In interactive mode, only on explicit user consent; in CI mode, never — the workspace is ephemeral and the workflow handles cleanup.
- Never modify, create, or commit files inside the Gutenberg checkout (no `.spec.js`, no patches, no scratch files). The workspace path (`$GUTENBERG_REPRO_WORKSPACE` in CI, `/tmp/gutenberg-repro/...` interactively) is the only place to write.
- Never log in by injecting cookies, minting nonces, or using application passwords — use the `wp-login.php` form.
- Never auto-fire on conversational mentions of issues in interactive mode. Only run when the user explicitly types `/gutenberg-repro`. CI invocation is explicit (a workflow prompt) and not a conversational mention.
- Never re-attempt after a successful reproduction.
- Never post to GitHub except in CI mode, only to the repo the workflow targets, and only when the verdict is `Reproduced` or `Not reproduced` (see Step 8.5).

## Additional resources

- **`references/report-template.md`** — Exact structure for `report.md`.
- **`references/comment-summary-template.md`** — Shape of `comment-body.md` (CI mode only): short visible verdict block + `<details>` wrapper around the full report.
- **`references/wp-env-recipes.md`** — Copy-paste WP-CLI invocations for common preconditions (theme switch, create post with content, set user role, install pattern, toggle experiments).
- **`references/playwright-patterns.md`** — Login flow details, common Gutenberg editor selectors, accessibility-snapshot conventions, console-error filtering rules. Tool naming differs between interactive and CI mode — see the file's intro.
