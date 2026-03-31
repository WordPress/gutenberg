# Quote

**Name:** `core/quote`
**Category:** text
**API Version:** 3
**Block Type:** Static (saved in post content)

> Give quoted text visual emphasis. "In quoting others, we cite ourselves." — Julio Cortázar

**Keywords:** `blockquote`, `cite`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `string` | `""` | Source: `html`. Selector: `blockquote`. Role: `content` |
| `citation` | `rich-text` | — | Source: `rich-text`. Selector: `cite`. Role: `content` |
| `textAlign` | `string` | — | — |

## Supports

- **anchor**: `true`
- **align**: `"left"`, `"right"`, `"wide"`, `"full"`
- **html**: `false`
- **background**:
  - backgroundImage: `true`
  - backgroundSize: `true`
- **dimensions**:
  - minHeight: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **color**:
  - gradients: `true`
  - heading: `true`
  - link: `true`
- **layout**:
  - allowEditing: `false`
- **spacing**:
  - blockGap: `true`
  - padding: `true`
  - margin: `true`
- **interactivity**:
  - clientNavigation: `true`
- **allowedBlocks**: `true`

## Block Styles

| Style Name | Label | Default |
|------------|-------|---------|
| `default` | Default | Yes |
| `plain` | Plain | No |

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:quote {"value":""} -->
<!-- Content... -->
<!-- /wp:quote -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/quote/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/quote/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/quote/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/quote/deprecated.js)
