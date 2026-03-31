# Comments Link

**Name:** `core/post-comments-link`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Displays the link to the current post comments.

## Attributes

_This block has no custom attributes._

## Supports

- **anchor**: `true`
- **html**: `false`
- **color**:
  - link: `true`
  - text: `false`
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

- `postType`
- `postId`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:post-comments-link /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-comments-link/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-comments-link/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-comments-link/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-comments-link/deprecated.js)
