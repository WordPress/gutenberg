<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased


## 1.12.0 (2026-07-29)

### Bug Fixes

-   `expose`: Normalize thrown values that are not `Error` instances (or have an empty message), such as `WebAssembly.Exception`, so they reach the main thread as promise rejections instead of being mistaken for a successful `undefined` result ([#80259](https://github.com/WordPress/gutenberg/issues/80259)).
-   Reject pending RPC calls when the worker fails (`error` / `messageerror` events) or is terminated via `terminate()`, instead of leaving the promises pending forever ([#79955](https://github.com/WordPress/gutenberg/pull/79955)).

## 1.11.0 (2026-07-14)

## 1.10.0 (2026-07-01)

## 1.9.0 (2026-06-24)

## 1.8.1 (2026-06-16)

## 1.8.0 (2026-06-10)

## 1.7.0 (2026-05-27)

## 1.6.0 (2026-05-14)

## 1.5.0 (2026-04-29)

## 1.4.0 (2026-04-15)

## 1.3.0 (2026-04-01)

## 1.2.0 (2026-03-18)

## 1.1.0 (2026-03-04)

## 1.0.0 (2026-02-23)

### New Features

-   Initial release of `@wordpress/worker-threads` package ([#74785](https://github.com/WordPress/gutenberg/pull/74785)).
-   Type-safe Web Worker communication with RPC (Remote Procedure Call).
-   Automatic transferable detection for `ArrayBuffer` and other transferable objects.
-   Error propagation from worker to main thread.
