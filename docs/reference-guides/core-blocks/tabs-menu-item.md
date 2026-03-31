# Tab Menu Item

**Name:** `core/tabs-menu-item`
**Category:** design
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> A single tab button in the tabs menu.

## Block Relationships

**Parent blocks (direct):**
- `core/tabs-menu`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `anchor` | `string` | `""` | — |

## Supports

- **html**: `false`
- **reusable**: `false`
- **lock**: `false`
- **color**:
  - background: `true`
  - text: `true`
- **typography**:
  - fontSize: `true`
  - textAlign: `true`
- **spacing**:
  - padding: `true`
- **layout**:
  - allowEditing: `false`

## Context

**Uses context:**

- `core/tabs-list`
- `core/tabs-activeTabIndex`
- `core/tabs-editorActiveTabIndex`
- `core/tabs-menu-item-index`
- `core/tabs-menu-item-id`
- `core/tabs-menu-item-label`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:tabs-menu-item {"anchor":""} -->
<!-- Content... -->
<!-- /wp:tabs-menu-item -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tabs-menu-item/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tabs-menu-item/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tabs-menu-item/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tabs-menu-item/index.php)
