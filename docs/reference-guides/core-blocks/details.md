# Details

**Name:** `core/details`
**Category:** text
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Hide and show additional content.

**Keywords:** `summary`, `toggle`, `disclosure`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `showContent` | `boolean` | `false` | — |
| `summary` | `rich-text` | — | Source: `rich-text`. Selector: `summary`. Role: `content` |
| `name` | `string` | — | Source: `attribute`. Selector: `.wp-block-details`. HTML attr: `name` |
| `placeholder` | `string` | — | — |

## Supports

- **align**: `"wide"`, `"full"`
- **anchor**: `true`
- **color**:
  - gradients: `true`
  - link: `true`
- **html**: `false`
- **spacing**:
  - margin: `true`
  - padding: `true`
  - blockGap: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **layout**:
  - allowEditing: `false`
- **interactivity**:
  - clientNavigation: `true`
- **allowedBlocks**: `true`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:details {"showContent":false} -->
<!-- Content... -->
<!-- /wp:details -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/details/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/details/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/details/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/details/index.php)
