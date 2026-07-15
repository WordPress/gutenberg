<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `convertGifToVideo()` accepts an optional `onProgress` callback reporting conversion progress as a fraction from 0 to 1, throttled to whole-percent increments ([#80325](https://github.com/WordPress/gutenberg/issues/80325)).

## 0.2.0 (2026-07-14)

### New Features

-   Initial release. Provides a WebCodecs-based wrapper for animated GIF to video (MP4/WebM) conversion. Uses the [mediabunny](https://github.com/Vanilagy/mediabunny) library internally for encoder orchestration.
