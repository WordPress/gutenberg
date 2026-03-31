# Author (deprecated)

**Name:** `core/post-author`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> This block is deprecated. Please use the Avatar block, the Author Name block, and the Author Biography block instead.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `textAlign` | `string` | — | — |
| `avatarSize` | `number` | `48` | — |
| `showAvatar` | `boolean` | `true` | — |
| `showBio` | `boolean` | — | — |
| `byline` | `string` | — | — |
| `isLink` | `boolean` | `false` | Role: `content` |
| `linkTarget` | `string` | `"_self"` | Role: `content` |

## Supports

- **inserter**: `false`
- **anchor**: `true`
- **html**: `false`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **color**:
  - gradients: `true`
  - link: `true`
- **interactivity**:
  - clientNavigation: `true`
- **filter**:
  - duotone: `true`

## Context

**Uses context:**

- `postType`
- `postId`
- `queryId`

## CSS Selectors

- **filter**:
  - duotone: `.wp-block-post-author .wp-block-post-author__avatar img`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:post-author {"avatarSize":48,"showAvatar":true,"isLink":false,"linkTarget":"_self"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-author/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-author/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-author/index.php)
