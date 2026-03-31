# Custom Link

**Name:** `core/navigation-link`
**Category:** design
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Add a page, link, or another item to your navigation.

## Block Relationships

**Parent blocks (direct):**
- `core/navigation`

**Allowed inner blocks:**
- `core/navigation-link`
- `core/navigation-submenu`
- `core/page-list`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | — | Role: `content` |
| `type` | `string` | — | — |
| `description` | `string` | — | — |
| `rel` | `string` | — | — |
| `id` | `number` | — | — |
| `opensInNewTab` | `boolean` | `false` | — |
| `url` | `string` | — | Role: `content` |
| `title` | `string` | — | — |
| `kind` | `string` | — | — |
| `isTopLevelLink` | `boolean` | — | — |

## Supports

- **anchor**: `true`
- **reusable**: `false`
- **html**: `false`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **renaming**: `false`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `textColor`
- `customTextColor`
- `backgroundColor`
- `customBackgroundColor`
- `overlayTextColor`
- `customOverlayTextColor`
- `overlayBackgroundColor`
- `customOverlayBackgroundColor`
- `fontSize`
- `customFontSize`
- `showSubmenuIcon`
- `maxNestingLevel`
- `style`

## CSS Selectors

- **states**:
  - @current: `.wp-block-navigation .current-menu-item`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:navigation-link {"opensInNewTab":false} -->
<!-- Content... -->
<!-- /wp:navigation-link -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation-link/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation-link/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation-link/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation-link/index.php)
