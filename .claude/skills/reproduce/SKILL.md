# /reproduce

Execute reproduction steps using Playwright MCP to verify Gutenberg bug reports.

## Usage

This skill can be used in two ways:

1. **As part of triage pipeline:** Automatically called after blueprint generation
2. **Standalone:** Manually invoked to re-run reproduction with existing data

**Standalone usage examples:**
```
User: "Use the reproduce skill for issue 74447"
User: "Reproduce issue 72364 with existing blueprint"
User: "Re-run reproduction for 73872 to verify the bug"
```

## Arguments

- `issue` (required): Issue number

## Input

**Required files:**
- `/tmp/triage/<issue>/<issue>.parsed.json` - Parsed reproduction data (for steps)
- `/tmp/triage/<issue>/<issue>.blueprint.json` - Playground blueprint

**Required services:**
- Playwright MCP server connected
- WordPress Playground CLI available

**If files don't exist:**
- Inform user about missing prerequisites
- Suggest running parse-issue and build-blueprint skills first

## Output

Writes to `/tmp/triage/<issue>/<issue>.findings.json`

Screenshots saved to `/tmp/triage/<issue>/screenshots/`

**Findings include:**
- Reproduction result (reproduced/not_reproduced/inconclusive)
- Environment details
- Steps executed with success/failure status
- Evidence (console errors, network requests, screenshots)
- Observed vs expected behavior
- Conclusion and recommendations

---

## Process

### 1. Setup

Create screenshots directory:

```bash
mkdir -p /tmp/triage/<issue>/screenshots
```

Start Playground with the blueprint:

```bash
.claude/bin/playground.sh start --blueprint=/tmp/triage/<issue>/<issue>.blueprint.json
```

Get Playground URL from running instance and initialize Playwright browser.

### 2. Execute reproduction steps

For each step in `reproduction.steps`, translate natural language into Playwright actions:

| Step Pattern | Playwright Action |
|--------------|-------------------|
| "Visit `/wp-admin/...`" | Navigate to `{playground_url}/wp-admin/...` |
| "Enter `...` in the ... input" | Find input, type text |
| "Click the Save button" | Find button, click |
| "Notice that ..." | Check for element presence/absence |

**Implementation flow:**
1. Use `mcp_playwright_browser_snapshot` to understand page structure
2. Identify target element by role/label
3. Perform action (navigate, type, click, etc.)
4. Take screenshot: `/tmp/triage/<issue>/screenshots/0X-<description>.png`

### 3. Collect evidence

Throughout reproduction, collect:

- **Console errors**: `mcp_playwright_browser_console_messages` with level="error"
- **Network requests**: `mcp_playwright_browser_network_requests` (focus on failed requests)
- **Screenshots**: After each major action and at final state
- **Page snapshots**: For understanding UI state

### 4. Determine reproduction result

Analyze collected evidence and classify:

| Result | Criteria |
|--------|----------|
| ✅ REPRODUCED | Observed behavior matches reported actual behavior |
| ❌ NOT REPRODUCED | Observed behavior matches expected behavior instead |
| ⚠️ INCONCLUSIVE | Could not complete steps, ambiguous results, or environment issues |

### 5. Report findings

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

### 6. Cleanup

Stop the Playground instance:

```bash
.claude/bin/playground.sh stop
```

---

## Playwright MCP Tools Reference

### Navigation
- `mcp_playwright_browser_navigate` - Go to URL
- `mcp_playwright_browser_navigate_back` - Go back

### Page Analysis
- `mcp_playwright_browser_snapshot` - Get accessibility tree (preferred for automation)
- `mcp_playwright_browser_take_screenshot` - Capture visual evidence

### Interaction
- `mcp_playwright_browser_click` - Click element
- `mcp_playwright_browser_type` - Type text into input
- `mcp_playwright_browser_press_key` - Press keyboard keys
- `mcp_playwright_browser_fill_form` - Fill multiple fields at once

### Evidence Collection
- `mcp_playwright_browser_console_messages` - Get console logs/errors
- `mcp_playwright_browser_network_requests` - Get network activity

### Utilities
- `mcp_playwright_browser_wait_for` - Wait for text/time
- `mcp_playwright_browser_handle_dialog` - Dismiss popups

---

## WordPress-Specific Patterns

Common WordPress admin element patterns:

| Task | How to Find |
|------|-------------|
| Save button | `button[name="save"]`, `.editor-post-publish-button`, `button:has-text("Save")` |
| Settings input | Look for `label` text, then find associated `input` |
| Block inserter | `.block-editor-inserter__toggle`, `button[aria-label*="Add"]` |
| Site Editor navigation | `.edit-site-*` classes, navigation landmarks |

Use `mcp_playwright_browser_snapshot` to discover the actual structure.

---

## Special Cases

### Site Editor Issues
- Wait for Site Editor to fully load (look for `.edit-site-visual-editor`)
- Canvas may be in an iframe - Playwright handles this automatically
- Allow extra time for React to hydrate

### Block Editor Issues
- Wait for editor to load (`.block-editor`)
- Block controls appear on hover - use `mcp_playwright_browser_hover` first

---

## Error Handling

| Error | Action |
|-------|--------|
| Element not found | Screenshot current state, report as INCONCLUSIVE |
| Page timeout | Check network/console for errors, report as INCONCLUSIVE |
| Unexpected dialog | Use `mcp_playwright_browser_handle_dialog` to dismiss |
| Ambiguous step | Note in findings, suggest manual verification |

---

## Screenshot Naming Convention

```
/tmp/triage/<issue>/screenshots/
  01-initial-page.png
  02-navigated-to-styles.png
  03-entered-input.png
  04-clicked-save.png
  05-final-state.png
```
