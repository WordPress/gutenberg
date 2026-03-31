# Math

**Name:** `core/math`
**Category:** text
**API Version:** 3
**Block Type:** Static (saved in post content)

> Display mathematical notation using LaTeX.

**Keywords:** `equation`, `formula`, `latex`, `mathematics`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `latex` | `string` | — | Role: `content` |
| `mathML` | `string` | — | Source: `html`. Selector: `math` |

## Supports

- **anchor**: `true`
- **html**: `false`
- **color**:
  - gradients: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:math -->
<!-- Content... -->
<!-- /wp:math -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/math/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/math/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/math/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/math/deprecated.js)
