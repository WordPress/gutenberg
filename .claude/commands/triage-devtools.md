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
  - mcp__chrome-devtools__list_pages
  - mcp__chrome-devtools__navigate_page
  - mcp__chrome-devtools__new_page
  - mcp__chrome-devtools__performance_analyze_insight
  - mcp__chrome-devtools__performance_start_trace
  - mcp__chrome-devtools__performance_stop_trace
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

## FILE SCOPE RESTRICTION (CRITICAL)

**ONLY read these DevTools-specific files:**
- `.claude/workflows/triage/1-parse.md`
- `.claude/workflows/triage/2-blueprint.md`
- `.claude/workflows/triage/3-reproduce-devtools.md`
- `.claude/workflows/triage/4-report.md`
- `.claude/workflows/triage/gutenberg-devtools-patterns.md`
- `.claude/workflows/triage/blueprint-templates.json`

**DO NOT read or reference:**
- `3-reproduce.md`, `3-reproduce-playwright.md`
- Any Playwright, Puppeteer, or Selenium files
- `.claude/skills/wordpress-playwright-patterns/`

## OUTPUT RULES

- Be extremely concise. No explanations unless asked.
- Use JSON for structured data, not prose.
- No status updates between steps.
- Don't repeat information from previous turns.

## STEP 0: Pre-flight Check

Verify Chrome DevTools MCP is available:

```
Call: mcp__chrome-devtools__list_pages
```

**If this fails:** Write findings.json with `result: "inconclusive"` and `error: "Chrome DevTools MCP unavailable"`, then skip to Step 4.

---

## STEP 1: Parse Issue

**Read:** `.claude/workflows/triage/1-parse.md`

Execute parsing. Output to `/tmp/triage/$ARGUMENTS/$ARGUMENTS.parsed.json`

---

## FAST-FAIL CHECK

After parsing, check for fast-fail conditions. **Skip Steps 2-3 if ANY of these are true:**

| Condition | Action |
|-----------|--------|
| No reproduction steps | Skip to Step 4: "Issue lacks reproduction steps" |
| `needs_triage: false` | Skip to Step 4: Report skip reason |
| Feature request (no `[Type] Bug`) | Skip to Step 4: "Not a bug report" |
| Missing all environment info | Skip to Step 4: "Needs environment info" |

**If fast-fail triggered:**
1. DO NOT read reproduce workflow
2. DO NOT start browser or Playground
3. Go directly to Step 4 with "needs more info" report

---

## STEP 2: Build Blueprint

**Read:** `.claude/workflows/triage/blueprint-templates.json`

1. Select the best matching template based on parsed issue
2. Customize only: `wp` version, `landingPage`, Gutenberg version if needed
3. Output to `/tmp/triage/$ARGUMENTS/$ARGUMENTS.blueprint.json`

---

## STEP 3: Reproduce Bug

### CRITICAL COST RULES

| Rule | Why |
|------|-----|
| **Max 3 snapshots** | Each snapshot = 3K tokens |
| **Use evaluate_script first** | 100 tokens vs 3K for snapshot+click |
| **Use wait_for over snapshot** | Check page state without cost |
| **API-first setup** | wp.data for setup, UI only for bug trigger |
| **Early termination** | Stop when bug reproduced or 3 steps fail |

### KNOWN SELECTORS (Use These First!)

```javascript
// Wait for WordPress ready (ALWAYS do this first)
evaluate_script({ function: `
  return new Promise((resolve) => {
    const check = () => {
      if (window?.wp?.data) resolve(true);
      else setTimeout(check, 100);
    };
    check();
  });
`})

// Disable welcome guides
evaluate_script({ function: `
  wp.data.dispatch('core/preferences').set('core/edit-post', 'welcomeGuide', false);
  wp.data.dispatch('core/preferences').set('core/edit-site', 'welcomeGuide', false);
  return true;
`})

// Insert block via API (NO UI needed)
evaluate_script({ function: `
  const block = wp.blocks.createBlock('core/paragraph', { content: 'Test' });
  wp.data.dispatch('core/block-editor').insertBlock(block);
  return true;
