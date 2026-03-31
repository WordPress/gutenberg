# File

**Name:** `core/file`
**Category:** media
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Add a link to a downloadable file.

**Keywords:** `document`, `pdf`, `download`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | `number` | — | — |
| `blob` | `string` | — | Role: `local` |
| `href` | `string` | — | Role: `content` |
| `fileId` | `string` | — | Source: `attribute`. Selector: `a:not([download])`. HTML attr: `id` |
| `fileName` | `rich-text` | — | Source: `rich-text`. Selector: `a:not([download])`. Role: `content` |
| `textLinkHref` | `string` | — | Source: `attribute`. Selector: `a:not([download])`. HTML attr: `href`. Role: `content` |
| `textLinkTarget` | `string` | — | Source: `attribute`. Selector: `a:not([download])`. HTML attr: `target` |
| `showDownloadButton` | `boolean` | `true` | — |
| `downloadButtonText` | `rich-text` | — | Source: `rich-text`. Selector: `a[download]`. Role: `content` |
| `displayPreview` | `boolean` | — | — |
| `previewHeight` | `number` | `600` | — |

## Supports

- **anchor**: `true`
- **align**: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **color**:
  - gradients: `true`
  - link: `true`
  - text: `false`
- **interactivity**: `true`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:file {"showDownloadButton":true,"previewHeight":600} -->
<!-- Content... -->
<!-- /wp:file -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/file/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/file/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/file/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/file/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/file/deprecated.js)
