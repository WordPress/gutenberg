<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Add a `scope` prop to `MediaEditor` so each frame can keep its own persisted details-sidebar visibility ([#81559](https://github.com/WordPress/gutenberg/pull/81559)).

### Bug Fixes

-   Keep initial focus on the modal dialog frame instead of moving it to the crop area once the image loads ([#81541](https://github.com/WordPress/gutenberg/pull/81541)).

## 0.16.0 (2026-08-12)


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
