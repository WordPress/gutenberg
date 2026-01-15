---
description: Run cost-optimized triage for Gutenberg bugs using Chrome DevTools MCP
argument-hint: [issue-number]
model: haiku
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Task
  - WebFetch
  - Glob
  - Grep
  - mcp__chrome-devtools__list_pages
  - mcp__chrome-devtools__click
  - mcp__chrome-devtools__close_page
  - mcp__chrome-devtools__drag
  - mcp__chrome-devtools__emulate
  - mcp__chrome-devtools__evaluate_script
  - mcp__chrome-devtools__fill
  - mcp__chrome-devtools__fill_form
  - mcp__chrome-devtools__get_console_message
  - mcp__chrome-devtools__get_network_request
  - mcp__chrome-devtools__handle_dialog
  - mcp__chrome-devtools__hover
  - mcp__chrome-devtools__list_console_messages
  - mcp__chrome-devtools__list_network_requests
  - mcp__chrome-devtools__navigate_page
  - mcp__chrome-devtools__new_page
  - mcp__chrome-devtools__press_key
  - mcp__chrome-devtools__resize_page
  - mcp__chrome-devtools__select_page
  - mcp__chrome-devtools__take_screenshot
  - mcp__chrome-devtools__take_snapshot
  - mcp__chrome-devtools__upload_file
  - mcp__chrome-devtools__wait_for
---

# /triage-devtools $ARGUMENTS

Cost-optimized Gutenberg bug triage using Chrome DevTools MCP.

## ARCHITECTURE (Critical for Cost Control)

```
Haiku (main)     → Steps 0, 1, 2 + dispatch subagents
Haiku (subagent) → Step 3 browser (ISOLATED - context discarded after)
Sonnet (subagent) → Step 4 report (quality matters for GitHub comment)
```

**Why subagents?** Browser snapshots are 3K+ tokens each. Without isolation, 53 turns × accumulated snapshots = 2.5M tokens = $0.40+ wasted.

## FILE SCOPE RESTRICTION

**ONLY read these files:**
- `.claude/workflows/triage/1-parse.md`
- `.claude/workflows/triage/blueprint-templates.json`

**DO NOT read:** `3-reproduce-devtools.md`, `gutenberg-devtools-patterns.md`, any Playwright files

## OUTPUT RULES

- Extremely concise. No explanations.
- JSON for structured data.
- No status updates between steps.

---

## STEP 0: Pre-flight Check

```
Call: mcp__chrome-devtools__list_pages
```

**If fails:** Write `/tmp/triage/$ARGUMENTS/$ARGUMENTS.findings.json` with `{"result": "inconclusive", "error": "Chrome DevTools MCP unavailable"}`, skip to Step 4.

---

## STEP 1: Parse Issue

**Read:** `.claude/workflows/triage/1-parse.md`

Execute parsing. Output: `/tmp/triage/$ARGUMENTS/$ARGUMENTS.parsed.json`

---

## FAST-FAIL CHECK

**Skip Steps 2-3 if ANY:**
- No reproduction steps → Step 4: "Issue lacks reproduction steps"
- `needs_triage: false` → Step 4: Report skip reason
- No `[Type] Bug` label → Step 4: "Not a bug report"

**If fast-fail:** Write minimal findings.json, go directly to Step 4.

---

## STEP 2: Build Blueprint

**Read:** `.claude/workflows/triage/blueprint-templates.json`

1. Select matching template
2. Customize: `wp` version, `landingPage`, Gutenberg version
3. Output: `/tmp/triage/$ARGUMENTS/$ARGUMENTS.blueprint.json`

---

## STEP 3: Reproduce Bug (SUBAGENT - ISOLATED)

**CRITICAL:** Spawn Haiku subagent to isolate browser context. All snapshots stay in subagent, discarded after.

