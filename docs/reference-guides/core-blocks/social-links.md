# Social Icons

**Name:** `core/social-links`
**Category:** widgets
**API Version:** 3
**Block Type:** Static (saved in post content)

> Display icons linking to your social profiles or sites.

**Keywords:** `links`

## Block Relationships

**Allowed inner blocks:**
- `core/social-link`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `iconColor` | `string` | — | — |
| `customIconColor` | `string` | — | — |
| `iconColorValue` | `string` | — | — |
| `iconBackgroundColor` | `string` | — | — |
| `customIconBackgroundColor` | `string` | — | — |
| `iconBackgroundColorValue` | `string` | — | — |
| `openInNewTab` | `boolean` | `false` | — |
| `showLabels` | `boolean` | `false` | — |
| `size` | `string` | — | — |

## Supports

- **align**: `"left"`, `"center"`, `"right"`
- **anchor**: `true`
- **html**: `false`
- **layout**:
  - allowSwitching: `false`
  - allowInheriting: `false`
  - allowVerticalAlignment: `false`
  - default: `{"type":"flex"}`
- **color**:
  - enableContrastChecker: `false`
  - background: `true`
  - gradients: `true`
  - text: `false`
- **spacing**:
  - blockGap: `["horizontal","vertical"]`
  - margin: `true`
  - padding: `true`
  - units: `["px","em","rem","vh","vw"]`
- **interactivity**:
  - clientNavigation: `true`
- **contentRole**: `true`
- **listView**: `true`

## Context

**Provides context:**

- `openInNewTab` → attribute `openInNewTab`
- `showLabels` → attribute `showLabels`
- `iconColor` → attribute `iconColor`
- `iconColorValue` → attribute `iconColorValue`
- `iconBackgroundColor` → attribute `iconBackgroundColor`
- `iconBackgroundColorValue` → attribute `iconBackgroundColorValue`

## Block Styles

| Style Name | Label | Default |
|------------|-------|---------|
| `default` | Default | Yes |
| `logos-only` | Logos Only | No |
| `pill-shape` | Pill Shape | No |

## Block Markup

This is a **static block**. The markup is saved directly in the post content.

```html
<!-- wp:social-links {"openInNewTab":false,"showLabels":false} -->
<!-- Content... -->
<!-- /wp:social-links -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-links/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-links/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-links/save.js)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/social-links/deprecated.js)
