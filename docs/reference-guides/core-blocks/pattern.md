# Pattern Placeholder

**Name:** `core/pattern`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Show a block pattern.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `slug` | `string` | — | — |

## Supports

- **html**: `false`
- **inserter**: `false`
- **renaming**: `false`
- **visibility**: `false`
- **interactivity**:
  - clientNavigation: `true`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:pattern /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/pattern/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/pattern/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/pattern/index.php)
