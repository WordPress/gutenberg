# Block API Versions

This document lists the changes made between the different API versions.

## Version 2 (>= WordPress 5.6)

- Moves the responsibility to render the block element wrapper in the editor to the block author using the `useBlockProps()` hook.
- Generates classnames and styles are not added automatically to the saved markup for static blocks, block authors are required to explicitely use `useBlockProps.save()` in their `save` functions to retrieve the generated classes and styles to apply on the block wrapper.

## Version 1

Initial version.