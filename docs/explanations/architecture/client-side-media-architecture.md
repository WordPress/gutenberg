# Client-Side Media Processing

## Introduction

Client-side media processing is a capability shipping in WordPress 7.1 that handles image compression, resizing, format conversion, rotation, and thumbnail generation directly in the user's browser using WebAssembly, rather than on the server. Most of the underlying infrastructure landed during the 7.0 development cycle when the feature graduated from a Gutenberg experiment; the 7.1 cycle adds HEIC support, AVIF end-to-end uploads, performance improvements, and finishes hardening before the public release.

Key benefits include:

-   **Reduced server load**: Image processing is offloaded to the user's device, freeing server resources.
-   **No PHP memory limits**: Server-side image processing is often constrained by PHP's memory limit, causing failures with large images. Browser-based processing avoids these limits entirely.
-   **Consistent processing**: All users get the same high-quality image processing powered by [libvips](https://www.libvips.org/) via WebAssembly, regardless of which PHP image editor (GD or Imagick) is available on the server.
-   **Faster uploads**: Images are optimized before uploading, reducing the amount of data sent over the network.

When client-side processing is not available (unsupported browser, insufficient device resources, or explicitly disabled), WordPress transparently falls back to traditional server-side processing with no user intervention required.

## Architecture overview

The client-side media processing pipeline flows through several layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  Block Editor (Image block, Gallery block, etc.)                │
│  Calls mediaUpload() from @wordpress/block-editor               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  @wordpress/media-utils                                         │
│  uploadMedia() / sideloadMedia() — HTTP transport to REST API   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  @wordpress/upload-media  (core/upload-media store)             │
│  Upload queue, concurrency management, operation orchestration  │
└──────────────┬───────────────────────────┬──────────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐  ┌───────────────────────────────────┐
│  @wordpress/vips         │  │  REST API                         │
│  WASM image processing   │  │  POST /wp/v2/media                │
│  (Web Worker)            │  │  POST /wp/v2/media/{id}/sideload  │
└──────────────────────────┘  │  POST /wp/v2/media/{id}/finalize  │
                              └───────────────────────────────────┘
```

## Three-package split

Client-side media processing is split across three packages, each with a distinct responsibility:

### `@wordpress/upload-media` — Queue and orchestration

The `core/upload-media` data store manages the upload queue and coordinates the processing pipeline. It:

-   Maintains a queue of items with statuses (queued, processing, paused, uploaded, error).
-   Enforces concurrency limits (max 5 concurrent uploads, max 2 concurrent image processing operations).
-   Chains operations sequentially per item: prepare → transcode → upload → thumbnail generation → sideload → finalize.
-   Handles batch grouping, progress tracking, retry logic, and error handling.
-   Manages blob URLs for image previews and revokes them after use.

**Key source files:**

-   `packages/upload-media/src/store/` — Redux-like store with actions, selectors, and reducer.
-   `packages/upload-media/src/feature-detection.ts` — Browser capability checks.

### `@wordpress/vips` — WASM image processing

A JavaScript wrapper around [wasm-vips](https://github.com/kleisauke/wasm-vips) (a WebAssembly compilation of libvips). It runs in a Web Worker to avoid blocking the main thread and provides:

-   Format conversion (JPEG, PNG, WebP, AVIF, GIF).
-   Resizing and cropping with smart crop support.
-   EXIF orientation-based rotation.
-   Transparency detection (to avoid converting transparent PNGs to JPEG).
-   Compression with configurable quality (default: 82%).

**Key source files:**

-   `packages/vips/src/index.ts` — Core processing functions.
-   `packages/vips/src/vips-worker.ts` — Worker wrapper with lazy initialization.
-   `packages/vips/src/loader.ts` — Minimal loader for WordPress script module discovery.

### `@wordpress/media-utils` — HTTP transport

Provides the `uploadMedia()` and `sideloadMedia()` functions that handle the actual HTTP requests to the WordPress REST API. This package is responsible for file upload, sideload requests, and communicating server responses back to the upload store.

## Processing pipeline

When a user uploads an image in the block editor, the following pipeline executes:

### 1. Prepare

The `prepareItem()` operation examines the file type and determines which operations to run. For images supported by the WASM processor, the full pipeline is used. For other file types (video, audio, documents), the file is uploaded directly to the server with standard server-side processing.

### 2. Transcode (optional)

If the site is configured to convert image formats (e.g., JPEG → WebP via the `image_editor_output_format` filter), the `transcodeImageItem()` operation converts the image using `@wordpress/vips`. Special handling exists for PNGs with transparency — these are not converted to JPEG to preserve the alpha channel.

### 3. Upload original

The `uploadItem()` operation uploads the (optionally transcoded) image to the server via the REST API. The request includes `generate_sub_sizes: false` to tell the server _not_ to generate thumbnails, since the client will handle that.

### 4. Thumbnail generation

After the upload completes, the server responds with `missing_image_sizes` — a list of thumbnail sizes that still need to be generated. The `generateThumbnails()` operation creates sideload items for each missing size.

Sizes are deduplicated by their effective output dimensions before processing ([#77036](https://github.com/WordPress/gutenberg/pull/77036)). When a theme registers an image size with the same width/height/crop as a built-in size (for example, Twenty Eleven's `large` matches WordPress core's `medium_large` at 768×1024), the client generates one physical file and tells the server to register it under both names by passing an array to the sideload route's `image_size` parameter. This matches how the server-side path handles duplicate dimensions and avoids producing extra files with `-1` suffixes.

For images that exceed the `big_image_size_threshold` (default: 2560px), a scaled version is also generated and sideloaded.

If the original image requires EXIF rotation (orientation ≠ 1), a rotated version is generated and sideloaded as well.

### 5. Sideload sub-sizes

Each thumbnail is processed client-side (resize/crop → optional format conversion) and then uploaded to the server via the sideload endpoint (`POST /wp/v2/media/{id}/sideload`). The server stores each sub-size in the attachment metadata, registering it under each size name supplied in `image_size`.

To prevent race conditions, sideload uploads to the same post are serialized — if one item is being sideloaded, other items targeting the same post are paused until the sideload completes.

### 6. Finalize

After all sideloads for an item complete, the `finalizeItem()` operation calls `POST /wp/v2/media/{id}/finalize`. This endpoint re-applies the `wp_generate_attachment_metadata` filter on the server, ensuring that server-side plugins (e.g., for watermarking, CDN sync, or custom metadata processing) can post-process the attachment after all client-side operations are done.

The finalize step uses a gate: if any child sideloads are still pending, the operation waits. Once the last sideload completes, it triggers the parent item's pending Finalize operation.

If the finalize request fails, the error is logged but the upload is still considered successful — finalization is best-effort so that a plugin failure doesn't block the user's upload.

## Extension points

### `editor.media.imageQuality` (JavaScript filter)

The `editor.media.imageQuality` filter allows plugins to control the quality setting (0–1) used during client-side image resize and crop operations. It is called via `@wordpress/hooks` in the `resizeCropItem()` action.

```js
wp.hooks.addFilter(
	'editor.media.imageQuality',
	'my-plugin/custom-quality',
	( quality, context ) => {
		// context: { item, mimeType, resize }
		return quality;
	}
);
```

The quality value is passed through to the vips worker during resize and crop operations.

## WASM module loading

The WASM worker bundle (~13 MB minified, ~10 MB after build-output trimming) is loaded lazily — only when the first image needs processing:

1.  **Loader discovery**: `@wordpress/vips/loader` is a minimal module that returns a dynamic `import( '@wordpress/vips/worker' )`. This lets WordPress's script module system discover the dependency without pulling the heavy WASM binary into the initial editor bundle.

2.  **Worker creation**: When processing is first needed, a Web Worker is created from an inline blob URL. The WASM modules (`vips.wasm` and `vips-heif.wasm`) are inlined as base64 data URLs at build time, eliminating separate file downloads and WASM MIME type issues. The unused `vips-jxl.wasm` module was removed in [#76639](https://github.com/WordPress/gutenberg/pull/76639) (saving ~3.1 MB), and the unminified worker plus its source map are skipped at build time ([#76615](https://github.com/WordPress/gutenberg/pull/76615), [#75993](https://github.com/WordPress/gutenberg/pull/75993)) since they provide no debugging value for inlined base64 WASM.

3.  **Single instance**: `getVips()` caches a *promise* rather than a fully-initialized instance, so concurrent first-time calls share one initialization rather than racing to create multiple vips instances ([#76780](https://github.com/WordPress/gutenberg/pull/76780)). The worker is kept alive until the upload queue is empty, at which point `terminateVipsWorker()` is called to free memory.

4.  **Memory management**: Emscripten's `setAutoDeleteLater(true)` is configured for automatic cleanup. Each operation also calls a manual cleanup function after completion. Operations are tracked via an `inProgressOperations` set, allowing mid-operation cancellation via a progress callback kill switch.

5.  **Batch thumbnail generation**: The `batchResizeImage()` path decodes the source image once with `newFromBuffer()`, then calls `image.copyMemory()` to materialize the pixels in WASM memory. Each sub-size is generated by calling `thumbnailImage()` against the in-memory copy and writing directly to the output format ([#76979](https://github.com/WordPress/gutenberg/pull/76979)). This avoids re-decoding the source for every thumbnail — a 60× improvement per the [libvips discussion](https://github.com/libvips/libvips/discussions/4585) the change is based on. The path falls back to per-thumbnail processing if the batch operation fails (for example, animated GIFs).

## Cross-origin isolation

Client-side media processing requires `SharedArrayBuffer` for WASM threading, which browsers only expose in [cross-origin isolated](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) contexts.

### PHP headers

WordPress sends the `Document-Isolation-Policy` (DIP) header on block editor screens for Chromium 137+:

```
Document-Isolation-Policy: isolate-and-credentialless
```

This header provides per-document cross-origin isolation without affecting other iframes on the page, avoiding the breakage that the older `Cross-Origin-Embedder-Policy` / `Cross-Origin-Opener-Policy` headers caused for third-party plugins and embeds.

The header is set via `gutenberg_start_cross_origin_isolation_output_buffer()` (in `lib/media/load.php`), which uses PHP output buffering on `load-post.php`, `load-post-new.php`, `load-site-editor.php`, and `load-widgets.php` screens. DIP is skipped on admin pages with an `action` parameter other than `edit` to avoid conflicts with page builders that rely on same-origin iframe access.

The `gutenberg_use_document_isolation_policy` filter can be used to control whether DIP is applied:

```php
// Force DIP on or off regardless of browser version.
add_filter( 'gutenberg_use_document_isolation_policy', '__return_true' );
```

### HTML attribute injection

Cross-origin isolation requires that cross-origin resources include proper CORS attributes. WordPress handles this at two levels:

**Server-side** (PHP output buffer): The `wp_add_crossorigin_attributes()` function uses `WP_HTML_Tag_Processor` to add `crossorigin="anonymous"` to `<audio>`, `<link>`, `<script>`, `<video>`, and `<source>` tags that load cross-origin URLs.

**Client-side** (JavaScript MutationObserver): A MutationObserver in `packages/block-editor/src/hooks/cross-origin-isolation.js` monitors the DOM for dynamically added elements and adds `crossorigin="anonymous"` attributes at runtime.

> **Note:** `<img>` was intentionally removed from the mutated-element list in [#76618](https://github.com/WordPress/gutenberg/pull/76618). Adding `crossorigin="anonymous"` to images that link to external hosts without CORS headers (a common case for the Image block linking to a third-party URL) caused those previews to break. With the move to Document-Isolation-Policy, image elements no longer need the attribute for client-side processing to function — DIP doesn't require `<img>` resources to be CORS-enabled.

### Browser support

Client-side media processing is limited to Chromium-based browsers that support `Document-Isolation-Policy`:

| Browser | Minimum Version | Notes |
| --- | --- | --- |
| Chrome | 137+ | Full support via Document-Isolation-Policy. |
| Edge | 137+ | Full support via Document-Isolation-Policy. |
| Firefox | — | Not supported. |
| Safari | — | Not supported. |

Browsers that do not support DIP fall back automatically to server-side processing.

## Feature detection

Before enabling client-side processing, the browser's capabilities are checked in `packages/upload-media/src/feature-detection.ts`. All checks must pass; failure at any point causes a transparent fallback to server-side processing.

| Check | Threshold | Reason |
| --- | --- | --- |
| WebAssembly available | — | Required for wasm-vips |
| SharedArrayBuffer available | — | Required for WASM threading (implies Document-Isolation-Policy is active) |
| Web Worker available | — | Required for the off-main-thread vips worker |
| Device memory | > 2 GB | WASM image processing can hold the full image in memory plus working buffers; very low-memory devices can OOM |
| Hardware concurrency | ≥ 2 CPU cores | WASM workers can monopolize a core for tens of seconds during encode |
| Network connection | not `2g`/`slow-2g`, no Save-Data | Avoid the ~13 MB worker download on connections that can't bear it |
| CSP allows `blob:` workers | — | Required for inline worker creation; verified by attempting to construct a worker from a blob URL |

These thresholds were tuned in [#76616](https://github.com/WordPress/gutenberg/pull/76616): the CPU minimum was lowered from 4 to 2 cores, and `3g` connections are now allowed. The device-memory and Save-Data gates are unchanged.

The PHP-side feature flag (`wp_client_side_media_processing_enabled` filter) is also checked before any JavaScript feature detection runs. The Document-Isolation-Policy header is only sent on Chromium 137+, which short-circuits the JavaScript path on browsers that don't support cross-origin isolation through DIP.

A separate `isHeicCanvasSupported()` check (`createImageBitmap` + `OffscreenCanvas`) gates the HEIC fallback path. This runs independently of full VIPS support so Safari (which can't run the WASM pipeline but can decode HEIC natively) can still handle iPhone photos in the browser.

## Supported formats

The following formats are processed in the WASM/vips pipeline (`CLIENT_SIDE_SUPPORTED_MIME_TYPES`):

| Format | Read | Write | Transparency | Animation | Progressive/Interlace |
| --- | --- | --- | --- | --- | --- |
| JPEG | Yes | Yes | No | No | Yes |
| PNG | Yes | Yes | Yes | No | Yes |
| WebP | Yes | Yes | Yes | Yes | No |
| AVIF | Yes | Yes | Yes | No | No |
| GIF | Yes | Yes | No | Yes | Yes |

Notes:
-   AVIF encoding uses `effort: 2` to balance encoding speed with quality.
-   Animated GIF and WebP images preserve all frames during processing.
-   PNG-to-JPEG conversion is skipped when the PNG has transparency.
-   AVIF uploads bypass the server's `wp_prevent_unsupported_mime_type_uploads` check when `generate_sub_sizes=false`, so a host without server-side AVIF support can still accept client-processed AVIF files.

### HEIC/HEIF

HEIC/HEIF is handled via a canvas-based fallback path rather than wasm-vips, since the HEVC codec used by HEIC has patent/licensing restrictions that prevent shipping a decoder in the browser bundle.

When a HEIC file is uploaded, the client tries three decoding strategies in order:

1.  **`createImageBitmap()`** — Works in Safari (which can decode HEIC via macOS platform codecs) and any future browser that adds HEIC to its image pipeline.
2.  **OS-licensed image decoders via `HTMLImageElement` → `OffscreenCanvas`** — A second-tier path for browsers with platform HEIC support.
3.  **HEIC container parsing + WebCodecs `VideoDecoder`** — Chrome 107+ on macOS can decode HEVC bitstreams via VideoToolbox even without HEIC image support. The client parses the ISOBMFF container, extracts the HEVC tiles, and re-assembles them on a canvas.

The decoded image is exported as a JPEG (`.jpg`, MIME `image/jpeg`) and uploaded with the original HEIC kept as a companion file in `$metadata['original']`. The server is responsible for sub-size generation in this path (`generate_sub_sizes: true`, `convert_format: true`), so the `image_editor_output_format` mapping is preserved for the JPEG sub-sizes.

## Fallback behavior

Client-side media processing is designed with transparent fallback. When the browser does not support WASM processing — or when the feature is disabled — uploads proceed through the traditional server-side path:

1.  The file is uploaded to `POST /wp/v2/media` with default parameters.
2.  The server generates thumbnails using `wp_generate_attachment_metadata()`.
3.  Server-side image processing uses GD or Imagick as configured.
4.  The user experience is identical — no errors or additional prompts.

The fallback is automatic and requires no configuration.

## REST API extensions

Client-side media processing extends the WordPress REST API in several ways:

### New request parameters

| Parameter | Endpoint | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `generate_sub_sizes` | `POST /wp/v2/media`, `POST /wp/v2/media/{id}/sideload` | boolean | `true` | When `false`, the server skips thumbnail generation. The client generates and sideloads thumbnails itself. |
| `convert_format` | `POST /wp/v2/media`, `POST /wp/v2/media/{id}/sideload` | boolean | `true` | When `false`, the server skips format conversion via the `image_editor_output_format` filter. Declared as a boolean on the sideload route since [#77565](https://github.com/WordPress/gutenberg/pull/77565) so REST coerces `multipart/form-data` string values correctly. |
| `replace_file` | `POST /wp/v2/media/{id}/sideload` | boolean | `false` | When `true`, replaces the attachment's main file with the sideloaded file, updating the MIME type and metadata and deleting the old file. Used for the HEIC → JPEG companion path. |
| `image_size` | `POST /wp/v2/media/{id}/sideload` | string \| string[] | — | The image size name (e.g., `thumbnail`, `medium`, `scaled`, `original`). Accepts an array of names since [#77036](https://github.com/WordPress/gutenberg/pull/77036) so a single physical file can be registered under multiple sizes that share dimensions. |

When `generate_sub_sizes` is `false`, the following server-side filters are also temporarily disabled:
-   `intermediate_image_sizes_advanced` — Prevents sub-size generation.
-   `fallback_intermediate_image_sizes` — Prevents fallback size generation.
-   `wp_image_maybe_exif_rotate` — Prevents server-side EXIF rotation (client handles it).
-   `big_image_size_threshold` — Prevents server-side big image scaling (client handles it).

### New response fields

| Field | Type | Description |
| --- | --- | --- |
| `exif_orientation` | integer | EXIF orientation value (1–8). A value other than 1 indicates the image needs rotation. |
| `missing_image_sizes` | array | List of registered image size names that have not yet been generated for this attachment. |
| `filename` | string | Original attachment file name. |
| `filesize` | integer | Attachment file size in bytes. |

### Sideload endpoint

```
POST /wp/v2/media/{id}/sideload
```

Uploads a processed image variant (thumbnail, scaled version, or rotated original) to an existing attachment. The `image_size` parameter specifies which variant is being uploaded and accepts any registered image size name, plus `original` and `scaled`.

### Finalize endpoint

```
POST /wp/v2/media/{id}/finalize
```

Triggers the `wp_generate_attachment_metadata` filter after all client-side operations (upload, thumbnail generation, sideloads) are complete. This ensures server-side plugins that hook into `wp_generate_attachment_metadata` — such as those for watermarking, CDN sync, or custom image sizes — can post-process the attachment.

The endpoint requires `edit_post` and `upload_files` capabilities. It reads the existing attachment metadata, re-applies the `wp_generate_attachment_metadata` filter with context `'update'`, and saves the result.

### REST index media settings

When client-side processing is enabled, the REST API root index (`GET /`) is augmented (for users with `upload_files` capability) with:

-   `image_sizes` — All registered image sizes with dimensions and crop settings, derived from `wp_get_registered_image_subsizes()`.
-   `image_size_threshold` — The current `big_image_size_threshold` filter value.

Other server-side filters (`image_editor_output_format`, `image_save_progressive`) are read at upload time on the server rather than exposed via the index. The set of MIME types eligible for client-side processing is fixed at `CLIENT_SIDE_SUPPORTED_MIME_TYPES` (JPEG, PNG, GIF, WebP, AVIF) — there is no public filter for this list.

## Concurrency

The upload store enforces two separate concurrency limits to balance performance and resource usage:

| Limit | Default | Reason |
| --- | --- | --- |
| Max concurrent uploads | 5 | Uploads are network-bound and can run in parallel. |
| Max concurrent image processing operations | 2 | WASM image processing is memory-intensive. Running too many operations simultaneously risks out-of-memory crashes. |

When a concurrency limit is reached, new items wait in the queue. As operations complete, pending items are automatically dequeued and processed.

Additionally, sideload uploads to the same WordPress post are serialized to prevent race conditions in attachment metadata updates. If one sideload is in progress for a post, other sideloads targeting the same post are paused until the first completes.

## Post-save locking

While uploads are in flight, the editor takes a post-saving lock so the user can't publish or save a draft that references attachments which haven't finished sideloading. Both the legacy upload path and the client-side path share this behavior:

-   `useUploadSaveLock` watches the `core/upload-media` store and dispatches `lockPostSaving`/`unlockPostSaving` against the editor store as items enter and leave the queue.
-   The legacy (`uploadMedia`-only) path also locks via `UploadSaveLockWrapper`, which counts active uploads instead of tracking a queue.

The Save Draft button, Publish button, and `Ctrl/Cmd+S` shortcut all check `isPostSavingLocked()` ([#76973](https://github.com/WordPress/gutenberg/pull/76973) closed an earlier gap where Save Draft did not respect the lock). The lock releases when all items are uploaded or any in-flight item is cancelled.
