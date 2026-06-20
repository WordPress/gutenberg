<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

- Bump `wasm-vips` to `^0.0.18`, adding native decoding of 10- and 12-bit (high bit depth) AVIF images ([#79179](https://github.com/WordPress/gutenberg/pull/79179)).

## 2.1.1 (2026-06-16)

## 2.1.0 (2026-06-10)

### New Features

- Add `getUltraHdrInfo` for probing UltraHDR (ISO 21496-1 gain map) JPEGs ([#74873](https://github.com/WordPress/gutenberg/pull/74873)).
- Preserve UltraHDR gain maps through `resizeImage`: libvips's `uhdrload`/`uhdrsave` priority is leveraged automatically, the save path keeps `icc|gainmap` metadata, and positional crop now also crops the attached gain map ([#74873](https://github.com/WordPress/gutenberg/pull/74873)).
- Bump `wasm-vips` to `^0.0.17` for native UltraHDR support ([#74873](https://github.com/WordPress/gutenberg/pull/74873)).

## 2.0.0 (2026-05-27)

### Breaking Changes

-   Remove unused `batchResizeImage` and `vipsBatchResizeImage` exports. The concurrent sideload pipeline (introduced in [#75888](https://github.com/WordPress/gutenberg/pull/75888)) generates each sub-size through its own queued resize/upload operation, so the single-pass batch path no longer has any callers ([#77247](https://github.com/WordPress/gutenberg/issues/77247)).

## 1.6.0 (2026-05-14)

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