```
Task tool with:
  subagent_type: "general-purpose"
  model: "haiku"
  max_turns: 15
  description: "Reproduce bug with DevTools"
  prompt: |
    Reproduce Gutenberg bug #$ARGUMENTS using Chrome DevTools MCP.

    HARD LIMITS (will be enforced):
    - MAX 3 SNAPSHOTS total. After 3, use only evaluate_script.
    - MAX 15 TURNS. Stop and write findings if approaching limit.
    - STOP IMMEDIATELY when bug is reproduced or after 3 failed steps.

    COST RULES:
    1. Use evaluate_script FIRST for all interactions
    2. Use wait_for to check page state (not snapshot)
    3. Snapshot ONLY when selectors fail or for bug evidence
    4. API-first: wp.data for setup, UI only for bug trigger

    KNOWN SELECTORS (use these, no snapshot needed):
    - Wait for WP ready: window?.wp?.data exists
    - Disable welcome: wp.data.dispatch('core/preferences').set(...)
    - Insert block: wp.blocks.createBlock() + insertBlock()
    - Publish: document.querySelector('.editor-post-publish-button')
    - Settings: document.querySelector('[aria-label="Settings"]')

    EXECUTION:
    1. mkdir -p /tmp/triage/$ARGUMENTS/screenshots
    2. Start: .claude/bin/playground.sh start --blueprint=/tmp/triage/$ARGUMENTS/$ARGUMENTS.blueprint.json
    3. Read parsed issue: /tmp/triage/$ARGUMENTS/$ARGUMENTS.parsed.json
    4. Open Playground URL with mcp__chrome-devtools__new_page
    5. Wait for WP ready (evaluate_script)
    6. Disable welcome guides (evaluate_script)
    7. Execute reproduction steps from parsed.json
    8. If bug observed: 1 screenshot, stop
    9. Write findings: /tmp/triage/$ARGUMENTS/$ARGUMENTS.findings.json
    10. Stop: .claude/bin/playground.sh stop
    11. Close: mcp__chrome-devtools__close_page

    FINDINGS FORMAT:
    {
      "result": "reproduced | not_reproduced | inconclusive",
      "environment": { "wordpress": "...", "gutenberg": "...", "php": "8.2" },
      "steps_executed": [{ "step": 1, "description": "...", "success": true }],
      "evidence": {
        "console_errors": [],
        "screenshots": [],
        "observations": "..."
      },
      "snapshots_used": <count>,
      "turns_used": <count>
    }
```

After subagent completes, read `/tmp/triage/$ARGUMENTS/$ARGUMENTS.findings.json` to continue.

---

## STEP 4: Report Findings (SUBAGENT - SONNET)

**Only spawn Sonnet if findings exist.** Sonnet produces quality GitHub comments.

```
Task tool with:
  subagent_type: "general-purpose"
  model: "sonnet"
  max_turns: 5
  description: "Generate triage report"
  prompt: |
    Generate concise GitHub comment for Gutenberg issue #$ARGUMENTS.

    Read:
    - /tmp/triage/$ARGUMENTS/$ARGUMENTS.findings.json
    - /tmp/triage/$ARGUMENTS/$ARGUMENTS.parsed.json

    RULES:
    - If result is "reproduced": Search codebase for affected files, include in report
    - If result is "not_reproduced" or "inconclusive": Skip code search entirely
    - Keep comment to 15-25 lines max

    FORMAT:
    ## Triage Results

    **Result:** [emoji] [status]
    **Environment:** WP {ver}, Gutenberg {ver}, PHP {ver}

    {1-2 sentence summary}

    <details>
    <summary>Evidence</summary>
    {only if relevant errors/failures}
    </details>

    **Likely affected code:** (only if reproduced)
    - `path/to/file` - reason

    ---
    <sub>Automated triage via WordPress Playground</sub>

    POST COMMENT:
    gh issue comment $ARGUMENTS --repo aagam-shah/gutenberg --body "..."
```

---

## ERROR HANDLING

| Error | Action |
|-------|--------|
| MCP unavailable | Write inconclusive findings, skip to Step 4 |
| Subagent timeout | Read partial findings if exist, report as inconclusive |
| 3+ step failures | Stop early, mark inconclusive |

---

## EXPECTED COSTS

| Scenario | Target Cost |
|----------|-------------|
| Full reproduction | $0.25-0.35 |
| Fast-fail | $0.05-0.10 |
| Not reproduced | $0.15-0.25 |

---

## DO NOT

- Use Playwright, Puppeteer, Selenium
- Run browser automation in main agent (use subagent)
- Take more than 3 snapshots
- Read large workflow files (instructions are inline)
