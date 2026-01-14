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

Run the full end-to-end triage pipeline for a Gutenberg issue.

## Arguments

- `issue` (required): Issue number or GitHub URL

## Process Overview

Execute these steps in sequence:

1. **Parse the issue** - Fetch issue data and extract reproduction steps
2. **Build a blueprint** - Generate Playground blueprint from parsed data
3. **Reproduce the bug** - Execute reproduction steps via browser automation
4. **Report findings** - Summarize results in GitHub-comment format

## Output

All results are written to the `/tmp/triage/<issue>/` directory:
- `<issue>.parsed.json` - Parsed issue data (always created)
- `<issue>.blueprint.json` - Playground blueprint (only if triage needed)
- `<issue>.findings.json` - Reproduction results and evidence (only if triage needed)
- `screenshots/` - Screenshots captured during reproduction (only if triage needed)

---

# Step 1: Parse Issue

Parse a WordPress Gutenberg bug report into structured reproduction data.

## 1.1 Fetch the issue and comments

```bash
gh issue view <number> --repo aagam-shah/gutenberg --json title,body,labels,state,comments,author
```

Fetches issue body AND all comments (often contain critical context).

## 1.2 Validate it's a bug report

Check that:

- Issue has the `[Type] Bug` label
- Issue state is `open` (warn if closed but continue)

If not a bug report, stop and inform the user.

## 1.3 Parse and understand labels

Gutenberg uses a structured label taxonomy. Extract ALL labels for context.

**Label prefixes:**

| Prefix      | Purpose          | Example                  |
| ----------- | ---------------- | ------------------------ |
| `[Type]`    | Issue type       | `[Type] Bug`             |
| `[Status]`  | Workflow state   | `[Status] Needs Testing` |
| `[Block]`   | Affected block   | `[Block] Navigation`     |
| `[Feature]` | Affected feature | `[Feature] Patterns`     |
| `[Package]` | npm package      | `[Package] Components`   |
| `[Focus]`   | Area of focus    | `[Focus] Accessibility`  |

**Use labels to disambiguate steps:**

- If `[Block] More` is present and steps mention "the block", it's the More block
- If `[Feature] Block Visibility` is present and steps say "set to Hide", it's the visibility toggle
- Label descriptions often contain helpful context

## 1.4 Extract context from comments

Comments often contain critical information missing from the original report.

**Look for:**

- **Feature names**: Maintainers often name the specific feature
- **Technical explanations**: How the feature works
- **Clarifications**: Reporter or maintainers clarifying steps
- **Related issues/PRs**: Links to context
- **Reproduction confirmations**: Others confirming the bug

**Comment signals:**

- Comments from `MEMBER` or `CONTRIBUTOR` carry more weight
- "This is related to..." or "This happens because..." explains root cause

## 1.5 Parse template sections

Gutenberg bug template sections (identified by `### ` headings):

| Section                                           | Required | Content               |
| ------------------------------------------------- | -------- | --------------------- |
| `### Description`                                 | Yes      | What the bug is       |
| `### Step-by-step reproduction instructions`      | Yes      | Numbered steps        |
| `### Screenshots, screen recording, code snippet` | No       | Visual evidence       |
| `### Environment info`                            | Yes      | WP/Gutenberg versions |
| `### Please confirm...`                           | No       | Checkboxes, ignore    |

## 1.6 Extract environment details

From `### Environment info`:

- **WordPress version**: `WordPress 6.9`, `WP 6.8`, `6.7.1`
- **Gutenberg version**: `Gutenberg trunk`, `Gutenberg 20.0`, `built-in/core`
- **Theme type**: Block, Classic, or Hybrid

If missing, note as `unknown`.

## 1.7 Parse reproduction steps

From `### Step-by-step reproduction instructions`:

- Extract numbered steps (1., 2., 3.)
- Preserve exact wording
- Flag ambiguous steps

**Ambiguity indicators:**

- Vague actions: "click around", "navigate somewhere"
- Missing specifics: "click the button" (which button?)
- Assumes context: "in the editor" (which editor?)
- External dependencies: "install plugin X"

## 1.8 Identify expected vs actual

Extract from `### Description` or explicit sections:

- What should happen (expected)
- What actually happens (actual)

## 1.9 Check if triage is needed

Before proceeding with triage, check if maintainers have already confirmed and investigated the issue:

**Skip triage if ANY of these conditions are met:**

1. **Status indicates work in progress:**

   - Has `[Status] In Progress` label
   - Has `[Status] LGTM` label
   - Has linked PR (check for "linked a pull request" in timeline)

