# Time to Read

**Name:** `core/post-time-to-read`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Show minutes required to finish reading the post. Can also show a word count.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `displayAsRange` | `boolean` | `true` | — |
| `displayMode` | `string` | `"time"` | — |
| `averageReadingSpeed` | `number` | `189` | — |

## Supports

- **anchor**: `true`
- **color**:
  - gradients: `true`
- **html**: `false`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
  - textAlign: `true`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `postId`
- `postType`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:post-time-to-read {"displayAsRange":true,"displayMode":"time","averageReadingSpeed":189} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-time-to-read/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-time-to-read/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-time-to-read/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-time-to-read/deprecated.js)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-time-to-read/variations.js)
