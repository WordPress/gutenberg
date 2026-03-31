# Page List

**Name:** `core/page-list`
**Category:** widgets
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Display a list of all pages.

**Keywords:** `menu`, `navigation`

## Block Relationships

**Allowed inner blocks:**
- `core/page-list-item`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `parentPageID` | `integer` | `0` | — |
| `isNested` | `boolean` | `false` | — |

## Supports

- **anchor**: `true`
- **reusable**: `false`
- **html**: `false`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **interactivity**:
  - clientNavigation: `true`
- **color**:
  - text: `true`
  - background: `true`
  - link: `true`
  - gradients: `true`
- **spacing**:
  - padding: `true`
  - margin: `true`
- **contentRole**: `true`

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
- `style`
- `openSubmenusOnClick`
- `submenuVisibility`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:page-list {"parentPageID":0,"isNested":false} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/page-list/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/page-list/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/page-list/index.php)
