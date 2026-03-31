# Accordion Heading

**Name:** `core/accordion-heading`
**Category:** design
**API Version:** 3
**Block Type:** Static (saved in post content)

> Displays a heading that toggles the accordion panel.

## Block Relationships

**Parent blocks (direct):**
- `core/accordion-item`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `openByDefault` | `boolean` | `false` | — |
| `title` | `rich-text` | — | Source: `rich-text`. Selector: `.wp-block-accordion-heading__toggle-title`. Role: `content` |
| `level` | `number` | — | — |
| `iconPosition` | `string` | `"right"` | Enum: `left`, `right` |
| `showIcon` | `boolean` | `true` | — |

## Supports

- **anchor**: `true`
- **color**:
  - background: `true`
  - gradients: `true`
- **align**: `false`
- **interactivity**: `true`
- **spacing**:
  - padding: `true`
- **typography**:
  - fontSize: `true`
- **shadow**: `true`
- **visibility**: `false`
- **lock**: `false`

## Context

**Uses context:**

- `core/accordion-icon-position`
- `core/accordion-show-icon`
- `core/accordion-heading-level`

## CSS Selectors

- **typography**:
  - letterSpacing: `.wp-block-accordion-heading .wp-block-accordion-heading__toggle-title`
  - textDecoration: `.wp-block-accordion-heading .wp-block-accordion-heading__toggle-title`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:accordion-heading {"openByDefault":false,"iconPosition":"right","showIcon":true} -->
<!-- Content... -->
<!-- /wp:accordion-heading -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/accordion-heading/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/accordion-heading/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/accordion-heading/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/accordion-heading/deprecated.js)
