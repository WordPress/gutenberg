# Avatar

**Name:** `core/avatar`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Add a user’s avatar.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `userId` | `number` | — | — |
| `size` | `number` | `96` | — |
| `isLink` | `boolean` | `false` | — |
| `linkTarget` | `string` | `"_self"` | — |

## Supports

- **anchor**: `true`
- **html**: `false`
- **align**: `true`
- **alignWide**: `false`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **color**:
  - text: `false`
  - background: `false`
- **filter**:
  - duotone: `true`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `postType`
- `postId`
- `commentId`

## CSS Selectors

- **border**: `.wp-block-avatar img`
- **filter**:
  - duotone: `.wp-block-avatar img`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:avatar {"size":96,"isLink":false,"linkTarget":"_self"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/avatar/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/avatar/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/avatar/index.php)
