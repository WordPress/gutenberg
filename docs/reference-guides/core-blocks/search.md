# Search

**Name:** `core/search`
**Category:** widgets
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Help visitors find your content.

**Keywords:** `find`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | — | Role: `content` |
| `showLabel` | `boolean` | `true` | — |
| `placeholder` | `string` | `""` | Role: `content` |
| `width` | `number` | — | — |
| `widthUnit` | `string` | — | — |
| `buttonText` | `string` | — | Role: `content` |
| `buttonPosition` | `string` | `"button-outside"` | — |
| `buttonUseIcon` | `boolean` | `false` | — |
| `query` | `object` | `{}` | — |
| `isSearchFieldHidden` | `boolean` | `false` | — |

## Supports

- **anchor**: `true`
- **align**: `"left"`, `"center"`, `"right"`
- **color**:
  - gradients: `true`
- **interactivity**: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **spacing**:
  - margin: `true`
- **html**: `false`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:search {"showLabel":true,"placeholder":"","buttonPosition":"button-outside","buttonUseIcon":false,"query":{},"isSearchFieldHidden":false} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/search/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/search/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/search/index.php)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/search/variations.js)
