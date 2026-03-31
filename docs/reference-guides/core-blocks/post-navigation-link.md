# Post Navigation Link

**Name:** `core/post-navigation-link`
**Category:** theme
**API Version:** 3
**Block Type:** Dynamic (server-rendered)

> Displays the next or previous post link that is adjacent to the current post.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `string` | `"next"` | — |
| `label` | `string` | — | Role: `content` |
| `showTitle` | `boolean` | `false` | — |
| `linkLabel` | `boolean` | `false` | — |
| `arrow` | `string` | `"none"` | — |
| `taxonomy` | `string` | `""` | — |

## Supports

- **anchor**: `true`
- **reusable**: `false`
- **html**: `false`
- **color**:
  - link: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`
  - textAlign: `true`
- **interactivity**:
  - clientNavigation: `true`

## Context

**Uses context:**

- `postType`

## Block Markup

This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.

In post content, it is stored as a block comment:

```html
<!-- wp:post-navigation-link {"type":"next","showTitle":false,"linkLabel":false,"arrow":"none","taxonomy":""} /-->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-navigation-link/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-navigation-link/edit.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-navigation-link/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-navigation-link/deprecated.js)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/post-navigation-link/variations.js)
