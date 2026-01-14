# Step 3: Reproduce Bug

Execute reproduction steps using Playwright MCP to verify Gutenberg bug reports.

## 3.1 Setup

### 3.1.1 Efficiency Rules (CRITICAL)

Browser actions are expensive (~1500 tokens each). **Target: 10-15 browser calls maximum**.

**Priority order:**
1. **JavaScript API first** - Insert/modify blocks via `window.wp.data.dispatch()`
2. **Role selectors second** - Use `role=button[name="..."]` patterns
3. **CSS selectors third** - Use documented patterns from wordpress-playwright-patterns.md
4. **Snapshot as last resort** - Only when element location fails after 2 attempts

**Read the patterns file first:**
```bash
cat .claude/workflows/triage/wordpress-playwright-patterns.md
```

### 3.1.2 Pre-Reproduction Planning

Before any browser interaction, create an action plan:

```
REPRODUCTION PLAN
=================
Issue: #<issue>

Batch 1 - Setup:
- Navigate to post editor
- Use JS API to insert blocks: window.wp.data.dispatch(...)

Batch 2 - Configure:
- Use page.evaluate() to configure block settings

Batch 3 - Verify:
- Use JS API to get content state
- Screenshot only if bug is visually evident

Estimated browser calls: <target 10-15>
```

### 3.1.3 Environment Setup

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

**Implementation flow (efficiency-first):**
1. **Read patterns file** - `cat .claude/workflows/triage/wordpress-playwright-patterns.md`
2. **Plan using APIs** - Identify which steps can use JavaScript APIs instead of UI clicks
3. **Execute via JS when possible** - Use `page.evaluate()` to batch multiple block operations
4. **Use role selectors** - For UI interactions, prefer `role=button[name="..."]` over snapshot exploration
5. **Verify via API when possible** - Use `getBlocks()` or `getEditedPostContent()` over screenshots
6. **Screenshot only when needed** - Only capture when the bug/error is visually evident

**API-first approach for common operations:**
- **Adding blocks**: Use `wp.data.dispatch('core/block-editor').insertBlock()` instead of block inserter UI
- **Setting content**: Use `wp.blocks.parse()` + `resetBlocks()` instead of typing
- **Checking state**: Use `wp.data.select('core/block-editor').getBlocks()` instead of screenshots
- **Selecting blocks**: Use `wp.data.dispatch('core/block-editor').selectBlock()` instead of clicking

## 3.3 Collect evidence

**Screenshot strategy:**

- **Primary rule**: Only screenshot when the bug/error is visible on screen
- **No initial state**: Skip screenshot after landing page loads (unless it shows the bug)
- **No intermediate actions**: Skip screenshots during navigation, clicking, typing (unless showing bug progression)
- **Multi-state bugs**: If bug requires showing multiple states to illustrate the problem:
  - Take screenshot of each critical state that shows the bug
  - Example: "State 1: Before clicking shows X, State 2: After clicking shows Y"
- **Error screenshots**: Only if error is related to the reported bug
- **If bug not reproduced**: No screenshots needed

**Decision logic:**
1. Execute reproduction steps without taking screenshots
2. When bug is observed, take screenshot(s) of the bug
3. If bug has multiple states, determine if all states are needed to illustrate the problem
4. Only take multiple screenshots if each state adds unique evidence

**Evidence collection strategy:**

- **Console errors**:
  - Collect only errors (level="error", skip warnings/info)
  - Limit to top 5 most relevant errors
  - Filter by keywords from issue description if available
  - Only collect errors that occur during reproduction steps

- **Network requests**:
  - Only collect failed requests (status >= 400)
  - Limit to top 5 failed requests
  - Prioritize API endpoints related to bug (e.g., save endpoints for save bugs)
  - Skip successful requests unless specifically relevant

- **Page snapshots**:
  - Only collect if needed for analysis (not after every action)
  - Use for understanding UI state when bug occurs

**Conditional evidence collection:**

1. **During reproduction**: Execute steps without taking screenshots
2. **When bug is observed**: Take screenshot(s) showing the bug
3. **After determining result**:
   - If **reproduced**: Collect evidence (console errors, network failures, bug screenshot(s))
   - If **not_reproduced**: Skip all screenshots and detailed evidence
   - If **inconclusive**: Only collect evidence explaining why (errors, timeouts) - screenshot only if error is visible

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
    "screenshots": ["01-bug-evidence.png"],
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
  📸 /tmp/triage/<issue>/screenshots/01-bug-evidence.png
  (Only if bug reproduced - shows the bug/error)

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

Use `mcp__playwright__browser_snapshot` only as fallback when element cannot be located via targeted query (CSS selector, role, or text).

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
| Element not found | Use `mcp__playwright__browser_snapshot` to locate, screenshot only if error is the bug itself, report as INCONCLUSIVE |
| Page timeout | Check network/console for errors, screenshot only if timeout is the bug, report as INCONCLUSIVE |
| Unexpected dialog | Use `mcp__playwright__browser_handle_dialog` to dismiss |
| Ambiguous step | Note in findings, suggest manual verification |

## Screenshot Naming Convention

```
/tmp/triage/<issue>/screenshots/
  01-bug-evidence.png          - Single screenshot showing the bug (most common case)
  01-bug-state-1.png           - First state showing the bug (if multi-state)
  02-bug-state-2.png           - Second state showing the bug (if multi-state)
  01-error-state.png           - Error state (only if error is the bug itself)
```

**Note**: Screenshots are only taken when the bug/error is visible. No intermediate navigation or action screenshots.
