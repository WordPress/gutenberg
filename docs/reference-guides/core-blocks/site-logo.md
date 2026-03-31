# Site Logo

**Name:** `core/site-logo`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Display an image to represent this site. Update this block and the changes apply everywhere.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | `number` | — | — |
| `isLink` | `boolean` | `true` | Role: `content` |
| `linkTarget` | `string` | `"_self"` | Role: `content` |
| `shouldSyncIcon` | `boolean` | — | — |

## Supports

- **anchor**: `true`
- **html**: `false`
- **align**: `true`
- **alignWide**: `false`
- **color**:
  - text: `false`
  - background: `false`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **interactivity**:
  - clientNavigation: `true`
- **filter**:
  - duotone: `true`

## Block Styles

| Style Name | Label | Default |
|------------|-------|---------|
| `default` | Default | Yes |
| `rounded` | Rounded | No |

## CSS Selectors

- **filter**:
  - duotone: `.wp-block-site-logo img, .wp-block-site-logo .components-placeholder__illustration, .wp-block-site-logo .components-placeholder::before`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:site-logo {"isLink":true,"linkTarget":"_self"} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/site-logo/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/site-logo/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/site-logo/index.php)
