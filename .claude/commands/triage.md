---
description: Run full triage pipeline for a Gutenberg bug report using isolated subagents
allowed_args: issue
allowedTools:
  - Bash
  - Read
  - Write
  - Task
---

# /triage

Triage Gutenberg issue $ARGUMENTS using isolated subagents for token efficiency.

## Architecture

Each step runs as a **separate subagent** with minimal context. Data passes between steps via files:

```
Orchestrator (this command)
    │
    ├─► Subagent 1: Parse Issue
    │   └─► Output: /tmp/triage/<issue>/<issue>.parsed.json
    │
    ├─► Subagent 2: Build Blueprint
    │   └─► Output: /tmp/triage/<issue>/<issue>.blueprint.json
    │
    ├─► Subagent 3: Reproduce Bug (Chrome DevTools)
    │   └─► Output: /tmp/triage/<issue>/<issue>.findings.json
    │
    └─► Subagent 4: Report Findings
        └─► Output: GitHub comment posted
```

## Execution

### Step 1: Parse Issue

Spawn a subagent to parse the issue:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Parse GitHub issue"
  prompt: |
    Parse Gutenberg issue #<ISSUE_NUMBER> from repo aagam-shah/gutenberg.

    Instructions are in: .claude/workflows/triage/1-parse.md
    Read that file and follow the instructions exactly.

    Output to: /tmp/triage/<ISSUE_NUMBER>/

    Return a brief summary: parsed=true/false, needs_triage=true/false, skip_reason if applicable.
```

**Check result**: If `needs_triage=false`, stop and report the skip reason. Do not proceed.

### Step 2: Build Blueprint

Spawn a subagent to build the Playground blueprint:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Build Playground blueprint"
  prompt: |
    Build a WordPress Playground blueprint for issue #<ISSUE_NUMBER>.

    Instructions are in: .claude/workflows/triage/2-blueprint.md
    Read that file and follow the instructions exactly.

    Input: /tmp/triage/<ISSUE_NUMBER>/<ISSUE_NUMBER>.parsed.json
    Output: /tmp/triage/<ISSUE_NUMBER>/<ISSUE_NUMBER>.blueprint.json

    Return a brief summary: blueprint_created=true/false, landing_page, wp_version, gutenberg_version.
```

### Step 3: Reproduce Bug

Spawn a subagent with Chrome DevTools MCP access to reproduce the bug:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Reproduce bug with DevTools"
  prompt: |
    Reproduce the bug for issue #<ISSUE_NUMBER> using Chrome DevTools MCP.

    Instructions are in: .claude/workflows/triage/3-reproduce.md
    Read that file and follow the instructions exactly.

    Input files:
    - /tmp/triage/<ISSUE_NUMBER>/<ISSUE_NUMBER>.parsed.json (for steps)
    - /tmp/triage/<ISSUE_NUMBER>/<ISSUE_NUMBER>.blueprint.json (for Playground)

    Output: /tmp/triage/<ISSUE_NUMBER>/<ISSUE_NUMBER>.findings.json

    Use these Chrome DevTools MCP tools:
    - mcp__chrome-devtools__new_page, navigate_page, take_snapshot, take_screenshot
    - mcp__chrome-devtools__click, fill, fill_form, press_key, hover
    - mcp__chrome-devtools__list_console_messages, list_network_requests
    - mcp__chrome-devtools__wait_for, handle_dialog, close_page

    Return a brief summary: result=reproduced/not_reproduced/inconclusive, key_evidence.
```

### Step 4: Report Findings

Spawn a subagent to generate and post the report:

```
Task tool with:
  subagent_type: "general-purpose"
  description: "Post triage report"
  prompt: |
    Generate and post the triage report for issue #<ISSUE_NUMBER>.

    Instructions are in: .claude/workflows/triage/4-report.md
    Read that file and follow the instructions exactly.

    Input: /tmp/triage/<ISSUE_NUMBER>/<ISSUE_NUMBER>.findings.json
    Output: GitHub comment on issue #<ISSUE_NUMBER>

    Return: comment_posted=true/false, result_summary.
```

## Orchestrator Responsibilities

As the orchestrator, you:

1. **Replace `<ISSUE_NUMBER>`** with the actual issue number from $ARGUMENTS
2. **Spawn each subagent** using the Task tool with the prompts above
3. **Check results** between steps - stop if parse fails or needs_triage=false
4. **Report final status** after all steps complete

## Token Efficiency

This architecture reduces costs by:
- Each subagent starts with fresh, minimal context
- No conversation history accumulates across steps
- Only relevant instruction file is read per step
- Data passes via small JSON files, not conversation context
