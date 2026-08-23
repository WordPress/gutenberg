<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Added `transcodeVideo`, which re-encodes a video to a web-safe format (MP4/H.264 or WebM/VP9) with optional downscaling, frame rate and bitrate caps, and `getVideoMetadata`, which reads the primary video track's codec, dimensions, bitrate and duration from the container headers so callers can decide whether a transcode is needed. ([#79375](https://github.com/WordPress/gutenberg/pull/79375))
-   `transcodeVideo` now probes encoder support before encoding and falls back from `'prefer-hardware'` to `'no-preference'` when the browser has no hardware encoder for the requested codec and output size. Previously the transcode failed outright on machines without a hardware encoder, such as headless browsers, virtual machines and CI runners. ([#79375](https://github.com/WordPress/gutenberg/pull/79375))

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))

## 0.4.0 (2026-08-12)

## 0.3.0 (2026-07-29)

### New Features

-   `convertGifToVideo` now enforces a budget on total decoded pixels (width × height × frame count, default 300 megapixels, exported as `DEFAULT_MAX_TOTAL_PIXELS`). Over-budget GIFs are rejected up front with the new `SIZE_LIMIT_ERROR_PREFIX` message prefix so callers can skip the conversion gracefully instead of churning the CPU for minutes ([#80376](https://github.com/WordPress/gutenberg/issues/80376)).

### Enhancements

-   Use a 10-second key frame interval when converting GIFs to video, roughly halving the output file size for long animations at no quality or encode-time cost ([#80266](https://github.com/WordPress/gutenberg/issues/80266)).

## 0.2.0 (2026-07-14)

### New Features

-   Initial release. Provides a WebCodecs-based wrapper for animated GIF to video (MP4/WebM) conversion. Uses the [mediabunny](https://github.com/Vanilagy/mediabunny) library internally for encoder orchestration.
