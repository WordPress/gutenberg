# Design: Client-side animated GIF → video conversion via mediabunny

- **Date:** 2026-05-18
- **Branch:** `add/gif-to-video-mediabunny`
- **Status:** Approved (design)
- **Relationship:** Standalone alternative to PR [#76946](https://github.com/WordPress/gutenberg/pull/76946) (FFmpeg WASM implementation). Evaluated head-to-head; whichever approach wins is merged.

## Problem

Animated GIFs are large and inefficient. PR #76946 transparently converts animated
GIFs to MP4/WebM on upload using FFmpeg compiled to WASM. That approach works but
has two material costs:

1. **Bundle size:** ~14.1 MB of base64-inlined FFmpeg WASM.
2. **Cross-origin isolation requirement:** FFmpeg's threaded WASM build needs
   `SharedArrayBuffer`, so conversion only runs when the page is
   `crossOriginIsolated`. On the many WordPress installs that are not, the
   feature silently does nothing.

[mediabunny](https://mediabunny.dev/) (MPL-2.0, v1.45.2) is a pure-TypeScript
media toolkit that delegates encoding to the browser's native **WebCodecs**
API. It is tree-shakable down to kB-scale shipped code and requires **no
`SharedArrayBuffer` / cross-origin isolation**. This design uses mediabunny plus
the browser's `ImageDecoder` to deliver the same feature at a fraction of the
bundle cost and with broader runtime applicability.

## Goals

- Convert animated GIFs to MP4 (H.264) or WebM (VP9) entirely client-side on
  upload, replacing the original GIF in the upload queue.
- Keep the public package API and `upload-media` integration surface
  configuration-compatible with PR #76946 so the two can be compared directly.
- Degrade gracefully: when the required browser APIs are unavailable, upload the
  original GIF unchanged (no error, no user-visible change).
- Keep the editor responsive: all decode/encode work runs in a Web Worker.

## Non-goals

- No high-level "convert any media file" feature — only the animated-GIF →
  video upload path.
- No pluggable/abstracted encoder backend shared with the FFmpeg package. This
  is a self-contained standalone alternative.
- No change to static (single-frame) GIF handling — those continue through the
  existing image pipeline.
- No new user-facing settings beyond those PR #76946 already defines.

## Approach

**Worker-based pipeline, ArrayBuffer in / ArrayBuffer out, honoring real GIF
frame delays.** This mirrors the established `@wordpress/vips` and (proposed)
`@wordpress/ffmpeg` worker-threads architecture so the codebase stays
consistent.

mediabunny has no GIF demuxer, so the decode step uses the browser's native
WebCodecs `ImageDecoder`, which decodes animated GIF frames (with per-frame
`duration`). The pipeline:

```
GIF ArrayBuffer
  → ImageDecoder.decode({ frameIndex })  (per frame, after .complete)
  → VideoSample { timestamp, duration }  (timing from GIF frame delays)
  → VideoSampleSource({ codec, bitrate: QUALITY_HIGH })
  → Output({ format: Mp4OutputFormat | WebmOutputFormat, target: BufferTarget })
  → finalize()
  → video ArrayBuffer
```

Frame timing **honors the real per-frame GIF delays** (variable frame rate),
producing output that matches the original animation exactly — a fidelity
improvement over PR #76946's flat 24fps cap.

The entire decode + encode runs **inside the worker**, which receives the raw
GIF `ArrayBuffer` and returns the encoded video `ArrayBuffer`. This gives the
package an API surface identical to `@wordpress/ffmpeg`.

## Architecture

### New package: `@wordpress/mediabunny`

Named for parity with `@wordpress/ffmpeg`. Structure mirrors `packages/ffmpeg`:

| File | Responsibility |
|---|---|
| `src/index.ts` | `convertGifToVideo(id, buffer, outputMimeType, maxDimensions?)`, `cancelOperations(id)`. Same signatures as `@wordpress/ffmpeg`. Contains the ImageDecoder → mediabunny pipeline and an in-progress operation set for cancellation. |
| `src/worker.ts` | `expose({ convertGifToVideo, cancelOperations })` via `@wordpress/worker-threads`. |
| `src/loader.ts` | `export default () => import('@wordpress/mediabunny/worker')` — script-module discovery shim. |
| `src/types.ts` | `export type ItemId = string;` |
| `package.json`, `tsconfig.json`, `.npmrc`, `.gitignore`, `README.md`, `CHANGELOG.md` | Standard package scaffolding, modeled on `packages/ffmpeg`. `mediabunny` added as a dependency. |

**Codec selection:** `video/mp4` → mediabunny `Mp4OutputFormat` + `codec: 'avc'`
(H.264). `video/webm` → `WebmOutputFormat` + `codec: 'vp9'`. Bitrate via
mediabunny's subjective `QUALITY_HIGH` constant (revisited during
implementation against real output sizes).

**Optional downscale:** when `maxDimensions` is supplied and a frame exceeds it,
draw the decoded frame onto an `OffscreenCanvas` scaled to fit before wrapping
it as a `VideoSample`. Dimensions are padded to even values (encoder
requirement).

**Cancellation:** an in-progress `Set<ItemId>` checked at async boundaries
(after decode init, between frames), matching the `@wordpress/ffmpeg` pattern.

### `upload-media` integration (minimal, standalone)

Ports only what PR #76946 added, kept independent of that branch:

- `src/utils.ts`: add `isAnimatedGif(buffer)` — same binary GIF-structure
  detection as #76946 (magic bytes + counting Graphic Control Extension
  headers).
