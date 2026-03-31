# Text Columns (deprecated)

**Name:** `core/text-columns`
**Category:** design
**API Version:** 3
**Block Type:** Static (saved in post content)

> This block is deprecated. Please use the Columns block instead.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `content` | `array` | `[{},{}]` | Source: `query`. Selector: `p` |
| `columns` | `number` | `2` | — |
| `width` | `string` | — | — |

## Supports

- **inserter**: `false`
- **interactivity**:
  - clientNavigation: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:text-columns {"content":[{},{}],"columns":2} -->
<!-- Content... -->
<!-- /wp:text-columns -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/text-columns/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/text-columns/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/text-columns/save.js)
