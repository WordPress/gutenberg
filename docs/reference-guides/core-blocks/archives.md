# Archives

**Name:** `core/archives`
**Category:** widgets
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Display a date archive of your posts.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `displayAsDropdown` | `boolean` | `false` | — |
| `showLabel` | `boolean` | `true` | — |
| `showPostCounts` | `boolean` | `false` | — |
| `type` | `string` | `"monthly"` | — |

## Supports

- **anchor**: `true`
- **align**: `true`
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

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:archives {"displayAsDropdown":false,"showLabel":true,"showPostCounts":false,"type":"monthly"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/archives/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/archives/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/archives/index.php)
