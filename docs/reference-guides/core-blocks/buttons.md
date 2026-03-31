# Buttons

**Name:** `core/buttons`
**Category:** design
**API Version:** 3
**Block Type:** Static (saved in post content)

> Prompt visitors to take action with a group of button-style links.

**Keywords:** `link`

## Block Relationships

**Allowed inner blocks:**
- `core/button`

## Attributes

_This block has no custom attributes._

## Supports

- **anchor**: `true`
- **align**: `"wide"`, `"full"`
- **html**: `false`
- **color**:
  - gradients: `true`
  - text: `false`
- **spacing**:
  - blockGap: `["horizontal","vertical"]`
  - padding: `true`
  - margin: `["top","bottom"]`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **layout**:
  - allowSwitching: `false`
  - allowInheriting: `false`
  - default: `{"type":"flex"}`
- **interactivity**:
  - clientNavigation: `true`
- **listView**: `true`
- **contentRole**: `true`

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:buttons -->
<!-- Content... -->
<!-- /wp:buttons -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/buttons/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/buttons/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/buttons/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/buttons/deprecated.js)
