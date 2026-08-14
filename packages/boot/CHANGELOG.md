<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

-   Translate the click-to-edit label on a previewed canvas, and name the action rather than the gesture ([#81620](https://github.com/WordPress/gutenberg/pull/81620)).

### Enhancements

-   Contain a failure to the surface it happened in, so a stage, inspector or canvas that throws leaves the rest of the screen working ([#81622](https://github.com/WordPress/gutenberg/pull/81622)).

### Enhancements

-   Warn before leaving the page with unsaved changes ([#81625](https://github.com/WordPress/gutenberg/pull/81625)).

-   Add a `stage` visibility function to a route's config, mirroring `inspector`, so a route can hide its stage and leave the canvas to fill the surfaces area.
-   Pass the editor's entity navigation callbacks from the canvas, so a template part or synced pattern can be opened from the block inspector and navigated back out of, restoring the block that was selected ([#81590](https://github.com/WordPress/gutenberg/pull/81590)).
-   Add `registerEntityLinks` and `getEntityLink`, so an application declares where each post type is listed and edited and the canvas resolves every link through them ([#81590](https://github.com/WordPress/gutenberg/pull/81590)).
-   Run the editor's post actions from the canvas, returning to the list when an entity is trashed or deleted and offering a way to reach a duplicate ([#81590](https://github.com/WordPress/gutenberg/pull/81590)).

### Breaking Changes

-   Remove `editLink` from a route's canvas data. Register the post type's `edit` path with `registerEntityLinks` instead ([#81590](https://github.com/WordPress/gutenberg/pull/81590)).

## 0.20.0 (2026-08-12)

### Bug Fixes

-   Adjust the specificity of the responsive image default in the layout container so components can size their own images ([#80845](https://github.com/WordPress/gutenberg/pull/80845)).
-   Ignore `updateMenuItem` for menu items that were never registered, instead of adding a partial entry that renders as an empty navigation row ([#81581](https://github.com/WordPress/gutenberg/pull/81581)).

## 0.19.0 (2026-07-29)

## 0.18.0 (2026-07-14)

### Enhancements

-   Use the emphasis font-weight token for UI emphasis ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).
-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 0.17.0 (2026-07-01)

## 0.16.0 (2026-06-24)

### Enhancements

-   `initSinglePage` now accepts an `initModules` option and runs page init modules before rendering, matching `init`.

## 0.15.1 (2026-06-16)

## 0.15.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
