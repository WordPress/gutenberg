# Step 3: Reproduce Bug

Execute reproduction steps using Chrome DevTools MCP to verify Gutenberg bug reports.

## ⚠️ COST OPTIMIZATION RULES (CRITICAL)

**Each snapshot costs ~3K tokens. Minimize them aggressively.**

| Rule | Why |
|------|-----|
| **Maximum 5 snapshots** | 20 snapshots = $1+ in token costs |
| **Use `wait_for` over snapshot** | Check page state without 3K token cost |
| **Use `evaluate_script` for simple clicks** | Direct JS is ~100 tokens vs 3K for snapshot+click |
| **Batch actions between snapshots** | Do 3-5 actions per snapshot, not 1 |

### Token-Efficient Patterns

```javascript
// ❌ EXPENSIVE: Snapshot for every click (3K tokens each)
take_snapshot()  // 3K tokens
click(uid)
take_snapshot()  // 3K tokens
click(uid)
// Total: 6K+ tokens

// ✅ CHEAP: Direct JavaScript (~100 tokens each)
evaluate_script({ function: "document.querySelector('.save-btn').click()" })
wait_for({ text: "Saved" })
// Total: ~200 tokens
```

### When to Use Each Approach

| Scenario | Use This |
|----------|----------|
| Check if page loaded | `wait_for({ text: "Expected text" })` |
| Click a button with known selector | `evaluate_script` with querySelector |
| Fill a form field | `fill` with uid from ONE snapshot |
| Complex UI with unknown structure | `take_snapshot` (but only once!) |
| Verify bug is visible | `take_snapshot` + `take_screenshot` |

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

**Implementation flow (COST-OPTIMIZED):**

1. **Navigate to page** → Use `navigate_page`, then `wait_for` to confirm load (NOT snapshot)
2. **First snapshot** → Take ONE snapshot to understand page structure
3. **Batch multiple actions** → Use uids from that snapshot for 3-5 actions
4. **Use evaluate_script for known patterns** → WordPress has predictable selectors:
   - Save button: `document.querySelector('.editor-post-publish-button, .components-button.is-primary')`
   - Block inserter: `document.querySelector('.block-editor-inserter__toggle')`
   - Settings: `document.querySelector('[aria-label="Settings"]')`
5. **Second snapshot** → Only if you need to find NEW elements not in first snapshot
6. **Final snapshot + screenshot** → Only when bug is visible for evidence

**Snapshot budget: 5 maximum**
- Snapshot 1: Initial page structure
- Snapshot 2-3: Only if navigating to completely different pages
- Snapshot 4-5: Bug evidence (if reproduced)

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

### Direct JavaScript Selectors (USE THESE - No Snapshot Needed!)

```javascript
// Block Editor - Common Actions
evaluate_script({ function: `
  // Publish/Update button
  document.querySelector('.editor-post-publish-button')?.click()
`})

evaluate_script({ function: `
  // Save draft
  document.querySelector('.editor-post-save-draft')?.click()
`})

evaluate_script({ function: `
  // Open block inserter
  document.querySelector('.block-editor-inserter__toggle')?.click()
`})

evaluate_script({ function: `
  // Open settings sidebar
  document.querySelector('[aria-label="Settings"]')?.click()
`})

evaluate_script({ function: `
  // Select a block by clicking it
  document.querySelector('.wp-block-paragraph')?.click()
`})

// Site Editor - Common Actions
evaluate_script({ function: `
  // Save in Site Editor
  document.querySelector('.edit-site-save-button__button')?.click()
`})

// Admin Pages
evaluate_script({ function: `
  // Submit form
  document.querySelector('#submit, input[type="submit"]')?.click()
`})
```

### When You DO Need a Snapshot

| Situation | Why Snapshot is Needed |
|-----------|----------------------|
| Complex dynamic UI | Element IDs/classes are generated |
| Need to read text content | Must inspect accessibility tree |
| Unknown page structure | First time seeing this page |
| Bug evidence | Need to capture exact UI state |

### Fallback: Snapshot-Based Element Finding

If evaluate_script doesn't work, THEN use snapshot:

| Task | How to Find in Snapshot |
|------|------------------------|
| Save button | Look for `button` with "Save" text |
| Settings input | Find `textbox` by label |
| Block inserter | Look for button with "Add" in name |
| Site Editor navigation | Look for navigation landmarks |

## Gutenberg E2E Patterns (From Official Test Suite)

These patterns are extracted from Gutenberg's official Playwright e2e tests and translated to Chrome DevTools MCP. Using these proven patterns reduces blind investigation.

### Wait Conditions (Critical for Stability)

