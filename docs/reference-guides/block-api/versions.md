# Block API Versions

This document lists the changes made between the different API versions.

## Version 2 (>= WordPress 5.6)

-   To render the block element wrapper for the block's `edit` implementation, the block author must use the `useBlockProps()` hook.
-   The generated class names and styles are no longer added automatically to the saved markup for static blocks when `save` is processed. To include them, the block author must explicitly use `useBlockProps.save()` and add to their block wrapper.

## Version 1

Initial version.