2. **Maintainers have confirmed the bug:**

   - Comments from MEMBER or OWNER confirming reproduction
   - Comments identifying specific code location (file paths, line numbers)
   - Comments with "reproduced", "confirmed", "I can reproduce"

3. **Technical details already provided:**
   - Code file/location mentioned in comments
   - Root cause identified
   - Fix approach discussed

**Set in parsed JSON:**

```json
{
  "needs_triage": false,
  "skip_reason": "maintainers_confirmed | in_progress | has_pr | code_identified"
}
```

If issue needs triage (none of above conditions met):

```json
{
  "needs_triage": true
}
```

## 1.10 Write parsed data

Write to `/tmp/triage/<issue>/<issue>.parsed.json`:

```json
{
  "issue": {
    "number": 74447,
    "title": "...",
    "state": "OPEN",
    "author": "username",
    "url": "https://github.com/..."
  },
  "labels": [
    { "name": "[Type] Bug", "description": "..." },
    { "name": "[Block] Navigation", "description": "..." }
  ],
  "affected": {
    "blocks": ["Navigation"],
    "features": ["Site Editor"]
  },
  "environment": {
    "wordpress": "latest",
    "gutenberg": "latest",
    "theme": "block",
    "plugins": ["gutenberg"]
  },
  "reproduction": {
    "steps": ["Step 1", "Step 2"],
    "expected": "What should happen",
    "actual": "What actually happens"
  },
  "context": {
    "related_issues": [12345],
    "comments_count": 5,
    "reproduction_confirmed": true,
    "feature_names": ["block visibility"]
  },
  "parseable": true,
  "ambiguities": ["Step 3 unclear: which button?"]
}
```

## 1.11 Output summary

```
ISSUE PARSED: #<number>
Title: <title>
State: <open/closed>

TRIAGE NEEDED: <Yes/No>
<If No: REASON: <skip_reason>>

LABELS:
- [Type] Bug: An existing feature does not function as intended
- [Feature] Site Editor: Related to the Site Editor
...

AFFECTED:
- Blocks: <list>
- Features: <list>

ENVIRONMENT:
- WordPress: <version>
- Gutenberg: <version>
- Theme: <type>

REPRODUCTION STEPS:
1. <step>
2. <step>
...

EXPECTED: <what should happen>
ACTUAL: <what happens instead>

AMBIGUITIES:
- <any unclear steps>

OUTPUT: /tmp/triage/<issue>/<issue>.parsed.json
```

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

