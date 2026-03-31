# Preformatted

**Name:** `core/preformatted`
**Category:** text
**API Version:** 3
**Block Type:** Static (saved in post content)

> Add text that respects your spacing and tabs, and also allows styling.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `content` | `rich-text` | — | Source: `rich-text`. Selector: `pre`. Role: `content` |

## Supports

- **anchor**: `true`
- **color**:
  - gradients: `true`
- **spacing**:
  - padding: `true`
  - margin: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **interactivity**:
  - clientNavigation: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:preformatted -->
<!-- Content... -->
<!-- /wp:preformatted -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/preformatted/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/preformatted/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/preformatted/save.js)
