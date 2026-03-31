# Template Part

**Name:** `core/template-part`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Edit the different global regions of your site, like the header, footer, sidebar, or create your own.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `slug` | `string` | — | — |
| `theme` | `string` | — | — |
| `tagName` | `string` | — | — |
| `area` | `string` | — | — |

## Supports

- **align**: `true`
- **html**: `false`
- **reusable**: `false`
- **renaming**: `false`
- **interactivity**:
  - clientNavigation: `true`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:template-part /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/template-part/block.json)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/template-part/index.php)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/template-part/variations.js)
