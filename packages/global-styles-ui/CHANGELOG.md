<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

-   Background panels: Resolve theme-relative (`file:./…`) background image URLs and `ref` pointers before rendering thumbnails and the focal point picker. The screens render inside the package's own `BlockEditorProvider`, which cannot carry the private settings the panels previously resolved these against ([#82242](https://github.com/WordPress/gutenberg/pull/82242)).

### Internal

-   Remove unused dependency `change-case` ([#82103](https://github.com/WordPress/gutenberg/pull/82103)).

## 1.21.0 (2026-08-26)

### Bug Fixes

-   Font Library: Leave a `var()` custom property unquoted in the font previews, so a theme that sets `fontFamily` to a custom property previews in the right font ([#82010](https://github.com/WordPress/gutenberg/pull/82010)).
-   Revisions: close the screen on the first click of the back arrow after a revision has been selected, instead of requiring a second click ([#81897](https://github.com/WordPress/gutenberg/pull/81897)).
-   Revisions: close the screen after applying a revision, which stopped happening when the screen moved into this package ([#81897](https://github.com/WordPress/gutenberg/pull/81897)).
-   Color palette panel: do not render the theme colors wrapper when the theme provides no colors, which left an empty gap above the Custom section ([#81894](https://github.com/WordPress/gutenberg/pull/81894)).
-   Font Library: Resolve variable font weight ranges to a single value so the previews no longer fall back to the surrounding font weight ([#81748](https://github.com/WordPress/gutenberg/pull/81748)).

### Enhancements

-   Expose typography and color controls for citations, inputs, and selects in Global Styles ([#80852](https://github.com/WordPress/gutenberg/pull/80852)).
-   Mark blocks that have user styles in the block list, and add a filter to show only those blocks ([#81373](https://github.com/WordPress/gutenberg/pull/81373)).
-   Add a Duotone tab to the Edit palette screen, so theme and default duotones can be edited and custom duotones added, alongside Color and Gradient. Replaces the read-only duotone list previously shown at the bottom of the Gradient tab ([#81605](https://github.com/WordPress/gutenberg/pull/81605)).
-   Font Library: Add a skeleton loader for the font preview images ([#81047](https://github.com/WordPress/gutenberg/pull/81047)).

### Bug Fixes

-   Shadow editor: Group each row as one item so separators do not cross row actions ([#81871](https://github.com/WordPress/gutenberg/pull/81871)).

### Internal

-   Exclude the JavaScript tests and story from the build project so their declarations are not published. ([#81516](https://github.com/WordPress/gutenberg/pull/81516))

## 1.20.0 (2026-08-12)

### Internal

-   Font Library: Use the new `@wordpress/kebab-case` package instead of unlocking the `kebabCase` utility from the `@wordpress/components` private APIs ([#81294](https://github.com/WordPress/gutenberg/pull/81294)).

### Enhancements

-   Add a `showBlockStateControls` prop to `GlobalStylesUI`, defaulting to `true`, which hides the state controls for blocks when set to `false` ([#80956](https://github.com/WordPress/gutenberg/pull/80956)).

## 1.19.0 (2026-07-29)

### Bug Fixes

-   Font Library: Give the "Install fonts" search field a fixed width so it no longer resizes when the reset button appears or disappears as the search value changes ([#80315](https://github.com/WordPress/gutenberg/pull/80315)).

### Internal

-   Update `exports` to use subpath patterns instead of deprecated trailing `/` folder mappings ([#80270](https://github.com/WordPress/gutenberg/pull/80270)).

## 1.18.0 (2026-07-14)

### Enhancements

-   Use the emphasis font-weight token for UI emphasis ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).
-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 1.17.0 (2026-07-01)

## 1.16.0 (2026-06-24)

## 1.15.1 (2026-06-16)

## 1.15.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
