# Post Terms

**Name:** `core/post-terms`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Post terms.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `term` | `string` | — | — |
| `separator` | `string` | `", "` | — |
| `prefix` | `string` | `""` | Role: `content` |
| `suffix` | `string` | `""` | Role: `content` |

## Supports

- **anchor**: `true`
- **html**: `false`
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
<!-- wp:post-terms {"separator":", ","prefix":"","suffix":""} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-terms/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-terms/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-terms/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-terms/deprecated.js)
