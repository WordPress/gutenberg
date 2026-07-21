<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Added a private `resolveStyle` API that resolves the merged Global Styles cascade (root, root-level element layers, block type, and applied block style variation) for a block, returning the inherited value and a per-leaf source map. Element layers are supplied by the caller as an ordered `elements` list on the resolve context (low to high precedence, e.g. `[ 'heading', 'h2' ]`), keeping the engine agnostic of block-to-element mappings.
-   Added a private `getVariationStyle` API that returns a block style variation's styles, resolving `{ ref }` references against the Global Styles tree by default (pass `{ resolveRefs: false }` to keep them in place).

## 1.18.0 (2026-07-14)

## 1.17.0 (2026-07-01)
