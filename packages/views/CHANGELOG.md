<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

-   `useViewConfig`: request the full configuration under the same cache key as `getViewConfig( kind, name )`, so a route loader that preloads it no longer triggers a second request. ([#82141](https://github.com/WordPress/gutenberg/pull/82141))
-   `useView`, `loadView`: ignore a persisted layout `type` that `defaultLayouts` does not offer, resolving the type out of the layers below instead. DataViews renders nothing for a layout it is not given, so a preference saved when a screen still offered that layout used to leave the screen empty, with no way to reset it. Such a type does not count as a modification and is written out of the preference on the next update. ([#82457](https://github.com/WordPress/gutenberg/pull/82457))

## 1.21.0 (2026-08-26)

### Internal

-   Point tsconfig references at split dependencies' build projects. ([#81515](https://github.com/WordPress/gutenberg/pull/81515))
-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))

## 1.20.0 (2026-08-12)

### Bug Fixes

-   `useView`, `loadView`. Resolve the view as a stack of layers — `defaultView`, `defaultLayouts` (for the effective type), `activeViewOverrides`, the user's preference, and the URL query params — and persist only the properties the user actually modified. Previously the whole view was persisted, so a later change to any of the lower layers stopped showing through, an override could bounce back a value the user had picked, and a partial `sort` or `layout` override marked the view as modified forever. `page` and `search` are now sourced from the URL alone, and `layout`, `groupBy` and `sort` merge leaf by leaf, so an override for one field's styles no longer wipes the other fields'. Persisted modifications that happen to coincide with the current view's base are retained on update, so a change made in one view no longer drops a pick made in another view sharing the preference. [#80832](https://github.com/WordPress/gutenberg/pull/80832)

### Internal

-   Remove obsolete dependency grouping comments as part of the repository-wide separator-free import migration. ([#81248](https://github.com/WordPress/gutenberg/pull/81248))
-   Add `react` and `react-dom` to the package's dev dependencies, so the tests resolve them from the package rather than relying on a hoisted install. [#81139](https://github.com/WordPress/gutenberg/pull/81139)

## 1.19.0 (2026-07-29)

## 1.18.0 (2026-07-14)

## 1.17.0 (2026-07-01)
