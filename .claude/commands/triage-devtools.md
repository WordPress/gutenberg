---
description: Run full triage pipeline for a Gutenberg bug report using Chrome DevTools MCP
argument-hint: [issue-number]
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

# /triage-devtools

Triage Gutenberg issue $ARGUMENTS using Chrome DevTools MCP.

## Architecture (Hybrid for Token Efficiency)

Steps 1, 2, and 4 run directly (lightweight, benefit from caching).
Step 3 runs as a **subagent** to isolate browser snapshot context (main token sink).

```
Main Agent
    |
    +---> Step 1: Parse Issue (direct)
    |     Output: /tmp/triage/<issue>/<issue>.parsed.json
    |
    +---> Step 2: Build Blueprint (direct)
    |     Output: /tmp/triage/<issue>/<issue>.blueprint.json
    |
    +---> Step 3: Reproduce Bug (SUBAGENT - isolates browser snapshots)
    |     Output: /tmp/triage/<issue>/<issue>.findings.json
    |
    +---> Step 4: Report Findings (direct)
          Output: GitHub comment posted
```

## Output Directory

`/tmp/triage/<issue>/`

## Workflow Files

| Step | Instruction File | Execution |
|------|------------------|-----------|
| 1. Parse Issue | `.claude/workflows/triage/1-parse.md` | Direct |
| 2. Build Blueprint | `.claude/workflows/triage/2-blueprint.md` | Direct |
| 3. Reproduce Bug | `.claude/workflows/triage/3-reproduce-devtools.md` | **Subagent** |
| 4. Report Findings | `.claude/workflows/triage/4-report.md` | Direct |

## Execution

### Step 0: Pre-flight Check (REQUIRED)

**BEFORE doing anything else**, verify Chrome DevTools MCP is available:

```
Call: mcp__chrome-devtools__list_pages
```

**If this fails or returns an error about MCP not being available:**
1. **STOP IMMEDIATELY** - do not proceed to Step 1
2. Post a GitHub comment explaining the failure:
   ```
   ## Triage Failed: Chrome DevTools MCP Unavailable

   The Chrome DevTools MCP server failed to start. This is required for browser-based bug reproduction.

   **Error:** [include error message]

   **Next steps:**
   - Check CI logs for MCP server startup errors
   - Verify Chrome is installed in the CI environment
   - Try running the triage manually
   ```
3. Exit with failure

**Only proceed to Step 1 if the pre-flight check succeeds.**

---

### Step 1: Parse Issue (Direct)

**Read file:** `.claude/workflows/triage/1-parse.md`

Execute the parsing instructions. If `needs_triage=false` in the output, stop and report skip reason.

### Step 2: Build Blueprint (Direct)

**Read file:** `.claude/workflows/triage/2-blueprint.md`

Execute the blueprint generation instructions.

### Step 3: Reproduce Bug (Subagent)

**IMPORTANT**: Spawn a subagent to isolate browser snapshot context from the main conversation.

**CRITICAL COST OPTIMIZATION**: Use Haiku model and limit turns to control costs.

```
Task tool with:
  subagent_type: "general-purpose"
  model: "haiku"        # USE HAIKU - 10x cheaper than Sonnet for browser automation
  max_turns: 20         # Limit turns to prevent runaway context accumulation
  description: "Reproduce bug with DevTools"
  prompt: |
    Reproduce the bug for issue #<issue> using Chrome DevTools MCP.

    COST OPTIMIZATION RULES (CRITICAL):
    1. MINIMIZE SNAPSHOTS: Only take_snapshot when you need to find an element. Maximum 5 snapshots.
    2. USE evaluate_script: For simple interactions, use JavaScript directly instead of snapshot+click.
    3. USE wait_for: Instead of snapshot to check if page loaded, use wait_for with expected text.
    4. BATCH ACTIONS: Do multiple actions before taking another snapshot.

    FIRST: Verify Chrome DevTools MCP is available by calling mcp__chrome-devtools__list_pages.
    If this fails, write a findings.json with result="inconclusive" and error="Chrome DevTools MCP unavailable", then stop.

    Read these files:
    - Parsed issue: /tmp/triage/<issue>/<issue>.parsed.json
    - Blueprint: /tmp/triage/<issue>/<issue>.blueprint.json
    - Instructions: .claude/workflows/triage/3-reproduce-devtools.md

    Start Playground, execute reproduction steps, collect evidence, and write findings.

    Output findings to: /tmp/triage/<issue>/<issue>.findings.json

    When done, stop Playground and close the browser.
```

