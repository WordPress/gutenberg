# Comments Title

**Name:** `core/comments-title`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Displays a title with the number of comments.

## Block Relationships

**Ancestor blocks:**
- `core/comments`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `showPostTitle` | `boolean` | `true` | — |
| `showCommentsCount` | `boolean` | `true` | — |
| `level` | `number` | `2` | — |
| `levelOptions` | `array` | — | — |

## Supports

- **anchor**: `true`
- **align**: `true`
- **html**: `false`
- **color**:
  - gradients: `true`
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
<!-- wp:comments-title {"showPostTitle":true,"showCommentsCount":true,"level":2} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-title/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-title/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-title/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-title/deprecated.js)
