<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add on-demand JPEG XL (JXL) support. `setJxlWasmUrl()` lets the main thread feed a lazily loaded `vips-jxl.wasm` URL to the worker, which re-initializes vips with JXL dynamic library support on the next operation. Keeps JXL out of the worker bundle so it is only downloaded when a JXL image is processed.

## 1.4.0 (2026-04-15)

## 1.3.0 (2026-04-01)

## 1.2.0 (2026-03-18)

## 1.1.0 (2026-03-04)

## 1.0.0 (2026-02-23)

### New Features

-   Initial release of `@wordpress/vips` package for client-side image processing using `wasm-vips` ([#74785](https://github.com/WordPress/gutenberg/pull/74785)).
-   Uses `@wordpress/worker-threads` for type-safe Web Worker communication.
-   ESM-only package with inlined WASM bundling.