The issue has been parsed and saved to /tmp/triage/<issue>/<issue>.parsed.json
```

## Fallback: Non-template issues

If issue doesn't follow template:

1. Attempt best-effort extraction
2. Look for keywords: "steps", "reproduce", "expected", "actual", "version"
3. Flag as `parseable: false` with notes on what's missing

## Error Cases

- **Not a bug**: Lacks `[Type] Bug` label → inform user, stop
- **Empty body**: No content → inform user, stop
- **No steps found**: Can't identify steps → flag, ask user for guidance

---

# Step 2: Build Blueprint

Generate a WordPress Playground blueprint from parsed issue data.

## 2.1 Load parsed issue data

Read `/tmp/triage/<issue>/<issue>.parsed.json` and extract:
- `environment.wordpress` - Target WP version
- `environment.gutenberg` - Target Gutenberg version
- `environment.theme` - Theme type (block/classic)
- `reproduction.steps` - To determine landing page

## 2.2 Start with default template

Use this base blueprint structure:

```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "landingPage": "/wp-admin/",
  "preferredVersions": {
    "php": "8.2",
    "wp": "latest"
  },
  "features": {
    "networking": true
  },
  "steps": [
    {
      "step": "login",
      "username": "admin",
      "password": "password"
    },
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "wordpress.org/plugins",
        "slug": "gutenberg"
      }
    }
  ]
}
```

## 2.3 Determine WordPress version

From `environment.wordpress`:

| Parsed Value | Blueprint `wp` Value |
|--------------|---------------------|
| `6.7`, `6.7.1`, `WordPress 6.7` | `"6.7"` |
| `trunk`, `nightly` | `"nightly"` |
| `latest`, `unknown`, empty | `"latest"` |

## 2.4 Determine Gutenberg version

From `environment.gutenberg`:

| Parsed Value | Action |
|--------------|--------|
| `built-in`, `core`, `none` | Omit the installPlugin step for Gutenberg |
| `trunk`, `nightly` | Use `"resource": "url"` with nightly build URL |
| `20.0`, `Gutenberg 20.0` | Use `"resource": "wordpress.org/plugins"` (latest from .org) |
| `latest`, `unknown`, empty | Use `"resource": "wordpress.org/plugins"` with slug `gutenberg` |

**Gutenberg nightly URL:**
```
https://playground.wordpress.net/gutenberg.zip
```

**Specific version URL pattern:**
```
https://downloads.wordpress.org/plugin/gutenberg.19.9.0.zip
```

## 2.5 Determine theme

From `environment.theme`:

| Parsed Value | Action |
|--------------|--------|
| `block`, `Twenty Twenty-Five`, unknown | No change (TT5 is default) |
| `classic`, `Twenty Twenty-One` | Add `installTheme` + `activateTheme` for classic theme |
| Specific theme name | Add steps for that theme |

**Classic theme example:**
```json
{
  "step": "installTheme",
  "themeData": {
    "resource": "wordpress.org/themes",
    "slug": "flavor"
  }
},
{
  "step": "activateTheme",
  "themeFolderName": "flavor"
}
```

## 2.6 Determine landing page

Analyze the first reproduction step to set `landingPage`:

| Step mentions | Landing Page |
|---------------|--------------|
| "site editor", "site-editor.php" | `/wp-admin/site-editor.php` |
| "create a new post", "add new post" | `/wp-admin/post-new.php` |
| "create a new page", "add new page" | `/wp-admin/post-new.php?post_type=page` |
| "edit a post", "open a post" | Create post first, then land on edit screen |
| "widgets", "widget editor" | `/wp-admin/widgets.php` |
| "patterns", "pattern" | `/wp-admin/site-editor.php?postType=wp_block` |
| "navigation", "menus" | `/wp-admin/site-editor.php?postType=wp_navigation` |
| "styles", "global styles" | `/wp-admin/site-editor.php?path=%2Fwp_global_styles` |
| "additional css" | `/wp-admin/site-editor.php?p=%2Fstyles&section=%2Fcss` |
| Default | `/wp-admin/` |

## 2.7 Add content if needed

If reproduction requires existing content:

**Create a test post:**
```json
{
  "step": "runPHP",
  "code": "<?php require '/wordpress/wp-load.php'; wp_insert_post(['post_title' => 'Test Post', 'post_content' => '<!-- wp:paragraph --><p>Test content</p><!-- /wp:paragraph -->', 'post_status' => 'publish']); ?>"
}
```

**Create a test page:**
```json
{
  "step": "runPHP",
  "code": "<?php require '/wordpress/wp-load.php'; wp_insert_post(['post_title' => 'Test Page', 'post_content' => '<!-- wp:paragraph --><p>Test content</p><!-- /wp:paragraph -->', 'post_status' => 'publish', 'post_type' => 'page']); ?>"
}
```

## 2.8 Write blueprint and report

1. Write final blueprint to `/tmp/triage/<issue>/<issue>.blueprint.json`
2. Output summary:

```
BLUEPRINT GENERATED: /tmp/triage/<issue>/<issue>.blueprint.json

CUSTOMIZATIONS APPLIED:
- WordPress version: <version> (reason)
- Gutenberg: <version/source> (reason)
- Theme: <theme> (reason)
- Landing page: <url> (reason)
- Additional steps: <list if any>

