---
name: wordpress-playwright-patterns
description: Efficient patterns and best practices for testing WordPress/Gutenberg with Playwright. Use JavaScript APIs for setup operations to minimize browser interactions, while preserving actual UI interactions for bug reproduction.
---

# WordPress Playwright Patterns

Efficient patterns for Gutenberg testing extracted from `packages/e2e-test-utils-playwright/src/editor/`.

**Goal**: Minimize browser interactions by using JavaScript APIs for **setup and non-critical operations**, while preserving actual UI interactions for the **critical bug reproduction path**.

**Important**: Always use actual UI clicks/interactions for the specific actions that trigger the bug. JavaScript APIs should only be used for setup operations (inserting blocks, configuring initial state) that are not part of the bug reproduction itself.

## Block Manipulation via JavaScript API

### Insert a block (NO UI CLICKS NEEDED)

```javascript
await page.waitForFunction(() => window?.wp?.blocks && window?.wp?.data);

await page.evaluate(() => {
  const block = window.wp.blocks.createBlock('core/paragraph', {
    content: 'Hello world'
  });
  window.wp.data.dispatch('core/block-editor').insertBlock(block);
});
```

### Insert block with inner blocks

```javascript
await page.evaluate(() => {
  function createBlockRecursively({ name, attributes = {}, innerBlocks = [] }) {
    return window.wp.blocks.createBlock(
      name,
      attributes,
      innerBlocks.map(inner => createBlockRecursively(inner))
    );
  }

  const block = createBlockRecursively({
    name: 'core/columns',
    innerBlocks: [
      { name: 'core/column', innerBlocks: [{ name: 'core/paragraph' }] },
      { name: 'core/column', innerBlocks: [{ name: 'core/paragraph' }] }
    ]
  });

  window.wp.data.dispatch('core/block-editor').insertBlock(block);
});
```

### Set entire page content from HTML

```javascript
await page.waitForFunction(() => window?.wp?.blocks && window?.wp?.data);

const html = `<!-- wp:paragraph --><p>Content</p><!-- /wp:paragraph -->`;
await page.evaluate((htmlContent) => {
  const blocks = window.wp.blocks.parse(htmlContent);
  window.wp.data.dispatch('core/block-editor').resetBlocks(blocks);
}, html);
```

### Select a block by client ID

```javascript
await page.evaluate((clientId) => {
  window.wp.data.dispatch('core/block-editor').selectBlock(clientId);
}, clientId);
```

### Multi-select blocks

```javascript
await page.evaluate(([startId, endId]) => {
  window.wp.data.dispatch('core/block-editor').multiSelect(startId, endId);
}, [startClientId, endClientId]);
```

### Transform block to another type

```javascript
await page.evaluate((newBlockName) => {
  const clientIds = window.wp.data.select('core/block-editor').getSelectedBlockClientIds();
  const blocks = window.wp.data.select('core/block-editor').getBlocksByClientId(clientIds);
  window.wp.data.dispatch('core/block-editor').replaceBlocks(
    clientIds,
    window.wp.blocks.switchToBlockType(blocks, newBlockName)
  );
}, 'core/heading');
```

## Reading Editor State (instead of screenshots)

### Get current block state

```javascript
const blocks = await page.evaluate(() => {
  return window.wp.data.select('core/block-editor').getBlocks();
});
```

### Get serialized post content

```javascript
const content = await page.evaluate(() => {
  return window.wp.data.select('core/editor').getEditedPostContent();
});
```

### Check if editor has changes

```javascript
const hasChanges = await page.evaluate(() => {
  return window.wp.data.select('core/editor').hasChangedContent();
});
```

### Get selected block info

```javascript
const selectedBlock = await page.evaluate(() => {
  const clientId = window.wp.data.select('core/block-editor').getSelectedBlockClientId();
  return window.wp.data.select('core/block-editor').getBlock(clientId);
});
```

## Reliable Selectors

### Canvas iframe access

