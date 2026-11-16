# API Versions

This document lists the changes made between the different API versions.

## Version 3 (>= WordPress 6.3)

-   WordPress 6.3 introduced the iframed post editor when all registered blocks use Block API version 3 or higher and no traditional meta boxes are present.
-   WordPress 7.0 evaluates the blocks in the post content instead of all registered blocks when deciding whether to use the iframe.
-   Gutenberg 23.6 and WordPress 7.1 always use the iframe for the post editor, regardless of the `apiVersion` of the blocks in the post content.

Adding version 3 support means that a block should work inside an iframe. Refer to the [iframe editor migration guide](/docs/reference-guides/block-api/block-api-versions/block-migration-for-iframe-editor-compatibility.md) for testing and migration guidance.

## Version 2 (>= WordPress 5.6)

-   To render the block element wrapper for the block's `edit` implementation, the block author must use the `useBlockProps()` hook.
-   The generated class names and styles are no longer added automatically to the saved markup for static blocks when `save` is processed. To include them, the block author must explicitly use `useBlockProps.save()` and add to their block wrapper.

## Version 1

Initial version.
