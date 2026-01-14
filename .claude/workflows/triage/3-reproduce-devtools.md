# Step 3: Reproduce Bug

Execute reproduction steps using Chrome DevTools MCP to verify Gutenberg bug reports.

## 3.1 Setup

Create screenshots directory:

```bash
mkdir -p /tmp/triage/<issue>/screenshots
```

Start Playground with the blueprint:

```bash
.claude/bin/playground.sh start --blueprint=/tmp/triage/<issue>/<issue>.blueprint.json
```

Get Playground URL from running instance and open in Chrome DevTools:

```
mcp__chrome-devtools__new_page with url: <playground_url>
```

## 3.2 Execute reproduction steps

For each step in `reproduction.steps`, translate natural language into DevTools actions:

| Step Pattern | DevTools Action |
|--------------|-----------------|
| "Visit `/wp-admin/...`" | `navigate_page` with url |
| "Enter `...` in the ... input" | `fill` with uid and value |
| "Click the Save button" | `click` with uid |
| "Notice that ..." | Check for element presence in snapshot |

**Implementation flow:**
1. Use `take_snapshot` to understand page structure (returns uid-based tree)
2. Identify target element by uid from snapshot
3. Perform action (navigate, fill, click, etc.)
4. Don't snapshot after action unless needed for verification
5. Only screenshot when bug/error is visible (see screenshot strategy below)

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
  - Use `list_console_messages` (paginated - much more efficient)
  - Collect only errors (level="error", skip warnings/info)
  - Limit to top 5 most relevant errors
  - Filter by keywords from issue description if available
  - Only collect errors that occur during reproduction steps

- **Network requests**:
  - Use `list_network_requests` (focus on failed requests)
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

Close the browser page:

```
mcp__chrome-devtools__close_page
```

Stop the Playground instance:

```bash
.claude/bin/playground.sh stop
```

## Chrome DevTools MCP Tools Reference

### Navigation
- `new_page` - Open URL in new page
- `navigate_page` - Navigate current page (url, back, forward, reload)

### Page Analysis
- `take_snapshot` - Get accessibility tree with uid identifiers (compact format)
- `take_screenshot` - Capture visual evidence

### Interaction
- `click` - Click element by uid
- `fill` - Type text into input by uid
- `fill_form` - Fill multiple fields at once
- `press_key` - Press keyboard keys
- `hover` - Hover over element

### Evidence Collection
- `list_console_messages` - Get paginated console logs (efficient!)
- `list_network_requests` - Get paginated network activity

### Utilities
- `wait_for` - Wait for text to appear
- `handle_dialog` - Accept/dismiss popups
- `close_page` - Close browser page

## WordPress-Specific Patterns

Common WordPress admin element patterns:

| Task | How to Find |
|------|-------------|
| Save button | Look for `button` with "Save" text in snapshot |
| Settings input | Find `textbox` or `input` by label in snapshot |
| Block inserter | Look for button with "Add" in name/description |
| Site Editor navigation | Look for navigation landmarks in snapshot |

Use `take_snapshot` to discover the actual structure - returns compact uid-based tree.

## Special Cases

### Site Editor Issues
- Wait for Site Editor to fully load (look for editor elements in snapshot)
- Canvas may be in an iframe - DevTools handles this automatically
- Allow extra time for React to hydrate

### Block Editor Issues
- Wait for editor to load (look for block-editor elements)
- Block controls appear on hover - use `hover` first

## Error Handling

| Error | Action |
|-------|--------|
| Element not found | Screenshot current state, report as INCONCLUSIVE |
| Page timeout | Check network/console for errors, report as INCONCLUSIVE |
| Unexpected dialog | Use `handle_dialog` to dismiss |
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
