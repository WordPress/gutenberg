# Author Name

**Name:** `core/post-author-name`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> The author name.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `isLink` | `boolean` | `false` | Role: `content` |
| `linkTarget` | `string` | `"_self"` | Role: `content` |

## Supports

- **anchor**: `true`
- **html**: `false`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **color**:
  - gradients: `true`
  - link: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
  - textAlign: `true`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `postType`
- `postId`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:post-author-name {"isLink":false,"linkTarget":"_self"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-author-name/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-author-name/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-author-name/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-author-name/deprecated.js)
