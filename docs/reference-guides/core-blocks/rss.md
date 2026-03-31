# RSS

**Name:** `core/rss`
**Category:** widgets
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Display entries from any RSS or Atom feed.

**Keywords:** `atom`, `feed`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `number` | `2` | — |
| `blockLayout` | `string` | `"list"` | — |
| `feedURL` | `string` | `""` | Role: `content` |
| `itemsToShow` | `number` | `5` | — |
| `displayExcerpt` | `boolean` | `false` | — |
| `displayAuthor` | `boolean` | `false` | — |
| `displayDate` | `boolean` | `false` | — |
| `excerptLength` | `number` | `55` | — |
| `openInNewTab` | `boolean` | `false` | — |
| `rel` | `string` | — | — |

## Supports

- **anchor**: `true`
- **align**: `true`
- **html**: `false`
- **interactivity**:
  - clientNavigation: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **color**:
  - background: `true`
  - text: `true`
  - gradients: `true`
  - link: `true`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:rss {"columns":2,"blockLayout":"list","feedURL":"","itemsToShow":5,"displayExcerpt":false,"displayAuthor":false,"displayDate":false,"excerptLength":55,"openInNewTab":false} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/rss/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/rss/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/rss/index.php)
