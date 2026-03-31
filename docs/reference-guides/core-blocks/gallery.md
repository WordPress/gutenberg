# Gallery

**Name:** `core/gallery`
**Category:** media
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Display multiple images in a rich gallery.

**Keywords:** `images`, `photos`

## Block Relationships

**Allowed inner blocks:**
- `core/image`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `images` | `array` | `[]` | Source: `query`. Selector: `.blocks-gallery-item` |
| `ids` | `array` | `[]` | — |
| `navigationButtonType` | `string` | `"icon"` | Enum: `icon`, `text`, `both` |
| `shortCodeTransforms` | `array` | `[]` | — |
| `columns` | `number` | — | — |
| `caption` | `rich-text` | — | Source: `rich-text`. Selector: `.blocks-gallery-caption`. Role: `content` |
| `imageCrop` | `boolean` | `true` | — |
| `randomOrder` | `boolean` | `false` | — |
| `fixedHeight` | `boolean` | `true` | — |
| `linkTarget` | `string` | — | — |
| `linkTo` | `string` | — | — |
| `sizeSlug` | `string` | `"large"` | — |
| `allowResize` | `boolean` | `false` | — |
| `aspectRatio` | `string` | `"auto"` | — |

## Supports

- **anchor**: `true`
- **align**: `true`
- **html**: `false`
- **units**: `"px"`, `"em"`, `"rem"`, `"vh"`, `"vw"`
- **spacing**:
  - margin: `true`
  - padding: `true`
  - blockGap: `["horizontal","vertical"]`
- **color**:
  - text: `false`
  - background: `true`
  - gradients: `true`
- **layout**:
  - allowSwitching: `false`
  - allowInheriting: `false`
  - allowEditing: `false`
  - default: `{"type":"flex"}`
- **interactivity**:
  - clientNavigation: `true`
- **listView**: `true`

## Context

**Uses context:**

- `galleryId`

**Provides context:**

- `allowResize` → attribute `allowResize`
- `imageCrop` → attribute `imageCrop`
- `fixedHeight` → attribute `fixedHeight`
- `navigationButtonType` → attribute `navigationButtonType`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:gallery {"images":[],"ids":[],"navigationButtonType":"icon","shortCodeTransforms":[],"imageCrop":true,"randomOrder":false,"fixedHeight":true,"sizeSlug":"large","allowResize":false,"aspectRatio":"auto"} -->
<!-- Content... -->
<!-- /wp:gallery -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/gallery/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/gallery/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/gallery/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/gallery/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/gallery/deprecated.js)
