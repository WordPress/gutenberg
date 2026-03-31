# Latest Comments

**Name:** `core/latest-comments`
**Category:** widgets
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Display a list of your most recent comments.

**Keywords:** `recent comments`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `commentsToShow` | `number` | `5` | — |
| `displayAvatar` | `boolean` | `true` | — |
| `displayDate` | `boolean` | `true` | — |
| `displayContent` | `string` | `"excerpt"` | Enum: `none`, `excerpt`, `full` |

## Supports

- **anchor**: `true`
- **align**: `true`
- **color**:
  - gradients: `true`
  - link: `true`
- **html**: `false`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **interactivity**:
  - clientNavigation: `true`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:latest-comments {"commentsToShow":5,"displayAvatar":true,"displayDate":true,"displayContent":"excerpt"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-comments/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-comments/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-comments/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-comments/deprecated.js)
