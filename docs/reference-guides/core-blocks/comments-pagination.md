# Comments Pagination

**Name:** `core/comments-pagination`
**Category:** theme
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Displays a paginated navigation to next/previous set of comments, when applicable.

## Block Relationships

**Parent blocks (direct):**
- `core/comments`

**Allowed inner blocks:**
- `core/comments-pagination-previous`
- `core/comments-pagination-numbers`
- `core/comments-pagination-next`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `paginationArrow` | `string` | `"none"` | — |

## Supports

- **anchor**: `true`
- **align**: `true`
- **reusable**: `false`
- **html**: `false`
- **color**:
  - gradients: `true`
  - link: `true`
- **layout**:
  - allowSwitching: `false`
  - allowInheriting: `false`
  - default: `{"type":"flex"}`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Provides context:**

- `comments/paginationArrow` → attribute `paginationArrow`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:comments-pagination {"paginationArrow":"none"} -->
<!-- Content... -->
<!-- /wp:comments-pagination -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-pagination/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-pagination/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-pagination/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/comments-pagination/index.php)
