# Group

**Name:** `core/group`
**Category:** design
**API Version:** 3
**Block Type:** Static (saved in post content)

> Gather blocks in a layout container.

**Keywords:** `container`, `wrapper`, `row`, `section`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `tagName` | `string` | `"div"` | — |
| `templateLock` | `string \| boolean` | — | Enum: `all`, `insert`, `contentOnly`, `false` |

## Supports

- **align**: `"wide"`, `"full"`
- **anchor**: `true`
- **ariaLabel**: `true`
- **html**: `false`
- **background**:
  - backgroundImage: `true`
  - backgroundSize: `true`
  - gradient: `true`
- **color**:
  - gradients: `true`
  - heading: `true`
  - button: `true`
  - link: `true`
- **shadow**: `true`
- **spacing**:
  - margin: `["top","bottom"]`
  - padding: `true`
  - blockGap: `true`
- **dimensions**:
  - minHeight: `true`
- **position**:
  - sticky: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **layout**:
  - allowSizingOnChildren: `true`
- **interactivity**:
  - clientNavigation: `true`
- **allowedBlocks**: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:group {"tagName":"div"} -->
<!-- Content... -->
<!-- /wp:group -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/group/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/group/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/group/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/group/deprecated.js)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/group/variations.js)
