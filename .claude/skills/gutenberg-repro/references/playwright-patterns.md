# Playwright MCP patterns for Gutenberg

Tactical guidance for driving the Gutenberg editor via Playwright MCP tools. The skill drives the browser directly through `mcp__plugin_playwright_playwright__*` tool calls — it does not write `.spec.js` files and does not use the `e2e-test-utils-playwright` package.

## Tool inventory

The relevant Playwright MCP tools:

- `browser_navigate(url)` — load a URL
- `browser_snapshot()` — accessibility-tree snapshot of the current page (cheap, diffable, text)
- `browser_take_screenshot()` — visual PNG (expensive in tokens, use sparingly)
- `browser_click(element, ref)` — click via the snapshot ref
- `browser_type(element, ref, text)` — type into an input
- `browser_fill_form(fields)` — fill multiple fields at once
- `browser_press_key(key)` — keyboard key (Enter, Escape, etc.)
- `browser_evaluate(function)` — run JavaScript in the page
- `browser_wait_for({text, textGone, time})` — wait condition
- `browser_console_messages()` — read accumulated console messages
- `browser_network_requests()` — read accumulated network requests
- `browser_close()` — close the browser session (the skill does NOT call this; see SKILL.md "Leave running")

## Login flow

Always log in through the UI form. Do not inject cookies, mint nonces, or use application passwords. `<port>` is the session-specific port allocated in SKILL.md Step 5 — wp-env is not running on 8888 in this session.

```
1. browser_navigate("http://localhost:<port>/wp-login.php")
2. browser_snapshot()  — locate the user_login and user_pass inputs
3. browser_fill_form([
     {name: "Username", ref: "<user_login ref>", value: "admin"},
     {name: "Password", ref: "<user_pass ref>", value: "password"},
   ])
4. browser_click("Log In button", "<submit ref>")
5. browser_wait_for({text: "Dashboard"})  — or any post-login marker
```

Treat the login flow as setup noise: do not include it in the report's execution log unless it fails. A login failure is itself a `Could not execute` outcome.

## Accessibility snapshots vs screenshots

Prefer `browser_snapshot()` over `browser_take_screenshot()` for:

- Locating elements before clicking (you need the `ref` anyway).
- Comparing observed state against the plan's `expected` and `actual`.
- Recording what the page looked like at a step boundary.

Use `browser_take_screenshot()` only at the moments the SKILL prescribes:

- One bug-state screenshot when an attempt reproduces (saved to `<temp-dir>/bug-state.png`).
- One final-state screenshot from the last attempt when the overall verdict is `Not reproduced` or `Could not execute` (saved to `<temp-dir>/final-state.png`).

**Path sandbox.** Playwright MCP only accepts file paths inside the project root or `.playwright-mcp/`; `/tmp/...` is rejected. Pass a project-relative filename to `browser_take_screenshot` (e.g., `bug-state.png`), then `mv` the file into the report temp dir after the call returns. The same sandbox applies to `browser_file_upload` — see `references/wp-env-recipes.md` § Playground fallbacks.

## Common editor entry points

| Goal                          | URL                                                            |
| ----------------------------- | -------------------------------------------------------------- |
| New post (post editor)        | `http://localhost:<port>/wp-admin/post-new.php`                  |
| Edit existing post by ID      | `http://localhost:<port>/wp-admin/post.php?post=<ID>&action=edit` |
| New page                      | `http://localhost:<port>/wp-admin/post-new.php?post_type=page`   |
| Site editor                   | `http://localhost:<port>/wp-admin/site-editor.php`               |
| Widgets screen                | `http://localhost:<port>/wp-admin/widgets.php`                   |
| Navigation editor             | `http://localhost:<port>/wp-admin/site-editor.php?path=/navigation` |
| Pattern editor                | `http://localhost:<port>/wp-admin/site-editor.php?path=/patterns` |

## Editor stability waits

The Gutenberg editor mounts asynchronously after initial DOM. Adding blocks before it's ready leads to flaky failures that look like bugs. After navigation:

1. `browser_wait_for({text: "Add title"})` for the post editor — title placeholder is one of the last things to mount.
2. For the site editor, `browser_wait_for({text: "Saved"})` or wait for the canvas iframe to settle.

If the issue itself is "the editor never loads," skip these waits — that's exactly the bug.

## Block insertion

Two common paths to inserting a block, in order of preference:

1. **Slash inserter:** focus the empty paragraph, type `/<block-name>`, press `Enter`. Fast and matches how users insert blocks.
2. **Inserter sidebar:** click the `+` button in the top bar, search for the block, click the result.

Avoid programmatic inserts via `browser_evaluate(...wp.data.dispatch...)` unless the plan specifically targets a data-layer bug — they bypass the very UI code paths most issues are about.

## Console error capture and filtering

Subscribe to console messages at the start of each attempt by recording the baseline length, then read `browser_console_messages()` at the end of the attempt and take the diff.

Filter rule: include a message only if its text or its source URL matches **any** of:

- Substring `wp-` (covers `wp-admin`, `wp-includes`, `wp-content`)
- Substring `@wordpress/`
- Substring `gutenberg`
- File path under `/build/` (Gutenberg's built assets)

Discard everything else (third-party scripts, browser warnings, React devtools chatter).

Include the matched substring in the report so a human can verify the filter.

## Network error capture

Read `browser_network_requests()` at the end of each attempt. Surface:

- Any request to `/wp-json/` returning ≥ 400.
- Any request to `/wp-admin/admin-ajax.php` returning ≥ 400.
- Any 5xx from any origin.

Include method, URL, status, and the response body excerpt if available.

## Timeouts

- Per step: 10 seconds. Apply via the tool's natural timeout or by passing `{time: 10}` to `browser_wait_for` where appropriate.
- Per attempt: 90 seconds wall clock from "start login" to "observed result." If the attempt exceeds this cap, record `timeout (step <n>)` and proceed to the next attempt.

A step timing out is recorded with the step number — that pointer is the most useful piece of debugging info in a `Could not execute` report.

## Resetting between attempts

Between attempts, open a fresh browser context rather than reusing the previous one. Stale React state, dirty editor history, and open modals are common sources of flakiness across attempts. A fresh navigate + login is cheap compared to chasing inter-attempt contamination.

## What NOT to do

- Do not use `browser_run_code_unsafe`. It is not needed for repro work.
- Do not write `.spec.js` files. The skill is ad-hoc-only.
- Do not call `browser_close` at the end of the run — SKILL.md Step 9 explicitly leaves the browser open.
- Do not interact with elements via raw selectors. Always go through `browser_snapshot` and refs.
- Do not silently retry a step that timed out within an attempt. Record the timeout and let the attempt-level loop decide.
