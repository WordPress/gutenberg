# Post Template

**Name:** `core/post-template`
**Category:** theme
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Contains the block elements used to render a post, like the title, date, featured image, content or excerpt, and more.

## Block Relationships

**Ancestor blocks:**
- `core/query`

## Attributes

_This block has no custom attributes._

## Supports

- **anchor**: `true`
- **reusable**: `false`
- **html**: `false`
- **align**: `"wide"`, `"full"`
- **layout**: `true`
- **color**:
  - gradients: `true`
  - link: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
  - blockGap: `{"__experimentalDefault":"1.25em"}`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `queryId`
- `query`
- `displayLayout`
- `templateSlug`
- `previewPostType`
- `enhancedPagination`
- `postType`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:post-template -->
<!-- Content... -->
<!-- /wp:post-template -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-template/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-template/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-template/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-template/index.php)
