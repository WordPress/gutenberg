# Form

**Name:** `core/form`
**Category:** common
**API Version:** 3
**Block Type:** Hybrid (static save + server enhancements)

> A form.

**Keywords:** `container`, `wrapper`, `row`, `section`

## Block Relationships

**Allowed inner blocks:**
- `core/paragraph`
- `core/heading`
- `core/form-input`
- `core/form-submit-button`
- `core/form-submission-notification`
- `core/group`
- `core/columns`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `submissionMethod` | `string` | `"email"` | — |
| `method` | `string` | `"post"` | — |
| `action` | `string` | — | — |
| `email` | `string` | — | — |

## Supports

- **anchor**: `true`
- **color**:
  - gradients: `true`
  - link: `true`
- **spacing**:
  - margin: `true`
  - padding: `true`
- **typography**:
  - fontSize: `true`
  - lineHeight: `true`

## Block Markup

This is a **hybrid block**. It saves static markup that the server may enhance during rendering.

```html
<!-- wp:form {"submissionMethod":"email","method":"post"} -->
<!-- Content... -->
<!-- /wp:form -->
```

## Source

- [block.json](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/form/block.json)
- [edit.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/form/edit.js)
- [save.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/form/save.js)
- [index.php](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/form/index.php)
- [deprecated.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/form/deprecated.js)
- [variations.js](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/form/variations.js)
