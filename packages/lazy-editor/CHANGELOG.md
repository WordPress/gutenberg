# Changelog

## Unreleased

### Bug Fixes

-   Add the styles a host passes to the theme's and the user's instead of replacing them, so an editor canvas keeps the CSS a theme registers with `add_editor_style` ([#81747](https://github.com/WordPress/gutenberg/pull/81747)).
-   Render the editor preferences modal, so the Preferences menu item and command open it ([#81630](https://github.com/WordPress/gutenberg/pull/81630)).

### Performance

-   Memoize the generated global stylesheet, which walks every registered block, instead of rebuilding it on each render ([#81747](https://github.com/WordPress/gutenberg/pull/81747)).

## 1.19.0 (2026-08-12)


## 1.18.0 (2026-07-29)

## 1.17.0 (2026-07-14)

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 1.16.0 (2026-07-01)

## 1.15.0 (2026-06-24)

## 1.14.1 (2026-06-16)

## 1.14.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

## 1.13.0 (2026-05-27)

## 1.12.0 (2026-05-14)

## 1.11.0 (2026-04-29)

## 1.10.0 (2026-04-15)

## 1.9.0 (2026-04-01)

## 1.8.0 (2026-03-18)

## 1.7.0 (2026-03-04)

## 1.6.0 (2026-02-18)

## 1.5.0 (2026-01-29)

## 1.4.0 (2026-01-16)

## 1.2.0 (2025-11-26)

## 1.1.0 (2025-11-12)

### New Features

-   Initial release of lazy-editor package.
