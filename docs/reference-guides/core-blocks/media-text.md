# Media & Text

**Name:** `core/media-text`
**Category:** media
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Set media and words side-by-side for a richer layout.

**Keywords:** `image`, `video`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `align` | `string` | `"none"` | — |
| `mediaAlt` | `string` | `""` | Source: `attribute`. Selector: `figure img`. HTML attr: `alt`. Role: `content` |
| `mediaPosition` | `string` | `"left"` | — |
| `mediaId` | `number` | — | Role: `content` |
| `mediaUrl` | `string` | — | Source: `attribute`. Selector: `figure video,figure img`. HTML attr: `src`. Role: `content` |
| `mediaLink` | `string` | — | — |
| `linkDestination` | `string` | — | — |
| `linkTarget` | `string` | — | Source: `attribute`. Selector: `figure a`. HTML attr: `target` |
| `href` | `string` | — | Source: `attribute`. Selector: `figure a`. HTML attr: `href`. Role: `content` |
| `rel` | `string` | — | Source: `attribute`. Selector: `figure a`. HTML attr: `rel` |
| `linkClass` | `string` | — | Source: `attribute`. Selector: `figure a`. HTML attr: `class` |
| `mediaType` | `string` | — | Role: `content` |
| `mediaWidth` | `number` | `50` | — |
| `mediaSizeSlug` | `string` | — | — |
| `isStackedOnMobile` | `boolean` | `true` | — |
| `verticalAlignment` | `string` | — | — |
| `imageFill` | `boolean` | — | — |
| `focalPoint` | `object` | — | — |
| `useFeaturedImage` | `boolean` | `false` | — |

## Supports

- **anchor**: `true`
- **align**: `"wide"`, `"full"`
- **html**: `false`
- **color**:
  - gradients: `true`
  - heading: `true`
  - link: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **interactivity**:
  - clientNavigation: `true`
- **allowedBlocks**: `true`

## Context

**Uses context:**

- `postId`
- `postType`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:media-text {"align":"none","mediaAlt":"","mediaPosition":"left","mediaWidth":50,"isStackedOnMobile":true,"useFeaturedImage":false} -->
<!-- Content... -->
<!-- /wp:media-text -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/media-text/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/media-text/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/media-text/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/media-text/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/media-text/deprecated.js)
