---
description: Run full triage pipeline for a Gutenberg bug report using Chrome DevTools MCP
allowed_args: issue
allowedTools:
  - Bash
  - Read
  - Write
  - Edit
  - Task
  - WebFetch
  - Glob
  - Grep
  - mcp__chrome-devtools__new_page
  - mcp__chrome-devtools__navigate_page
  - mcp__chrome-devtools__take_snapshot
  - mcp__chrome-devtools__take_screenshot
  - mcp__chrome-devtools__click
  - mcp__chrome-devtools__fill
  - mcp__chrome-devtools__fill_form
  - mcp__chrome-devtools__press_key
  - mcp__chrome-devtools__list_console_messages
  - mcp__chrome-devtools__list_network_requests
  - mcp__chrome-devtools__wait_for
  - mcp__chrome-devtools__handle_dialog
  - mcp__chrome-devtools__hover
  - mcp__chrome-devtools__close_page
  - mcp__chrome-devtools__list_pages
  - mcp__chrome-devtools__select_page
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

### Step 1: Parse Issue (Direct)

**Read file:** `.claude/workflows/triage/1-parse.md`

Execute the parsing instructions. If `needs_triage=false` in the output, stop and report skip reason.

### Step 2: Build Blueprint (Direct)

**Read file:** `.claude/workflows/triage/2-blueprint.md`

Execute the blueprint generation instructions.

### Step 3: Reproduce Bug (Subagent)

**IMPORTANT**: Spawn a subagent to isolate browser snapshot context from the main conversation.

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Reproduce bug with DevTools"
  prompt: |
    Reproduce the bug for issue #<issue> using Chrome DevTools MCP.

    Read these files first:
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

## Token Savings Mechanism

**Without subagent** (original approach):
- Browser snapshots accumulate in main context
- Each snapshot ~5-10KB of tokens
- 10+ snapshots = 50-100KB+ accumulated
- All this context is cached and re-read on each turn

**With subagent for Step 3**:
- Browser snapshots stay in subagent context
- Subagent completes and context is discarded
- Main agent only sees final result summary
- Steps 1, 2, 4 still benefit from caching

## Notes

- This command uses Chrome DevTools MCP for browser automation
- For Playwright-based triage, use `/triage` instead
- Only Step 3 uses a subagent - this is intentional for optimal cache/isolation balance
