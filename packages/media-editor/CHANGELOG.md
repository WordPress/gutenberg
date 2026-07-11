<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

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