```javascript
// Wait for WordPress data store to be ready (ALWAYS do this first)
evaluate_script({ function: `
  return new Promise((resolve) => {
    const check = () => {
      if (window?.wp?.blocks && window?.wp?.data) {
        resolve(true);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
`})

// Site Editor: Wait for canvas loader to disappear
// The canvas loader MUST be hidden before interacting with editor
evaluate_script({ function: `
  return new Promise((resolve) => {
    const loader = document.querySelector('.edit-site-canvas-loader, .edit-site-canvas-spinner');
    if (!loader || loader.offsetParent === null) {
      resolve(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (loader.offsetParent === null) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(loader, { attributes: true, attributeFilter: ['style', 'class'] });
    setTimeout(() => { observer.disconnect(); resolve(false); }, 30000);
  });
`})
```

### Editor Canvas Access (Iframe Handling)

The block editor content lives inside an iframe named `editor-canvas`. Chrome DevTools MCP handles iframes automatically, but for direct JS you need to target the iframe:

```javascript
// Access content inside editor canvas iframe
evaluate_script({ function: `
  const iframe = document.querySelector('[name="editor-canvas"]');
  if (iframe?.contentDocument) {
    // Example: Get all blocks in the editor
    return Array.from(iframe.contentDocument.querySelectorAll('[data-block]'))
      .map(el => el.getAttribute('data-block'));
  }
  return [];
`})

// Click a block inside the canvas
evaluate_script({ function: `
  const iframe = document.querySelector('[name="editor-canvas"]');
  if (iframe?.contentDocument) {
    const block = iframe.contentDocument.querySelector('.wp-block-paragraph');
    block?.click();
    return true;
  }
  return false;
`})
```

### Block Operations via wp.data (Most Reliable)

```javascript
// Insert a block programmatically (NO UI interaction needed!)
evaluate_script({ function: `
  const block = wp.blocks.createBlock('core/paragraph', { content: 'Test content' });
  wp.data.dispatch('core/block-editor').insertBlock(block);
  return true;
`})

// Insert block with nested blocks
evaluate_script({ function: `
  const innerBlock = wp.blocks.createBlock('core/paragraph', { content: 'Inner' });
  const groupBlock = wp.blocks.createBlock('core/group', {}, [innerBlock]);
  wp.data.dispatch('core/block-editor').insertBlock(groupBlock);
  return true;
`})

// Select a block by clientId
evaluate_script({ function: `
  const blocks = wp.data.select('core/block-editor').getBlocks();
  if (blocks.length > 0) {
    wp.data.dispatch('core/block-editor').selectBlock(blocks[0].clientId);
    return true;
  }
  return false;
`})

// Get all blocks in editor (for verification)
evaluate_script({ function: `
  return wp.data.select('core/block-editor').getBlocks();
`})

// Get edited post content (serialized HTML)
evaluate_script({ function: `
  return wp.data.select('core/editor').getEditedPostContent();
`})
```

### Common UI Regions (Role-Based Selectors)

```javascript
// Editor Top Bar - contains Save, Publish, Undo, Redo
evaluate_script({ function: `
  const topBar = document.querySelector('[aria-label="Editor top bar"]');
  return topBar ? true : false;
`})

// Editor Settings Sidebar
evaluate_script({ function: `
  const settings = document.querySelector('[aria-label="Editor settings"]');
  return settings ? true : false;
`})

// Block Library (Inserter panel)
evaluate_script({ function: `
  const library = document.querySelector('[aria-label="Block Library"]');
  return library ? true : false;
`})

// Block Toolbar (appears when block is selected)
evaluate_script({ function: `
  const toolbar = document.querySelector('[aria-label="Block tools"]');
  return toolbar ? true : false;
`})
```

### Publish/Save Patterns (Exact Gutenberg Flow)

```javascript
// Full publish flow (handles multi-entity saves)
evaluate_script({ function: `
  async function publish() {
    // Step 1: Click Save or Publish in top bar
    const topBar = document.querySelector('[aria-label="Editor top bar"]');
    const saveBtn = topBar?.querySelector('button[aria-label="Save"]');
    const publishBtn = topBar?.querySelector('.editor-post-publish-button');
    const btn = saveBtn?.offsetParent ? saveBtn : publishBtn;
    btn?.click();

    await new Promise(r => setTimeout(r, 500));

    // Step 2: If entities panel appears, click Save there too
    const publishRegion = document.querySelector('[aria-label="Editor publish"]');
    const entitiesSave = publishRegion?.querySelector('button[aria-label="Save"]');
    if (entitiesSave?.offsetParent) {
      entitiesSave.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // Step 3: Click final Publish button
    const finalPublish = publishRegion?.querySelector('.editor-post-publish-button');
    finalPublish?.click();

    return true;
  }
  return publish();
`})

// Save draft
evaluate_script({ function: `
  const topBar = document.querySelector('[aria-label="Editor top bar"]');
  const saveDraft = topBar?.querySelector('button[aria-label="Save draft"]');
  saveDraft?.click();
  return true;
`})

// Then wait for success notice
wait_for({ text: "published" })  // or "Draft saved" for drafts
```

### Settings & Preferences (Disable Welcome Guides)

```javascript
// Disable all welcome guides (run after page load)
evaluate_script({ function: `
  async function disableWelcomeGuides() {
    await wp.data.dispatch('core/preferences').set('core/edit-post', 'welcomeGuide', false);
    await wp.data.dispatch('core/preferences').set('core/edit-post', 'fullscreenMode', false);
    await wp.data.dispatch('core/preferences').set('core/edit-site', 'welcomeGuide', false);
    await wp.data.dispatch('core/preferences').set('core/edit-site', 'welcomeGuideStyles', false);
    await wp.data.dispatch('core/preferences').set('core/edit-site', 'welcomeGuidePage', false);
    await wp.data.dispatch('core/preferences').set('core/edit-site', 'welcomeGuideTemplate', false);
    return true;
  }
  return disableWelcomeGuides();
`})
```

### Block Toolbar Interactions

```javascript
// Show block toolbar (required before clicking toolbar buttons)
// The toolbar hides while typing - mouse movement reveals it
evaluate_script({ function: `
  // Simulate mouse movement to show toolbar
  const event1 = new MouseEvent('mousemove', { clientX: 50, clientY: 50 });
  const event2 = new MouseEvent('mousemove', { clientX: 75, clientY: 75 });
  const event3 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
  document.dispatchEvent(event1);
  document.dispatchEvent(event2);
  document.dispatchEvent(event3);
  return true;
`})

// Click block toolbar button by label
evaluate_script({ function: `
  const toolbar = document.querySelector('[aria-label="Block tools"]');
  const button = toolbar?.querySelector('button[aria-label="Add caption"]');
  button?.click();
  return button ? true : false;
`})
```

### Common Block Selectors

```javascript
// Find blocks by type in canvas
evaluate_script({ function: `
  const iframe = document.querySelector('[name="editor-canvas"]');
  const doc = iframe?.contentDocument || document;
  return {
    paragraphs: doc.querySelectorAll('.wp-block-paragraph').length,
    images: doc.querySelectorAll('.wp-block-image').length,
    headings: doc.querySelectorAll('[class*="wp-block-heading"]').length,
    buttons: doc.querySelectorAll('.wp-block-buttons').length
  };
`})

// Select specific block in canvas (using role selector pattern)
evaluate_script({ function: `
  const iframe = document.querySelector('[name="editor-canvas"]');
  const doc = iframe?.contentDocument || document;
  // Gutenberg uses aria-label="Block: Image" pattern
  const imageBlock = doc.querySelector('[aria-label*="Block: Image" i]');
  imageBlock?.click();
  return imageBlock ? true : false;
`})
```

### Site Editor Navigation

```javascript
// Check if we're in Site Editor
evaluate_script({ function: `
  return window.location.href.includes('site-editor.php');
`})

// Navigate to specific template
evaluate_script({ function: `
  const query = new URLSearchParams();
  query.set('postType', 'wp_template');
  query.set('canvas', 'edit');
  window.location.href = '/wp-admin/site-editor.php?' + query.toString();
  return true;
`})

// Save in Site Editor (handles multiple entities)
evaluate_script({ function: `
  async function saveSiteEditor() {
    const topBar = document.querySelector('[aria-label="Editor top bar"]');
    const saveBtn = topBar?.querySelector('button[aria-label="Save"]');
    const publishBtn = topBar?.querySelector('button[aria-label="Publish"]');

    const btn = saveBtn?.offsetParent ? saveBtn : publishBtn;
    btn?.click();

    await new Promise(r => setTimeout(r, 500));

    // Handle save panel if it appears
    const savePanel = document.querySelector('[aria-label="Save panel"]');
    const panelSave = savePanel?.querySelector('button[aria-label="Save"]');
    if (panelSave?.offsetParent) {
      panelSave.click();
    }

    return true;
  }
  return saveSiteEditor();
`})
```

### Notice Detection (Success/Error Verification)

```javascript
// Check for success notice
evaluate_script({ function: `
  const notices = document.querySelectorAll('.components-snackbar, .components-notice');
  for (const notice of notices) {
    if (notice.textContent.includes('published') ||
        notice.textContent.includes('updated') ||
        notice.textContent.includes('saved')) {
      return { success: true, text: notice.textContent };
    }
  }
  return { success: false };
`})

// Check for error notice
evaluate_script({ function: `
  const notices = document.querySelectorAll('.components-notice.is-error, .components-snackbar.is-error');
  return Array.from(notices).map(n => n.textContent);
`})
```

### Pattern: Full Page Load Sequence

Use this sequence when navigating to any Gutenberg editor page:

```javascript
// 1. Navigate
navigate_page({ url: "..." })

// 2. Wait for WordPress to be ready
evaluate_script({ function: `
  return new Promise((resolve) => {
    const check = () => {
      if (window?.wp?.data) resolve(true);
      else setTimeout(check, 100);
    };
    check();
  });
`})

// 3. Disable welcome guides
evaluate_script({ function: `
  wp.data.dispatch('core/preferences').set('core/edit-post', 'welcomeGuide', false);
  return true;
`})

// 4. For Site Editor: Wait for canvas loader
evaluate_script({ function: `
  const loader = document.querySelector('.edit-site-canvas-loader');
  if (!loader) return true;
  return new Promise((resolve) => {
    const check = () => {
      if (loader.offsetParent === null) resolve(true);
      else setTimeout(check, 100);
    };
    check();
  });
`})

// 5. NOW take a snapshot if needed (saves 3K tokens by waiting until ready)
take_snapshot()
```

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
