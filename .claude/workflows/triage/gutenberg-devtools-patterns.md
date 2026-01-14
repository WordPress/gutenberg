# Gutenberg E2E Patterns for Chrome DevTools MCP

These patterns are extracted from Gutenberg's official Playwright e2e tests and translated to Chrome DevTools MCP. Using these proven patterns reduces blind investigation.

## Wait Conditions (Critical for Stability)

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

## Editor Canvas Access (Iframe Handling)

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

## Block Operations via wp.data (Most Reliable)

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

## Common UI Regions (Role-Based Selectors)

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

## Publish/Save Patterns (Exact Gutenberg Flow)

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

## Settings & Preferences (Disable Welcome Guides)

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

## Block Toolbar Interactions

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

## Common Block Selectors

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

## Site Editor Navigation

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

## Notice Detection (Success/Error Verification)

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

## Pattern: Full Page Load Sequence

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