PLAYGROUND CLI COMMAND:
.claude/bin/playground.sh start --blueprint=/tmp/triage/<issue>/<issue>.blueprint.json
```

## Special Cases

### Gutenberg trunk/nightly

```json
{
  "step": "installPlugin",
  "pluginData": {
    "resource": "url",
    "url": "https://playground.wordpress.net/gutenberg.zip"
  }
}
```

### Specific Gutenberg version

```json
{
  "step": "installPlugin",
  "pluginData": {
    "resource": "url",
    "url": "https://downloads.wordpress.org/plugin/gutenberg.19.9.0.zip"
  }
}
```

### No Gutenberg (core only)

Remove the Gutenberg installPlugin step entirely.

## Error Handling

- **Cannot determine environment**: Use defaults, note in output
- **Conflicting requirements**: Flag for user decision
- **Unsupported requirement**: Note limitation (e.g., "requires multisite" - not supported in Playground)

---

# Step 3: Reproduce Bug

Execute reproduction steps using Playwright MCP to verify Gutenberg bug reports.

## 3.1 Setup

Create screenshots directory:

```bash
mkdir -p /tmp/triage/<issue>/screenshots
```

Start Playground with the blueprint:

```bash
.claude/bin/playground.sh start --blueprint=/tmp/triage/<issue>/<issue>.blueprint.json
```

Get Playground URL from running instance and initialize Playwright browser.

## 3.2 Execute reproduction steps

For each step in `reproduction.steps`, translate natural language into Playwright actions:

| Step Pattern | Playwright Action |
|--------------|-------------------|
| "Visit `/wp-admin/...`" | Navigate to `{playground_url}/wp-admin/...` |
| "Enter `...` in the ... input" | Find input, type text |
| "Click the Save button" | Find button, click |
| "Notice that ..." | Check for element presence/absence |

**Implementation flow:**
1. Use `mcp__playwright__browser_snapshot` to understand page structure
2. Identify target element by role/label
3. Perform action (navigate, type, click, etc.)
4. Take screenshot: `/tmp/triage/<issue>/screenshots/0X-<description>.png`

## 3.3 Collect evidence

Throughout reproduction, collect:

- **Console errors**: `mcp__playwright__browser_console_messages` with level="error"
- **Network requests**: `mcp__playwright__browser_network_requests` (focus on failed requests)
- **Screenshots**: After each major action and at final state
- **Page snapshots**: For understanding UI state

## 3.4 Determine reproduction result

Analyze collected evidence and classify:

| Result | Criteria |
|--------|----------|
| ✅ REPRODUCED | Observed behavior matches reported actual behavior |
| ❌ NOT REPRODUCED | Observed behavior matches expected behavior instead |
| ⚠️ INCONCLUSIVE | Could not complete steps, ambiguous results, or environment issues |

## 3.5 Write findings

Write to `/tmp/triage/<issue>/<issue>.findings.json`:

```json
{
  "result": "reproduced | not_reproduced | inconclusive",
  "environment": {
    "wordpress": "6.7",
    "gutenberg": "20.0",
    "php": "8.2"
  },
  "steps_executed": [
    { "step": 1, "description": "...", "success": true },
    { "step": 2, "description": "...", "success": false, "error": "..." }
  ],
  "evidence": {
    "console_errors": ["error message 1", "error message 2"],
    "network_errors": [{ "method": "POST", "url": "...", "status": 500 }],
    "screenshots": ["01-initial.png", "02-after-action.png"],
    "observations": "Description of what was observed"
  },
  "limitations": "Any constraints or issues encountered"
}
```

## 3.6 Report findings

Output structured results:

```
REPRODUCTION ATTEMPT COMPLETED
================================

Issue: #<issue>
Playground: <url>
Steps Attempted: <count> of <total>

RESULT: [REPRODUCED | NOT REPRODUCED | INCONCLUSIVE]

EVIDENCE:
---------

Console Errors:
  - <error messages>

Network Issues:
  - <failed requests with status codes>

Screenshots:
  📸 /tmp/triage/<issue>/screenshots/01-initial-page.png
  📸 /tmp/triage/<issue>/screenshots/02-after-action.png
  ...

Observed Behavior:
  <description of what actually happened>

Expected vs Actual:
  Expected: <reproduction.expected>
  Actual: <reproduction.actual>
  Observed: <what we saw>

CONCLUSION:
-----------
<detailed explanation of findings>
```

## 3.7 Cleanup

Stop the Playground instance:

```bash
.claude/bin/playground.sh stop
```

## Playwright MCP Tools Reference

### Navigation
- `mcp__playwright__browser_navigate` - Go to URL
- `mcp__playwright__browser_navigate_back` - Go back

### Page Analysis
- `mcp__playwright__browser_snapshot` - Get accessibility tree (preferred for automation)
- `mcp__playwright__browser_take_screenshot` - Capture visual evidence

### Interaction
- `mcp__playwright__browser_click` - Click element
- `mcp__playwright__browser_type` - Type text into input
- `mcp__playwright__browser_press_key` - Press keyboard keys
- `mcp__playwright__browser_fill_form` - Fill multiple fields at once

### Evidence Collection
- `mcp__playwright__browser_console_messages` - Get console logs/errors
- `mcp__playwright__browser_network_requests` - Get network activity

### Utilities
- `mcp__playwright__browser_wait_for` - Wait for text/time
- `mcp__playwright__browser_handle_dialog` - Dismiss popups

## WordPress-Specific Patterns

Common WordPress admin element patterns:

| Task | How to Find |
|------|-------------|
| Save button | `button[name="save"]`, `.editor-post-publish-button`, `button:has-text("Save")` |
| Settings input | Look for `label` text, then find associated `input` |
| Block inserter | `.block-editor-inserter__toggle`, `button[aria-label*="Add"]` |
| Site Editor navigation | `.edit-site-*` classes, navigation landmarks |

Use `mcp__playwright__browser_snapshot` to discover the actual structure.

## Special Cases

### Site Editor Issues
- Wait for Site Editor to fully load (look for `.edit-site-visual-editor`)
- Canvas may be in an iframe - Playwright handles this automatically
- Allow extra time for React to hydrate

### Block Editor Issues
- Wait for editor to load (`.block-editor`)
- Block controls appear on hover - use `mcp__playwright__browser_hover` first

## Error Handling

| Error | Action |
|-------|--------|
| Element not found | Screenshot current state, report as INCONCLUSIVE |
| Page timeout | Check network/console for errors, report as INCONCLUSIVE |
| Unexpected dialog | Use `mcp__playwright__browser_handle_dialog` to dismiss |
| Ambiguous step | Note in findings, suggest manual verification |

## Screenshot Naming Convention

```
/tmp/triage/<issue>/screenshots/
  01-initial-page.png
  02-navigated-to-styles.png
  03-entered-input.png
  04-clicked-save.png
  05-final-state.png
