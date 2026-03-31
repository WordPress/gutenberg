# Spacer

**Name:** `core/spacer`
**Category:** design
**API Version:** 3
**Block Type:** Static (saved in post content)

> Add white space between blocks and customize its height.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `height` | `string` | `"100px"` | — |
| `width` | `string` | — | — |

## Supports

- **anchor**: `true`
- **spacing**:
  - margin: `["top","bottom"]`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `orientation`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:spacer {"height":"100px"} -->
<!-- Content... -->
<!-- /wp:spacer -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/spacer/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/spacer/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/spacer/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/spacer/deprecated.js)
