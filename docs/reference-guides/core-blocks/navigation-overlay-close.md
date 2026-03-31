# Navigation Overlay Close

**Name:** `core/navigation-overlay-close`
**Category:** design
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> A customizable button to close overlays.

**Keywords:** `close`, `overlay`, `navigation`, `menu`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `displayMode` | `string` | `"icon"` | Enum: `icon`, `text`, `both` |
| `text` | `string` | — | — |

## Supports

- **color**:
  - gradients: `false`
- **spacing**:
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:navigation-overlay-close {"displayMode":"icon"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation-overlay-close/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation-overlay-close/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation-overlay-close/index.php)
