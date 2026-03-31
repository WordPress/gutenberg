# Accordion Panel

**Name:** `core/accordion-panel`
**Category:** design
**API Version:** 3
**Block Type:** Static (saved in post content)

> Contains the hidden or revealed content beneath the heading.

## Block Relationships

**Parent blocks (direct):**
- `core/accordion-item`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `templateLock` | `string \| boolean` | `false` | Enum: `all`, `insert`, `contentOnly`, `false` |

## Supports

- **html**: `false`
- **color**:
  - background: `true`
  - gradients: `true`
- **interactivity**: `true`
- **spacing**:
  - padding: `true`
  - blockGap: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **shadow**: `true`
- **layout**:
  - allowEditing: `false`
- **visibility**: `false`
- **contentRole**: `true`
- **allowedBlocks**: `true`
- **lock**: `false`

## Context

**Uses context:**

- `core/accordion-open-by-default`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:accordion-panel {"templateLock":false} -->
<!-- Content... -->
<!-- /wp:accordion-panel -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/accordion-panel/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/accordion-panel/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/accordion-panel/save.js)
