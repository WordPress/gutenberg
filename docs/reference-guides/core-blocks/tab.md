# Tab

**Name:** `core/tab`
**Category:** design
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> Content for a tab in a tabbed interface.

## Block Relationships

**Parent blocks (direct):**
- `core/tab-panel`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | `""` | — |

## Supports

- **anchor**: `true`
- **html**: `false`
- **reusable**: `false`
- **color**:
  - background: `true`
  - text: `true`
- **layout**: `true`
- **spacing**:
  - blockGap: `true`
  - padding: `true`
  - margin: `false`
- **typography**:
  - fontSize: `true`
- **renaming**: `true`

## Context

**Uses context:**

- `core/tabs-activeTabIndex`
- `core/tabs-editorActiveTabIndex`
- `core/tabs-id`

**Provides context:**

- `core/tab-label` → attribute `label`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:tab {"label":""} -->
<!-- Content... -->
<!-- /wp:tab -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tab/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tab/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tab/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/tab/index.php)
