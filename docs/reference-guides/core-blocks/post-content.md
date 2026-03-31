# Content

**Name:** `core/post-content`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Displays the contents of a post or page.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `tagName` | `string` | `"div"` | — |

## Supports

- **anchor**: `true`
- **align**: `"wide"`, `"full"`
- **html**: `false`
- **layout**: `true`
- **background**:
  - backgroundImage: `true`
  - backgroundSize: `true`
- **dimensions**:
  - minHeight: `true`
- **spacing**:
  - blockGap: `true`
  - padding: `true`
  - margin: `true`
- **color**:
  - gradients: `true`
  - heading: `true`
  - link: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `postId`
- `postType`
- `queryId`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:post-content {"tagName":"div"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-content/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-content/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-content/index.php)