`})

// Publish button
evaluate_script({ function: `document.querySelector('.editor-post-publish-button')?.click()` })

// Save draft
evaluate_script({ function: `document.querySelector('.editor-post-save-draft')?.click()` })

// Settings sidebar
evaluate_script({ function: `document.querySelector('[aria-label="Settings"]')?.click()` })

// Block inserter
evaluate_script({ function: `document.querySelector('.block-editor-inserter__toggle')?.click()` })
```

### EXECUTION FLOW

1. Create screenshots dir: `mkdir -p /tmp/triage/$ARGUMENTS/screenshots`
2. Start Playground: `.claude/bin/playground.sh start --blueprint=/tmp/triage/$ARGUMENTS/$ARGUMENTS.blueprint.json`
3. Open page: `mcp__chrome-devtools__new_page` with Playground URL
4. Wait for WP ready (evaluate_script)
5. Disable welcome guides (evaluate_script)
6. Execute reproduction steps:
   - **Setup steps:** Use wp.data API, not UI clicks
   - **Bug trigger steps:** Use actual UI interactions
   - **Verification:** Use wait_for or evaluate_script, not snapshot
7. **If bug observed:** Take 1 screenshot, stop immediately
8. **If 3 steps fail:** Mark inconclusive, stop
9. Collect evidence (only errors, only if reproduced)
10. Write `/tmp/triage/$ARGUMENTS/$ARGUMENTS.findings.json`
11. Stop Playground: `.claude/bin/playground.sh stop`
12. Close page: `mcp__chrome-devtools__close_page`

### SNAPSHOT BUDGET

- Snapshot 1: Only if selectors don't work
- Snapshot 2: Only if navigating to completely different page
- Snapshot 3: Bug evidence (if reproduced)

**If stuck on patterns:** Read `.claude/workflows/triage/gutenberg-devtools-patterns.md`

---

## STEP 4: Report Findings

Spawn Sonnet subagent for quality final report:

```
Task tool with:
  subagent_type: "general-purpose"
  model: "sonnet"
  max_turns: 5
  description: "Generate triage report"
  prompt: |
    Generate concise GitHub comment for Gutenberg issue triage.

    Read:
    - /tmp/triage/$ARGUMENTS/$ARGUMENTS.findings.json
    - /tmp/triage/$ARGUMENTS/$ARGUMENTS.parsed.json

    If result is "reproduced":
      Search Gutenberg codebase for affected files using labels and error messages.
      Include "Likely affected code" section with file paths.

    If result is "not_reproduced" or "inconclusive":
      Skip code search entirely.

    Format (15-25 lines max):
    ```
    ## Triage Results

    **Result:** [emoji] [status]
    **Environment:** WP {ver}, Gutenberg {ver}, PHP {ver}

    {1-2 sentence summary}

    <details>
    <summary>Evidence</summary>
    {console errors, network failures - only if relevant}
    </details>

    **Likely affected code:** (only if reproduced)
    - `path/to/file` - reason

    **Suggested fix:** {1-2 sentences} (only if reproduced)

    ---
    <sub>Automated triage via WordPress Playground</sub>
    ```

    Post comment:
    gh issue comment $ARGUMENTS --repo aagam-shah/gutenberg --body "..."
```

---

## ERROR HANDLING

| Error | Action |
|-------|--------|
| MCP unavailable | findings.json with `result: "inconclusive"`, skip to Step 4 |
| Element not found | Try evaluate_script first, then snapshot as fallback |
| Page timeout | List console/network errors, mark inconclusive |
| 3+ step failures | Stop early, mark inconclusive |

---

## EXPECTED COSTS

| Scenario | Target Cost |
|----------|-------------|
| Full reproduction | $0.20-0.25 |
| Fast-fail (no repro steps) | $0.05-0.10 |
| Bug not reproduced | $0.15-0.20 |

---

## DO NOT USE

- Playwright MCP tools (`mcp__playwright__*`)
- Puppeteer (npm/npx)
- Selenium or WebDriver
- Custom browser automation scripts

If Chrome DevTools MCP fails, write inconclusive findings and report - do not attempt alternatives.
