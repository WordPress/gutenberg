---
description: Run full triage pipeline for a Gutenberg bug report
allowed_args: issue
allowedTools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_press_key
  - mcp__playwright__browser_fill_form
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_console_messages
  - mcp__playwright__browser_network_requests
  - mcp__playwright__browser_wait_for
  - mcp__playwright__browser_handle_dialog
  - mcp__playwright__browser_hover
  - mcp__playwright__browser_navigate_back
  - mcp__playwright__browser_close
---

# /triage

Triage Gutenberg issue $ARGUMENTS.

## Output Directory

`/tmp/triage/<issue>/`

## Workflow Files

Step-by-step instructions are in separate files. You MUST read each file before executing that step:

| Step | Instruction File |
|------|------------------|
| 1. Parse Issue | `.claude/workflows/triage/1-parse.md` |
| 2. Build Blueprint | `.claude/workflows/triage/2-blueprint.md` |
| 3. Reproduce Bug | `.claude/workflows/triage/3-reproduce-playwright.md` |
| 4. Report Findings | `.claude/workflows/triage/4-report.md` |

## Execution

Execute steps in sequence. For each step:
1. Read the instruction file using the Read tool
2. Follow the instructions in that file
3. Proceed to the next step

### Step 1: Parse Issue

**Read file:** `.claude/workflows/triage/1-parse.md`

Execute the parsing instructions. If `needs_triage=false` in the output, stop and report skip reason.

### Step 2: Build Blueprint

**Read file:** `.claude/workflows/triage/2-blueprint.md`

Execute the blueprint generation instructions.

### Step 3: Reproduce Bug

**Read file:** `.claude/workflows/triage/3-reproduce-playwright.md`

Execute the reproduction instructions using Playwright MCP.

### Step 4: Report Findings

**Read file:** `.claude/workflows/triage/4-report.md`

Execute the reporting instructions and post the GitHub comment.
