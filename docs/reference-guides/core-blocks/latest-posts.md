# Latest Posts

**Name:** `core/latest-posts`
**Category:** widgets
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Display a list of your most recent posts.

**Keywords:** `recent posts`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `categories` | `array` | — | — |
| `selectedAuthor` | `number` | — | — |
| `postsToShow` | `number` | `5` | — |
| `displayPostContent` | `boolean` | `false` | — |
| `displayPostContentRadio` | `string` | `"excerpt"` | — |
| `excerptLength` | `number` | `55` | — |
| `displayAuthor` | `boolean` | `false` | — |
| `displayPostDate` | `boolean` | `false` | — |
| `postLayout` | `string` | `"list"` | — |
| `columns` | `number` | `3` | — |
| `order` | `string` | `"desc"` | — |
| `orderBy` | `string` | `"date"` | — |
| `displayFeaturedImage` | `boolean` | `false` | — |
| `featuredImageAlign` | `string` | — | Enum: `left`, `center`, `right` |
| `featuredImageSizeSlug` | `string` | `"thumbnail"` | — |
| `featuredImageSizeWidth` | `number` | `null` | — |
| `featuredImageSizeHeight` | `number` | `null` | — |
| `addLinkToFeaturedImage` | `boolean` | `false` | — |

## Supports

- **anchor**: `true`
- **align**: `true`
- **html**: `false`
- **color**:
  - gradients: `true`
  - link: `true`
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
<!-- wp:latest-posts {"postsToShow":5,"displayPostContent":false,"displayPostContentRadio":"excerpt","excerptLength":55,"displayAuthor":false,"displayPostDate":false,"postLayout":"list","columns":3,"order":"desc","orderBy":"date","displayFeaturedImage":false,"featuredImageSizeSlug":"thumbnail","featuredImageSizeWidth":null,"featuredImageSizeHeight":null,"addLinkToFeaturedImage":false} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-posts/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-posts/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-posts/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/latest-posts/deprecated.js)