After subagent completes, read the findings file to continue.

### Step 4: Report Findings (Direct)

**Read file:** `.claude/workflows/triage/4-report.md`

Execute the reporting instructions and post the GitHub comment.

## Why Hybrid Architecture?

1. **Cache efficiency**: Steps 1, 2, 4 are lightweight and benefit from prompt caching (90% discount on cache reads)

2. **Context isolation where it matters**: Step 3 (browser automation) generates large snapshots that would accumulate in context. Running it as a subagent:
   - Subagent context is discarded after completion
   - Only the findings.json result persists
   - Main agent never sees the browser snapshots

3. **Reduced overhead**: Only one subagent spawn instead of four

## Cost Optimization Strategy

**Target cost: ~$0.20-0.30 per triage** (down from $2+ without optimization)

### Key Optimizations:

1. **Use Haiku for browser automation** (10x cheaper than Sonnet)
   - Browser automation doesn't need Sonnet's reasoning power
   - Haiku is sufficient for click/type/navigate operations
   - Cost reduction: $2.00 → $0.20

2. **Limit snapshots** (each snapshot = 2-5K tokens)
   - Maximum 5 snapshots per reproduction
   - Use `wait_for` instead of snapshot to check page state
   - Use `evaluate_script` for direct DOM interaction

3. **Limit subagent turns** (max_turns: 20)
   - Prevents runaway context accumulation
   - Each turn re-reads entire context (even cached = cost)

4. **Subagent isolation** (still valuable)
   - Browser snapshots stay in subagent context
   - Main agent never sees the 50-100KB of snapshot data
   - Subagent context discarded after completion

### Why Snapshots Are Expensive:

```
Each snapshot = ~3K tokens
20 snapshots = 60K tokens accumulated
Each turn re-reads context (even cached)
40 turns × 60K tokens = 2.4M cache reads
2.4M × $0.30/1M = $0.72 just for cache reads!
```

### Token-Efficient Patterns:

```javascript
// EXPENSIVE: Snapshot → Find → Click (3K tokens per snapshot)
take_snapshot()
click(uid: "abc123")

// CHEAP: Direct JavaScript (~100 tokens)
evaluate_script({ function: "document.querySelector('button.save').click()" })

// CHEAP: Wait for text instead of snapshot
wait_for({ text: "Settings saved" })
```

## Notes

- This command uses Chrome DevTools MCP for browser automation
- For Playwright-based triage, use `/triage` instead
- Only Step 3 uses a subagent - this is intentional for optimal cache/isolation balance

## IMPORTANT: Do NOT use Playwright or Other Browser Automation Fallbacks

This workflow uses **Chrome DevTools MCP only**. Do NOT:
- Read or reference `3-reproduce-playwright.md`
- Use any `mcp__playwright__*` tools
- Fall back to Playwright if DevTools fails
- Use Puppeteer directly (via npm/npx or any other method)
- Use Selenium, WebDriver, or any other browser automation library
- Attempt to write custom browser automation scripts

If Chrome DevTools MCP is unavailable, **fail fast**:
1. Write a findings.json with `result: "inconclusive"` and explain MCP was unavailable
2. Post a GitHub comment explaining the failure
3. **STOP** - do not attempt any alternatives or workarounds