```

---

# Step 4: Report Findings

Summarize reproduction findings in a GitHub-comment-friendly format.

## 4.1 Load data files

Read the findings file:

```bash
cat /tmp/triage/<issue>/<issue>.findings.json
```

Optionally read parsed issue for context:

```bash
cat /tmp/triage/<issue>/<issue>.parsed.json
```

## 4.2 Extract key information

From `findings.json`:

- `result`: "reproduced" | "not_reproduced" | "inconclusive"
- `environment`: WordPress, Gutenberg, PHP versions tested
- `steps_executed`: Array of executed steps with success/failure status
- `evidence`: Console errors, screenshots, observations
- `limitations`: Any constraints or issues encountered

From `parsed.json` (if available):

- `issue.title`: Bug title for context
- `issue.url`: Link to original issue
- `reproduction.expected`: Expected behavior
- `reproduction.actual`: Reported actual behavior
- `labels`: Issue labels (e.g., `[Feature] Global Styles`, `[Block] Navigation`)

## 4.3 Format GitHub comment

Use this concise format for GitHub comments:

```markdown
## Triage Results

**Result:** ✅ Reproduced | ❌ Not Reproduced | ⚠️ Inconclusive
**Environment:** WP {version}, Gutenberg {version}, PHP {version}

{1-2 sentence summary of what was tested and the result}

<details>
<summary>Evidence</summary>

**Network:** `{method} {endpoint}` → {status}
**Console:** {key errors if any}
**Screenshots:** {count} captured

</details>

**Likely affected code:**
- `{file/path}` - {reason}
- `{file/path}` - {reason}

**Suggested fix:** {1-2 sentences on what needs to change}

---
<sub>Automated triage via WordPress Playground</sub>
```

## 4.4 Suspect Code Areas

When bug is reproduced, identify suspect code using:

1. **Label-based search**: Extract feature/block names from labels

   - `[Feature] Global Styles` → Search "Global Styles", "theme.json", "custom CSS"
   - `[Block] Navigation` → Search "Navigation block", "block navigation"

2. **Step-based search**: Analyze reproduction steps

   - "Save" actions → Search save functions, API endpoints
   - "Additional CSS" → Search CSS-related code
   - UI interactions → Search component files

3. **Error-based search**: Use error messages

   - Extract error text → Search codebase for error strings
   - HTTP status codes → Search API error handling

4. **File path patterns**: Based on Gutenberg structure
   - Site Editor: `packages/edit-site/src/**`
   - Blocks: `packages/block-library/src/**/<block-name>/**`
   - Components: `packages/components/src/**`
   - Core Data: `packages/core-data/src/**`

Format code references as:

- File paths relative to Gutenberg repo root
- Brief explanation of why the file is relevant

## Formatting Guidelines

### Keep it concise

- Total length: 15-25 lines maximum
- One summary sentence, not paragraphs
- Bullet points, not prose
- Only essential evidence in collapsible section

### Focus on action

- What's broken (1 sentence)
- Where to look (file paths)
- What to fix (brief suggestion)

### Skip if not helpful

- Don't include empty sections
- Skip console errors if unrelated
- Skip limitations unless critical
- No "Next Steps" or "Impact Assessment" sections

## 4.5 Output to console

Print the formatted markdown to console. Keep the output concise - aim for 50-100 lines maximum for GitHub comment readability.
