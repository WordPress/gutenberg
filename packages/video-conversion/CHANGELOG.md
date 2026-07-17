<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `convertGifToVideo` now enforces a budget on total decoded pixels (width × height × frame count, default 300 megapixels, exported as `DEFAULT_MAX_TOTAL_PIXELS`). Over-budget GIFs are rejected up front with the new `SIZE_LIMIT_ERROR_PREFIX` message prefix so callers can skip the conversion gracefully instead of churning the CPU for minutes ([#80376](https://github.com/WordPress/gutenberg/issues/80376)).
-   `convertGifToVideo()` accepts an optional `onProgress` callback reporting conversion progress as a fraction from 0 to 1, throttled to whole-percent increments ([#80325](https://github.com/WordPress/gutenberg/issues/80325)).

### Enhancements

-   Use a 10-second key frame interval when converting GIFs to video, roughly halving the output file size for long animations at no quality or encode-time cost ([#80266](https://github.com/WordPress/gutenberg/issues/80266)).

## 0.2.0 (2026-07-14)

### New Features

-   Initial release. Provides a WebCodecs-based wrapper for animated GIF to video (MP4/WebM) conversion. Uses the [mediabunny](https://github.com/Vanilagy/mediabunny) library internally for encoder orchestration.
