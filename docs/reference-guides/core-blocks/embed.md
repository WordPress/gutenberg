# Embed

**Name:** `core/embed`
**Category:** embed
**API Version:** 3
**Block Type:** Static (saved in post content)

> Add a block that displays content pulled from other sites, like Twitter or YouTube.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | — | Role: `content` |
| `caption` | `rich-text` | — | Source: `rich-text`. Selector: `figcaption`. Role: `content` |
| `type` | `string` | — | Role: `content` |
| `providerNameSlug` | `string` | — | Role: `content` |
| `allowResponsive` | `boolean` | `true` | — |
| `responsive` | `boolean` | `false` | Role: `content` |
| `previewable` | `boolean` | `true` | Role: `content` |

## Supports

- **anchor**: `true`
- **align**: `true`
- **spacing**:
  - margin: `true`
- **interactivity**:
  - clientNavigation: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:embed {"allowResponsive":true,"responsive":false,"previewable":true} -->
<!-- Content... -->
<!-- /wp:embed -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/embed/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/embed/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/embed/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/embed/deprecated.js)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/embed/variations.js)
