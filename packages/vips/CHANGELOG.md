<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

- Add `getUltraHdrInfo` for probing UltraHDR (ISO 21496-1 gain map) JPEGs and an `isUltraHdr` flag on `resizeImage` that routes through `uhdrloadBuffer`/`uhdrsaveBuffer` so the gain map is preserved through resize ([#74873](https://github.com/WordPress/gutenberg/pull/74873)).
- Bump `wasm-vips` to `^0.0.17` for native UltraHDR support ([#74873](https://github.com/WordPress/gutenberg/pull/74873)).

## 1.5.0 (2026-04-29)

## 1.4.0 (2026-04-15)

## 1.3.0 (2026-04-01)

## 1.2.0 (2026-03-18)

## 1.1.0 (2026-03-04)

## 1.0.0 (2026-02-23)

### New Features

-   Initial release of `@wordpress/vips` package for client-side image processing using `wasm-vips` ([#74785](https://github.com/WordPress/gutenberg/pull/74785)).
-   Uses `@wordpress/worker-threads` for type-safe Web Worker communication.
-   ESM-only package with inlined WASM bundling.
