<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add `convertHeicSequenceToVideo` to re-encode a demuxed HEIC/HEIF image sequence (Live Photo / burst) to a web-safe video, decoding its HEVC frames with the WebCodecs `VideoDecoder`. Any display rotation carried by the sequence is baked into the encoded frames, and the same total-pixel budget as the GIF path applies ([#79642](https://github.com/WordPress/gutenberg/issues/79642)).

### Breaking Changes

-   `SIZE_LIMIT_ERROR_PREFIX` no longer names the GIF format, so the same prefix covers every over-budget source. The dimensions and frame count that used to follow it are now labelled by source instead: `Unsupported: exceeds maximum conversion size (GIF is 500x500 …)` ([#79642](https://github.com/WordPress/gutenberg/issues/79642)).

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