The editor canvas is in an iframe. Always access it properly:

```javascript
const canvas = page.locator('iframe[name="editor-canvas"]').contentFrame();
await canvas.locator('[data-type="core/paragraph"]').click();
```

### Role-based selectors (preferred)

These are more reliable than CSS selectors:

| Element | Selector |
|---------|----------|
| Block inserter | `role=button[name="Block Inserter"i]` |
| Settings tab | `role=tab[name="Settings"i]` |
| Block toolbar | `role=toolbar[name="Block tools"i]` |
| Publish button | `role=button[name="Publish"i]` |
| Save button | `role=button[name="Save"i]` |
| Editor top bar | `role=region[name="Editor top bar"i]` |
| Editor publish region | `role=region[name="Editor publish"i]` |

### Input controls

| Control | Selector |
|---------|----------|
| Spinbutton | `role=spinbutton[name="Columns"i]` |
| Checkbox | `role=checkbox[name="Header section"i]` |
| Textbox | `role=textbox[name="Body cell text"i]` |
| Combobox | `role=combobox[name="Font size"i]` |

### Block-specific selectors

```javascript
// Block in canvas by type
canvas.locator('[data-type="core/paragraph"]')

// Block by data-block attribute (client ID)
canvas.locator('[data-block="abc123"]')

// Selected block
canvas.locator('.is-selected[data-type="core/paragraph"]')
```

## Setting Preferences

### Disable welcome guide and fullscreen mode

```javascript
await page.evaluate(() => {
  window.wp.data.dispatch('core/preferences').set('core/edit-post', 'welcomeGuide', false);
  window.wp.data.dispatch('core/preferences').set('core/edit-post', 'fullscreenMode', false);
});
```

### Enable top toolbar (fixed toolbar)

```javascript
await page.evaluate(() => {
  window.wp.data.dispatch('core/preferences').set('core/edit-post', 'fixedToolbar', true);
});
```

## Common Operations

### Wait for editor to be ready

```javascript
await page.waitForFunction(() => {
  return window?.wp?.data?.select('core/block-editor')?.getBlocks !== undefined;
});
```

### Navigate to post editor

```javascript
await page.goto('/wp-admin/post-new.php');
await page.waitForFunction(() => window?.wp?.data);
```

### Navigate to site editor

```javascript
await page.goto('/wp-admin/site-editor.php');
await page.waitForSelector('iframe[name="editor-canvas"]');
```

### Publish post

```javascript
// Click publish in top bar
await page.getByRole('region', { name: 'Editor top bar' })
  .getByRole('button', { name: 'Publish', exact: true }).click();

// Confirm in publish panel
await page.getByRole('region', { name: 'Editor publish' })
  .getByRole('button', { name: 'Publish', exact: true }).click();

// Wait for success notice
await page.getByRole('button', { name: 'Dismiss this notice' })
  .filter({ hasText: 'published' }).waitFor();
```

## Efficiency Checklist

Before writing reproduction steps, ask:

1. **Setup vs Reproduction**: Is this operation part of setting up the test scenario, or is it the actual bug trigger?
   - **Setup**: Use JS APIs (`insertBlock()`, `setContent()`) - Saves 5-20 clicks
   - **Bug trigger**: Use actual UI interactions - Preserves real user behavior

2. **Can I use `setContent()` with HTML for initial page state?** - Saves 10-20 setup clicks
   - Only if the bug isn't about the insertion/creation process itself

3. **Can I verify state via `getBlocks()` instead of screenshot?** - Saves snapshot tokens
   - Use for verification, not for capturing visual bugs

4. **Am I using role selectors instead of exploring snapshots?** - Eliminates exploration
   - Use for both setup and reproduction steps

5. **Can I batch setup operations in a single `page.evaluate()`?** - Reduces round trips
   - Only for non-critical setup operations

**Critical Rule**: If the bug report mentions clicking, typing, or interacting with specific UI elements, always reproduce those exact interactions. Don't bypass them with JS APIs.
