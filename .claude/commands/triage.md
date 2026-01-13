---
description: Run full triage pipeline for a Gutenberg bug report
allowed_args: issue
allowedTools:
  - Bash
  - Read
  - Write
  - Skill
---

# /triage

Run the full end-to-end triage pipeline for a Gutenberg issue.

## Arguments

- `issue` (required): Issue number or GitHub URL

## Process

Execute these steps in sequence:

1. **Parse the issue**
   - Fetch issue data using **parse-issue** skill and extract reproduction steps
   - Check if triage is needed (maintainers may have already confirmed)
   - Write to `.triage/<issue>.parsed.json`
   - **If `needs_triage: false`** → Exit early with explanation

2. **Build a blueprint** (only if triage needed)
   - Generate Playground blueprint from parsed data using **build-blueprint** skill
   - Write to `.triage/<issue>.blueprint.json`

3. **Reproduce the bug**
   - Use the **reproduce** skill
   - Start Playground with the blueprint
   - Execute reproduction steps via browser automation
   - Collect evidence (screenshots, console errors, network requests)
   - Determine result: ✅ REPRODUCED, ❌ NOT REPRODUCED, or ⚠️ INCONCLUSIVE
   - Stop Playground
   - Write to `.triage/<issue>.findings.json`

4. **Report findings**
   - Use the **report** skill
   - Summarize reproduction results in GitHub-comment format
   - Identify suspect code areas based on labels and evidence
   - Output console summary

## Early Exit Conditions

Triage will exit early without running reproduction steps if:

- Issue has `[Status] In Progress` label
- Maintainers (MEMBER/OWNER) have confirmed the bug in comments
- Code location already identified
- Issue has linked PR

**Early exit message format:**
```
TRIAGE NOT NEEDED: Issue #<number>

REASON: <explanation>

DETAILS:
- <specific reasons why triage was skipped>

The issue has been parsed and saved to .triage/<issue>/<issue>.parsed.json
```

## Output

All results are written to the `.triage/<issue>/` directory:
- `<issue>.parsed.json` - Parsed issue data (always created)
- `<issue>.blueprint.json` - Playground blueprint (only if triage needed)
- `<issue>.findings.json` - Reproduction results and evidence (only if triage needed)
- `screenshots/` - Screenshots captured during reproduction (only if triage needed)

