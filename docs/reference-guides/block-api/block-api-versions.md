# API Versions

This document lists the changes made between the different API versions.

## Version 3 (>= WordPress 6.3)
- The post editor will be iframed if all registered blocks have a Block API version 3 or higher. Adding version 3 support means that the block should work inside an iframe, though the block may still be rendered outside the iframe if not all blocks support version 3.

## Version 2 (>= WordPress 5.6)

-   To render the block element wrapper for the block's `edit` implementation, the block author must use the `useBlockProps()` hook.
-   The generated class names and styles are no longer added automatically to the saved markup for static blocks when `save` is processed. To include them, the block author must explicitly use `useBlockProps.save()` and add to their block wrapper.

## Version 1

Initial version.
