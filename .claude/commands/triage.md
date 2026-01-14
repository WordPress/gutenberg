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
| 3. Reproduce Bug | `.claude/workflows/triage/3-reproduce.md` |
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

**Read file:** `.claude/workflows/triage/3-reproduce.md`

Execute the reproduction instructions using Chrome DevTools MCP.

### Step 4: Report Findings

**Read file:** `.claude/workflows/triage/4-report.md`

Execute the reporting instructions and post the GitHub comment.
