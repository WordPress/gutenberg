# Navigation

**Name:** `core/navigation`
**Category:** theme
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> A collection of blocks that allow visitors to get around your site.

**Keywords:** `menu`, `navigation`, `links`

## Block Relationships

**Allowed inner blocks:**
- `core/navigation-link`
- `core/search`
- `core/social-links`
- `core/page-list`
- `core/spacer`
- `core/home-link`
- `core/icon`
- `core/site-title`
- `core/site-logo`
- `core/navigation-submenu`
- `core/loginout`
- `core/buttons`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `ref` | `number` | — | — |
| `textColor` | `string` | — | — |
| `customTextColor` | `string` | — | — |
| `rgbTextColor` | `string` | — | — |
| `backgroundColor` | `string` | — | — |
| `customBackgroundColor` | `string` | — | — |
| `rgbBackgroundColor` | `string` | — | — |
| `showSubmenuIcon` | `boolean` | `true` | — |
| `submenuVisibility` | `string` | `"hover"` | Enum: `hover`, `click`, `always` |
| `overlayMenu` | `string` | `"mobile"` | — |
| `overlay` | `string` | — | — |
| `icon` | `string` | `"handle"` | — |
| `hasIcon` | `boolean` | `true` | — |
| `__unstableLocation` | `string` | — | — |
| `overlayBackgroundColor` | `string` | — | — |
| `customOverlayBackgroundColor` | `string` | — | — |
| `overlayTextColor` | `string` | — | — |
| `customOverlayTextColor` | `string` | — | — |
| `maxNestingLevel` | `number` | `5` | — |
| `templateLock` | `string \| boolean` | — | Enum: `all`, `insert`, `contentOnly`, `false` |

## Supports

- **anchor**: `true`
- **align**: `"wide"`, `"full"`
- **ariaLabel**: `true`
- **contentRole**: `true`
- **html**: `false`
- **inserter**: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
- **spacing**:
  - blockGap: `true`
  - units: `["px","em","rem","vh","vw"]`
- **layout**:
  - allowSwitching: `false`
  - allowInheriting: `false`
  - allowVerticalAlignment: `false`
  - allowSizingOnChildren: `true`
  - default: `{"type":"flex"}`
- **interactivity**: `true`
- **renaming**: `false`

## Context

**Provides context:**

- `textColor` → attribute `textColor`
- `customTextColor` → attribute `customTextColor`
- `backgroundColor` → attribute `backgroundColor`
- `customBackgroundColor` → attribute `customBackgroundColor`
- `overlayTextColor` → attribute `overlayTextColor`
- `customOverlayTextColor` → attribute `customOverlayTextColor`
- `overlayBackgroundColor` → attribute `overlayBackgroundColor`
- `customOverlayBackgroundColor` → attribute `customOverlayBackgroundColor`
- `fontSize` → attribute `fontSize`
- `customFontSize` → attribute `customFontSize`
- `showSubmenuIcon` → attribute `showSubmenuIcon`
- `submenuVisibility` → attribute `submenuVisibility`
- `openSubmenusOnClick` → attribute `openSubmenusOnClick`
- `style` → attribute `style`
- `maxNestingLevel` → attribute `maxNestingLevel`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:navigation {"showSubmenuIcon":true,"submenuVisibility":"hover","overlayMenu":"mobile","icon":"handle","hasIcon":true,"maxNestingLevel":5} -->
<!-- Content... -->
<!-- /wp:navigation -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation/block.json)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/navigation/deprecated.js)
