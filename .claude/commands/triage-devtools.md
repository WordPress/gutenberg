---
description: Run full triage pipeline for a Gutenberg bug report using Chrome DevTools MCP with isolated subagents for token efficiency
allowed_args: issue
allowedTools:
  - Bash
  - Read
  - Write
  - Task
---

# /triage-devtools

Triage Gutenberg issue $ARGUMENTS using Chrome DevTools MCP with isolated subagents for token efficiency.

## Architecture

Each step runs as a **separate subagent** with minimal context. Data passes between steps via files:

```
Orchestrator (this command)
    |
    +---> Subagent 1: Parse Issue
    |     Output: /tmp/triage/<issue>/<issue>.parsed.json
    |
    +---> Subagent 2: Build Blueprint
    |     Output: /tmp/triage/<issue>/<issue>.blueprint.json
    |
    +---> Subagent 3: Reproduce Bug (Chrome DevTools)
    |     Output: /tmp/triage/<issue>/<issue>.findings.json
    |
    +---> Subagent 4: Report Findings
          Output: GitHub comment posted
```

## Output Directory

`/tmp/triage/<issue>/`

## Execution

Execute steps in sequence using the Task tool to spawn subagents.

### Step 1: Parse Issue

Spawn a subagent to parse the issue:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Parse Gutenberg issue"
  prompt: |
    Parse Gutenberg issue #<issue> following the instructions in .claude/workflows/triage/1-parse.md

    Output the parsed data to /tmp/triage/<issue>/<issue>.parsed.json

    If needs_triage=false, return early with the skip reason.
```

After completion, read `/tmp/triage/<issue>/<issue>.parsed.json` to check if `needs_triage` is false. If so, stop and report skip reason.

### Step 2: Build Blueprint

Spawn a subagent to build the blueprint:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Build Playground blueprint"
  prompt: |
    Build a WordPress Playground blueprint for issue #<issue>.

    Read the parsed issue data from: /tmp/triage/<issue>/<issue>.parsed.json
    Follow the instructions in: .claude/workflows/triage/2-blueprint.md

    Output the blueprint to: /tmp/triage/<issue>/<issue>.blueprint.json
```

### Step 3: Reproduce Bug

Spawn a subagent with Chrome DevTools MCP tools to reproduce the bug:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Reproduce bug with DevTools"
  prompt: |
    Reproduce the bug for issue #<issue> using Chrome DevTools MCP.

    Read these files first:
    - Parsed issue: /tmp/triage/<issue>/<issue>.parsed.json
    - Blueprint: /tmp/triage/<issue>/<issue>.blueprint.json
    - Instructions: .claude/workflows/triage/3-reproduce.md

    Available Chrome DevTools MCP tools:
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

    Output findings to: /tmp/triage/<issue>/<issue>.findings.json
```

### Step 4: Report Findings

Spawn a subagent to generate and post the report:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Post triage report"
  prompt: |
    Generate and post the triage report for issue #<issue>.

    Read these files:
    - Parsed issue: /tmp/triage/<issue>/<issue>.parsed.json
    - Blueprint: /tmp/triage/<issue>/<issue>.blueprint.json
    - Findings: /tmp/triage/<issue>/<issue>.findings.json
    - Instructions: .claude/workflows/triage/4-report.md

    Post the report as a GitHub comment on the issue.
```

## Benefits of Subagent Architecture

1. **Isolated context**: Each subagent only sees what it needs
2. **Reduced token usage**: No accumulation of browser snapshots across steps
3. **Better debugging**: Each step's output is saved to disk
4. **Parallelization potential**: Steps 1-2 could run in parallel in future

## Error Handling

If any subagent fails:
1. Read its output file to understand what happened
2. Report the failure with context
3. Do not proceed to subsequent steps

## Notes

- This command uses Chrome DevTools MCP for browser automation
- For Playwright-based triage, use `/triage` instead
- Subagents inherit tool permissions from this command's allowedTools plus their specific MCP tools
