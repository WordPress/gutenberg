# Read More

**Name:** `core/read-more`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Displays the link of a post, page, or any other content-type.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `content` | `string` | — | Role: `content` |
| `linkTarget` | `string` | `"_self"` | — |

## Supports

- **anchor**: `true`
- **html**: `false`
- **color**:
  - gradients: `true`
  - text: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **spacing**:
  - margin: `["top","bottom"]`
  - padding: `true`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `postId`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:read-more {"linkTarget":"_self"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/read-more/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/read-more/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/read-more/index.php)