- `src/store/types.ts`: add `OperationType.TranscodeGif` and its
  `OperationArgs` entry (`{ outputFormat: 'mp4' | 'webm' }`).
- `src/store/private-actions.ts`:
  - `prepareItem`: when `file.type === 'image/gif'`, `settings.gifConvert !==
    false`, the file is an animated GIF, **and WebCodecs is supported**
    (feature-detect — see below), push `[TranscodeGif, Upload]` operations and
    set server `additionalData` (`generate_sub_sizes`, `convert_format`) exactly
    as #76946 does.
  - `processItem`: concurrency limit of 1 for `TranscodeGif` (decode/encode is
    memory-intensive); `finishOperation` re-triggers queued items.
  - `transcodeGifItem` action: calls the lazy mediabunny wrapper, swaps the
    queue item's file to the produced video, caches a blob URL, surfaces a
    generic `GIF_TRANSCODING_ERROR` (logging the real cause) on failure.
- `src/store/private-selectors.ts`: `getActiveVideoProcessingCount` /
  `getPendingVideoProcessing` (as in #76946).
- `src/store/utils/mediabunny.ts`: lazy dynamic-import wrapper around
  `@wordpress/mediabunny/worker` (mirrors `store/utils/ffmpeg.ts`):
  `mediabunnyConvertGifToVideo`, `mediabunnyCancelOperations`,
  `terminateMediabunnyWorker`.
- `tsconfig.json`: add `{ "path": "../mediabunny" }` reference.

### Feature detection & fallback

Replace #76946's `self.crossOriginIsolated` gate with a WebCodecs capability
check. Conversion is attempted only when:

- `'ImageDecoder' in self` (worker/global), and
- `'VideoEncoder' in self`, and
- `await VideoEncoder.isConfigSupported({ codec, ... })` resolves `supported:
  true` for the chosen output codec.

The cheap synchronous checks gate `prepareItem` (so we don't enqueue a
`TranscodeGif` op that can't run). The async `isConfigSupported` check runs in
the worker before encoding; if it fails there, the worker reports a sentinel and
the action falls back to uploading the original GIF unchanged (treated as a
non-error skip, not `GIF_TRANSCODING_ERROR`).

When unsupported (notably Firefox, which lacks `ImageDecoder`), the original GIF
uploads untouched — identical user-facing contract to #76946's
non-`crossOriginIsolated` fallback.

### Build / PHP wiring

- `lib/client-assets.php`: enqueue the `@wordpress/mediabunny/loader` script
  module on block-editor pages (mirrors the FFmpeg loader enqueue), so the
  worker module is discoverable in the import map but only fetched on first
  conversion.
- `docs/manifest.json`: add the new package's README entry.
- Root `tsconfig.json` / `packages/upload-media/tsconfig.json`: project
  references.
- Confirm `@wordpress/build` (`packages/wp-build`) bundles the new package's
  dynamic worker import the same way it handles `@wordpress/ffmpeg` /
  `@wordpress/vips`; add config only if the existing generic handling does not
  already cover it (no Gutenberg-specific changes to `wp-build`).

## Data flow

```
Upload queued (image/gif)
  → prepareItem: animated? + gifConvert enabled? + WebCodecs supported?
      → no:  existing image pipeline (GIF uploaded as-is)
      → yes: enqueue [TranscodeGif, Upload]
  → processItem (concurrency 1 for TranscodeGif)
  → transcodeGifItem
      → store/utils/mediabunny.ts (lazy import @wordpress/mediabunny/worker)
      → worker.convertGifToVideo(id, gifArrayBuffer, mimeType, maxDimensions)
          → ImageDecoder decodes frames (honor per-frame duration)
          → VideoSampleSource → Output(Mp4|Webm, BufferTarget) → finalize
          → returns video ArrayBuffer  (or "unsupported" sentinel → skip)
      → swap queue item file to produced video, cache blob URL
  → Upload (video) with generate_sub_sizes / convert_format additionalData
```

## Error handling

- **Unsupported environment:** detected before/at encode; skip conversion,
  upload original GIF, no error surfaced.
- **Decode/encode failure:** caught in `transcodeGifItem`; real cause logged to
  console, user sees generic `GIF_TRANSCODING_ERROR`; item cancelled (matches
  #76946 behavior).
- **Cancellation:** honored at async boundaries via the in-progress set;
  `terminateMediabunnyWorker()` tears the worker down.
- **Empty/zero-byte output:** treated as a failure (`GIF_TRANSCODING_ERROR`).

## Testing

- **Unit — `isAnimatedGif()`:** port #76946's fixtures (static GIF, animated
  GIF, non-GIF, truncated buffer).
- **Unit — mediabunny wrapper:** mock `ImageDecoder` and the mediabunny
  `Output`/`VideoSampleSource` to assert frame iteration, timing propagation,
  MP4 vs WebM codec/format selection, cancellation, and the unsupported-sentinel
  path. (Jest worker stub mirrors `test/unit/config/ffmpeg-worker-code-stub.js`.)
- **Unit — store:** `private-actions` and `selectors` tests mirroring #76946 —
  `prepareItem` enqueues `TranscodeGif` only for supported animated GIFs;
  concurrency limit; error path.
- **E2E (Playwright):** upload a known animated GIF, assert the resulting
  attachment is a video (MP4). Skipped in Firefox (no `ImageDecoder`).
- **Manual verification:** animated GIF (converts), static GIF (untouched),
  `gifConvert` disabled (untouched), WebM output format, Firefox (graceful
  fallback), non-cross-origin-isolated page (still converts — the key
  differentiator vs #76946).

## Risks & open questions

- **WebCodecs availability:** `ImageDecoder` is not Baseline (absent in
  Firefox). Mitigation: feature detection + graceful GIF passthrough. The net
  reachable audience is plausibly *larger* than #76946's, since most installs
  are not cross-origin isolated, but Firefox specifically regresses to no
  conversion (it would also not convert under #76946 unless isolated).
- **Encoder codec support varies by device** (e.g. hardware H.264). Mitigated by
  `VideoEncoder.isConfigSupported()` before encoding, with passthrough fallback.
- **License:** mediabunny is MPL-2.0 (one-way compatible with GPLv2+). Flag for
  WordPress dependency review; consistent with WP's handling of compatibly
  licensed bundled libraries.
- **Quality/bitrate tuning:** `QUALITY_HIGH` is a starting point; validate
  output size/quality vs the FFmpeg PR during implementation and adjust.
- **Bundle measurement:** confirm the actually-bundled mediabunny code is
  kB-scale (tree-shaken to MP4/WebM writing + WebCodecs only) and report the
  real number in the PR for the head-to-head comparison.
