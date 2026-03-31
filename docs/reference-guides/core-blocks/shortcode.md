# Shortcode

**Name:** `core/shortcode`
**Category:** widgets
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Insert additional custom elements with a WordPress shortcode.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | — | Source: `raw`. Role: `content` |

## Supports

- **className**: `false`
- **customClassName**: `false`
- **html**: `false`
- **customCSS**: `false`
- **visibility**: `false`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:shortcode -->
<!-- Content... -->
<!-- /wp:shortcode -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/shortcode/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/shortcode/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/shortcode/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/shortcode/index.php)
