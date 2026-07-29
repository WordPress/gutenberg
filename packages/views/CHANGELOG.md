<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

-   `useView`: apply `type`, `perPage`, and `fields` from active view overrides (e.g. the server-provided `view_list` config) while the view still matches the default view, so user modifications win ([#80778](https://github.com/WordPress/gutenberg/issues/80778)).
-   `useView`, `loadView`: apply the `defaultLayouts` entry of the type resolved after overrides, instead of the pre-override type ([#80778](https://github.com/WordPress/gutenberg/issues/80778)).
-   `useView`: let users modify unlocked filters provided by active view overrides; locked filters keep replacing same-field filters ([#80778](https://github.com/WordPress/gutenberg/issues/80778)).

## 1.18.0 (2026-07-14)

## 1.17.0 (2026-07-01)
