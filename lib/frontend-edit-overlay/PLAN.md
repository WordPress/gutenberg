# "Edit This" Frontend Hover-Overlay Feature - Implementation Plan

## Overview
Add frontend "Edit this" hover-overlay buttons on the site frontend for logged-in admins. When hovering over template parts (header, footer, sidebars) or post content, an overlay button appears that links to the appropriate editor (site editor for template parts, post editor for post content). Feature is guarded behind a Gutenberg experiment flag.

## Requirements Summary
- **Scope**: Template parts + post content
- **Detection**: HTML data attributes with namespace (`data-wp-edit-overlay-*`)
- **Actions**: Navigate to appropriate editor (site editor or post editor)
- **Page coverage**: All public pages (home, single posts, archives, search, etc.)
- **Approach**: Lightweight overlay using vanilla JavaScript initially, can migrate to Interactivity API later

## Architecture: Three-Layer Implementation

### Layer 1: Experiment Registration (PHP)
**File**: `/lib/experiments-page.php`
- Register new experiment flag: `gutenberg-frontend-edit-overlay`
- Uses existing checkbox field UI pattern
- Accessed via: `gutenberg_is_experiment_enabled( 'gutenberg-frontend-edit-overlay' )`

### Layer 2: Server-Side Markup (PHP)
**File**: `/lib/frontend-edit-overlay.php` (IMPLEMENTED)
- Hook into `render_block` filter to catch final rendered HTML with wrapper elements
- Handles three block types:
  - `core/template-part`: Requires `edit_theme_options` capability
  - `core/post-title`: Requires `edit_post` capability
  - `core/post-content`: Requires `edit_post` capability, uses `get_the_ID()` fallback for post ID detection
- Use `WP_HTML_Tag_Processor` to add identifying data attributes:
  - All blocks: `data-wp-edit-overlay-target`, `data-wp-edit-url`
  - Template parts: `data-wp-edit-template-part-id`
  - Posts: `data-wp-edit-post-id`
- Generate edit URLs with appropriate parameters:
  - Template parts: Site editor with `canvas=edit` parameter
  - Posts: Post editor with `post` and `action=edit` parameters
- Block theme guard: Feature only enabled for block themes via `wp_is_block_theme()` check

### Layer 3: Frontend Overlay UI (JavaScript)
**File**: `/lib/frontend-edit-overlay/view.js` (IMPLEMENTED)
- Query all elements with `[data-wp-edit-overlay-target]`
- Button creation and management:
  - Create one button per element (stored in WeakMap for automatic cleanup)
  - Position as fixed element relative to element's bounding client rect
  - Position at bottom-right corner of element using `getBoundingClientRect()`
- Event handling:
  - Hover on element: Show button with 50ms debounce
  - Mouse enter button: Keep visible (prevent flickering)
  - Mouse leave button: Hide only if element not hovered
  - Scroll/Resize: Update button positions via debounced `updateButtonPositions()`
  - Focus: Show overlay for keyboard navigation support
  - Escape key: Hide all overlays
- State tracking:
  - `hoveredElements` Set: Track which elements are currently hovered
  - `overlayButtons` WeakMap: Associate buttons with elements
  - Proper focus management to prevent flickering
- Click handler: Navigate to edit URL from `data-wp-edit-url` attribute

**Design philosophy**: Keep styling flexible and customizable. Use CSS variables for colors, sizes, positioning to allow themes/experiments to customize appearance easily.

**Button behavior**: Buttons float over their associated elements at the bottom-right corner, with fixed positioning that updates during scroll/resize events to stay properly positioned relative to the element they're editing.

## Implementation Files

### New Files Created ✓
1. **`/lib/frontend-edit-overlay.php`** (~160 lines)
   - `gutenberg_get_frontend_edit_overlay_template_part_url()`: Generates site editor URLs
   - `gutenberg_get_frontend_edit_overlay_post_url()`: Generates post editor URLs
   - `gutenberg_add_frontend_edit_overlay_to_block()`: Main filter callback handling template-part, post-title, and post-content blocks
   - Hooked to `render_block` filter at priority 10
   - All debug logging removed for production

2. **`/lib/frontend-edit-overlay/view.js`** (~260 lines)
   - DOM query for marked elements with event delegation
   - Hover event handling with 50ms debounce
   - Overlay button creation and positioning logic
   - WeakMap for button lifecycle management
   - Set for tracking hovered elements to prevent flickering
   - Scroll and resize event listeners (debounced 10ms) to update button positions
   - Click handler for navigation
   - Keyboard support (focus, blur, escape)

3. **`/lib/frontend-edit-overlay/style.css`** (~56 lines)
   - Vanilla CSS (no build step required)
   - Button styling with CSS variables for customization
   - States: default (hidden), visible, hover, focus, active
   - Minimal CSS, no layout shifts
   - Variables: `--wp-edit-overlay-button-bg`, `--wp-edit-overlay-button-color`, `--wp-edit-overlay-button-border-color`, `--wp-edit-overlay-z-index`, `--wp-edit-overlay-button-padding`, `--wp-edit-overlay-button-font-size`, `--wp-edit-overlay-button-border-radius`

### Files Modified ✓
1. **`/lib/experiments-page.php`** (~10 lines added)
   - Registered `gutenberg-frontend-edit-overlay` experiment field
   - Added to experiments list with user-friendly description

