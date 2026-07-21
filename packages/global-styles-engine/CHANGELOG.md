<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Added a private `resolveStyle` API that resolves the merged Global Styles cascade (root, block type, and applied block style variation) for a block, returning the inherited value and a per-leaf source map.
-   Added a private `getVariationStyle` API that returns a block style variation's styles, resolving `{ ref }` references against the Global Styles tree by default (pass `{ resolveRefs: false }` to keep them in place).

## 1.18.0 (2026-07-14)

## 1.17.0 (2026-07-01)
