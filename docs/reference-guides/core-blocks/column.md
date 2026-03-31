# Column

**Name:** `core/column`
**Category:** design
**API Version:** 3
**Block Type:** Static (saved in post content)

> A single column within a columns block.

## Block Relationships

**Parent blocks (direct):**
- `core/columns`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `verticalAlignment` | `string` | — | — |
| `width` | `string` | — | — |
| `templateLock` | `string \| boolean` | — | Enum: `all`, `insert`, `contentOnly`, `false` |

## Supports

- **anchor**: `true`
- **reusable**: `false`
- **html**: `false`
- **color**:
  - gradients: `true`
  - heading: `true`
  - button: `true`
  - link: `true`
- **shadow**: `true`
- **spacing**:
  - blockGap: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **layout**: `true`
- **interactivity**:
  - clientNavigation: `true`
- **allowedBlocks**: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:column -->
<!-- Content... -->
<!-- /wp:column -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/column/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/column/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/column/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/column/deprecated.js)
