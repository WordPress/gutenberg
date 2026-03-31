# Paragraph

**Name:** `core/paragraph`
**Category:** text
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Start with the basic building block of all narrative.

**Keywords:** `text`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `content` | `rich-text` | — | Source: `rich-text`. Selector: `p`. Role: `content` |
| `dropCap` | `boolean` | `false` | — |
| `placeholder` | `string` | — | — |
| `direction` | `string` | — | Enum: `ltr`, `rtl` |

## Supports

- **align**: `"wide"`, `"full"`
- **splitting**: `true`
- **anchor**: `true`
- **className**: `false`
- **color**:
  - gradients: `true`
  - link: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
  - textAlign: `true`
  - textColumns: `true`
  - textIndent: `true`
  - fitText: `true`
- **interactivity**:
  - clientNavigation: `true`

## CSS Selectors

- **root**: `p`
- **typography**:
  - textIndent: `.wp-block-paragraph + .wp-block-paragraph`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:paragraph {"dropCap":false} -->
<!-- Content... -->
<!-- /wp:paragraph -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/paragraph/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/paragraph/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/paragraph/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/paragraph/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/paragraph/deprecated.js)