2. **`/lib/client-assets.php`** (~50 lines added)
   - Added `gutenberg_enqueue_frontend_edit_overlay()` function
   - Conditional loading: only for logged-in users with `edit_posts` capability and experiment enabled
   - Enqueues both script and stylesheet with proper dependencies
   - Hooked to `wp_enqueue_scripts`
   - Uses `gutenberg_url()` for asset paths

3. **`/lib/load.php`** (~2 lines added)
   - Conditionally requires `/lib/frontend-edit-overlay.php` when experiment is enabled

## Key Design Decisions

### Hook Strategy for Detecting Areas
- **Unified approach**: All blocks use `render_block` filter at priority 10
- **Why this approach**:
  - `render_block` filter receives the **final rendered HTML with wrapper elements**, unlike action hooks which fire before wrapper creation
  - Single filter is simpler than multiple block-specific hooks
  - Works for template-part, post-title, and post-content blocks
  - Allows checking block context and capabilities in one place
- **Lesson learned**: Initially tried specific action hooks (`render_block_core_template_part_post`, etc.) but these fire before wrapper HTML is created, making attribute injection impossible. Switched to `render_block` which has the complete rendered output.

### Frontend Script Loading
- Conditional loading only for authorized users (checked in PHP)
- No script loaded for:
  - Non-logged-in users
  - Users without `edit_posts` capability
  - When experiment is disabled
- Reduces unnecessary JavaScript for non-admin users

### Edit URL Generation
- Template parts: `/wp-admin/site-editor.php?p=/wp_template_part/{ID}`
- Post content: `/wp-admin/post.php?post={ID}&action=edit`
- URLs generated server-side and stored in data attributes

## Testing Strategy

### PHP Unit Tests
- Experiment flag registration
- Attribute injection for template parts and post content
- Capability checks (non-admin users don't get attributes)
- Behavior when experiment is disabled

### E2E Tests (Playwright)
- Overlay appears on hover for logged-in admin users
- Clicking navigates to correct editor (verified by URL)
- Overlay doesn't appear for non-admin users
- Different template part types work (header, footer, sidebar)
- Works on different page types (single posts, archives, home)

### Manual Testing
- Enable experiment in wp-admin > Tools > Experiments
- Visit frontend as logged-in admin
- Verify overlay on hover, correct editor navigation

## Implementation Order (Completed)

1. ✓ **Phase 1 - Infrastructure**: Registered experiment in `/lib/experiments-page.php`, created `/lib/frontend-edit-overlay.php`
2. ✓ **Phase 2 - Template Parts**: Added `render_block` filter for template-part blocks with data attributes
3. ✓ **Phase 3 - Post Content**: Added filter handling for post-title and post-content blocks with fallback post ID detection
4. ✓ **Phase 4 - Frontend JS**: Created view.js with hover overlay logic, button positioning, and event handling
5. ✓ **Phase 5 - Frontend Styles**: Created style.css with CSS variables and state styling
6. ✓ **Phase 6 - Script Integration**: Registered and conditionally loaded frontend script in `/lib/client-assets.php`
7. ✓ **Phase 7 - Refinements**:
   - Fixed flickering issues with proper focus and hover state tracking
   - Implemented element-relative button positioning at bottom-right corner
   - Added scroll/resize event listeners to update button positions
   - Removed all debug logging
   - Added post-content fallback using `get_the_ID()`
   - Added block theme guard

## Performance Considerations

- One button per element stored in WeakMap (automatic garbage collection when elements removed)
- Lazy button creation (only on hover, not page load)
- Debounced hover events (50ms delay to reduce event processing)
- Debounced scroll/resize position updates (10ms delay to reduce reflow/repaint)
- Minimal CSS (no animation libraries, simple opacity transitions)
- Passive event listeners for scroll and resize (non-blocking)
- Script only loaded for authorized users and when experiment enabled
- Total frontend bundle size: ~7 KB (view.js + style.css)

## Accessibility
- Overlay button is focusable (keyboard navigation via Tab)
- Button remains visible when focused (not hidden on blur)
- Proper ARIA labels and semantic HTML (`<button>` tag)
- Keyboard support: Tab to focus, Enter to activate, Escape to close
- Works for screen readers
- Focus management: When element or button is focused, overlay stays visible
- Hidden state: Only hidden when mouse leaves AND nothing is focused

## Current Status: IMPLEMENTATION COMPLETE ✓

### What Works
- ✓ Experiment registration and gating
- ✓ Template part overlay detection and edit links
- ✓ Post title overlay detection and edit links
- ✓ Post content overlay detection and edit links (with fallback post ID detection)
- ✓ Floating button positioned at bottom-right of element
- ✓ Button positioning updates on scroll/resize
- ✓ Proper show/hide behavior without flickering
- ✓ Keyboard navigation and focus management
- ✓ Escape key to close all overlays
- ✓ Block theme guard
- ✓ Capability checks for authorized users only
- ✓ All debug logging removed

### Known Limitations
- Buttons are created per element (not a single global button)
- Positioning uses fixed viewport coordinates, requires scroll/resize listeners to track element movement
- CSS variables for customization are available but not extensively documented

### Testing Recommendations
- Manual testing on various page types (single posts, archives, home page)
- Test with long pages (post-content scrolling behavior)
- Test on narrow viewports (button visibility at element edges)
- Verify capability checks prevent non-admin access
- Test with experiment disabled to ensure feature is gated properly
