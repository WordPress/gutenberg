# Social Icon

**Name:** `core/social-link`
**Category:** widgets
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Display an icon linking to a social profile or site.

## Block Relationships

**Parent blocks (direct):**
- `core/social-links`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | — | Role: `content` |
| `service` | `string` | — | — |
| `label` | `string` | — | Role: `content` |
| `rel` | `string` | — | — |

## Supports

- **anchor**: `true`
- **reusable**: `false`
- **html**: `false`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `openInNewTab`
- `showLabels`
- `iconColor`
- `iconColorValue`
- `iconBackgroundColor`
- `iconBackgroundColorValue`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:social-link /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-link/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-link/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-link/index.php)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-link/variations.js)
