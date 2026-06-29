<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Initial release. Provides a WebCodecs-based wrapper for animated GIF to video (MP4/WebM) conversion. Uses the [mediabunny](https://github.com/Vanilagy/mediabunny) library internally for encoder orchestration.
-   Add `convertHeicSequenceToVideo` to re-encode a demuxed HEIC/HEIF image sequence (Live Photo / burst) to a web-safe video, decoding its HEVC frames with the WebCodecs `VideoDecoder` ([#79642](https://github.com/WordPress/gutenberg/issues/79642)).
