<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

-   `getResolvedValue`: Return a copy when resolving a theme-relative (`file:./…`) URL instead of writing the resolved URL onto the given object, which could be the caller's own value or, via a `ref`, an object aliased by the user or theme config ([#82278](https://github.com/WordPress/gutenberg/pull/82278)).

## 1.21.0 (2026-08-26)

### Bug Fixes

-   Use the row block spacing value for Flow and Constrained layouts when Global Styles defines separate row and column values ([#81476](https://github.com/WordPress/gutenberg/pull/81476)).
-   Generate SVG filters for user-defined duotone presets, not just theme and default ones. A duotone a user had created rendered on the front end but had no filter in the editor, so applying it showed no preview ([#81605](https://github.com/WordPress/gutenberg/pull/81605)).

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))

## 1.20.0 (2026-08-12)

### Bug Fixes

-   Report changes to site-wide border, shadow, outline, filter and dimensions in the global styles changelist. These are rendered by the styles engine but were not compared, so changing only one of them was reported as no change at all ([#81407](https://github.com/WordPress/gutenberg/pull/81407)).
-   Render block element styles defined only inside responsive viewport states.
## 1.19.0 (2026-07-29)

### Internal

-   Update `memize` to 2.1.1 ([#80764](https://github.com/WordPress/gutenberg/pull/80764)).

### Bug Fixes

-   Wrap block-level preset class selectors in `:where()` so they keep the same `0-1-0` specificity as root-level presets, preventing block-level palettes (e.g. via the `wp_theme_json_data_theme` filter) from overriding responsive state styles ([#80580](https://github.com/WordPress/gutenberg/issues/80580)).

### New Features

-   Added a private `resolveStyle` API that resolves the merged Global Styles cascade (root, block type, and applied block style variation) for a block, returning the inherited value and a per-leaf source map.
-   Added a private `getVariationStyle` API that returns a block style variation's styles, resolving `{ ref }` references against the Global Styles tree by default (pass `{ resolveRefs: false }` to keep them in place).
-   `resolveStyle` now folds root-level element layers, supplied by the caller as an ordered `elements` list on the resolve context (low to high precedence, e.g. `[ 'heading', 'h2' ]`), keeping the engine agnostic of block-to-element mappings ([#80495](https://github.com/WordPress/gutenberg/pull/80495)).

## 1.18.0 (2026-07-14)

## 1.17.0 (2026-07-01)
