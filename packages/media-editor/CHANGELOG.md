<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Add `scaledSize` to the cropper state and a `setScaledSize` setter, for scaling the whole image down before a crop is taken. `buildModifiers` emits the matching `resize` modifier first ([#81461](https://github.com/WordPress/gutenberg/pull/81461)).
-   Add linked width and height fields to the Crop panel for scaling the image, with the resulting saved size shown when a crop is in play ([#81461](https://github.com/WordPress/gutenberg/pull/81461)).
-   Cap the Crop panel's scale fields at the original dimensions, and offer a Reset to original size link once the image has been scaled ([#81461](https://github.com/WordPress/gutenberg/pull/81461)).

### Bug Fixes

-   The undo shortcut now leaves the browser's own undo alone in any field you can type into, rather than only in fields outside a crop control region ([#81461](https://github.com/WordPress/gutenberg/pull/81461)).
-   The crop handle tooltip now reports dimensions against the scaled image, matching the saved size shown in the Crop panel ([#81461](https://github.com/WordPress/gutenberg/pull/81461)).

## 0.15.0 (2026-07-29)

## 0.14.0 (2026-07-14)

### Enhancements

-   Use the emphasis font-weight token for UI emphasis ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).
-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

-   `useAriaAnnouncer`: Update to use `speak` for screen reader announcements instead of an inline `aria-live` region. ([#79600](https://github.com/WordPress/gutenberg/pull/79600))

## 0.13.0 (2026-07-01)

## 0.12.0 (2026-06-24)

## 0.11.1 (2026-06-16)

## 0.11.0 (2026-06-10)

### Bug Fixes

-   Media Editor: Stop the details/crop sidebar overflowing the modal between the small and medium breakpoints.
-   Media Editor: Remove the lag when toggling the details/crop sidebar open or closed.

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
