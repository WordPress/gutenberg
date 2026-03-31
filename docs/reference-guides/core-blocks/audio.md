# Audio

**Name:** `core/audio`
**Category:** media
**API Version:** 3
**Block Type:** Static (saved in post content)

> Embed a simple audio player.

**Keywords:** `music`, `sound`, `podcast`, `recording`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `blob` | `string` | — | Role: `local` |
| `src` | `string` | — | Source: `attribute`. Selector: `audio`. HTML attr: `src`. Role: `content` |
| `caption` | `rich-text` | — | Source: `rich-text`. Selector: `figcaption`. Role: `content` |
| `id` | `number` | — | Role: `content` |
| `autoplay` | `boolean` | — | Source: `attribute`. Selector: `audio`. HTML attr: `autoplay` |
| `loop` | `boolean` | — | Source: `attribute`. Selector: `audio`. HTML attr: `loop` |
| `preload` | `string` | — | Source: `attribute`. Selector: `audio`. HTML attr: `preload` |

## Supports

- **anchor**: `true`
- **align**: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **interactivity**:
  - clientNavigation: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:audio -->
<!-- Content... -->
<!-- /wp:audio -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/audio/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/audio/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/audio/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/audio/deprecated.js)
