<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

### Internal

-   Import `withIgnoreIMEEvents` from `@wordpress/keycodes` instead of unlocking it from `@wordpress/components`. Adds a `@wordpress/keycodes` dependency ([#81343](https://github.com/WordPress/gutenberg/pull/81343)).
-   Update `exports` to use subpath patterns instead of deprecated trailing `/` folder mappings ([#80270](https://github.com/WordPress/gutenberg/pull/80270)).
-   Use the `.jsx` extension for JavaScript source files that contain JSX ([#80990](https://github.com/WordPress/gutenberg/pull/80990)).

## 0.1.0 (2025-10-23)

Initial release.
