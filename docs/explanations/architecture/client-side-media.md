# Client-Side Media Processing

## Introduction

Client-side media processing is a capability in WordPress that handles image compression, resizing, format conversion, rotation, and thumbnail generation directly in the user's browser using WebAssembly, rather than on the server.

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

For images that exceed the `big_image_size_threshold` (default: 2560px), a scaled version is also generated and sideloaded.

If the original image requires EXIF rotation (orientation ≠ 1), a rotated version is generated and sideloaded as well.

### 5. Sideload sub-sizes

Each thumbnail is processed client-side (resize/crop → optional format conversion) and then uploaded to the server via the sideload endpoint (`POST /wp/v2/media/{id}/sideload`). The server stores each sub-size in the attachment metadata.

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

Note: The quality value is not yet wired through to the vips worker but the hook is provided as an extension point for future use.

## WASM module loading

The WASM binary (~3.8 MB) is loaded lazily — only when the first image needs processing:

1.  **Loader discovery**: `@wordpress/vips/loader` is a minimal module that returns a dynamic `import( '@wordpress/vips/worker' )`. This allows WordPress's script module system to discover the dependency without loading the heavy WASM binary upfront.

2.  **Worker creation**: When processing is first needed, a Web Worker is created from an inline blob URL. The WASM modules (`vips.wasm` and `vips-jxl.wasm`) are inlined as base64 data URLs at build time, eliminating separate file downloads and WASM MIME type issues.

3.  **Instance reuse**: The vips instance is created once and reused across all operations. The worker is kept alive until the upload queue is empty, at which point `terminateVipsWorker()` is called to free memory.

4.  **Memory management**: Emscripten's `setAutoDeleteLater(true)` is configured for automatic cleanup. Each operation also calls a manual cleanup function after completion. Operations are tracked via an `inProgressOperations` set, allowing mid-operation cancellation via a progress callback kill switch.

## Cross-origin isolation

Client-side media processing requires `SharedArrayBuffer` for WASM threading, which browsers only expose in [cross-origin isolated](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) contexts.

### PHP headers

WordPress sends two HTTP headers on block editor screens:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless   (Chrome/Edge)
Cross-Origin-Embedder-Policy: require-corp      (Safari)
```

These headers are set via `wp_start_cross_origin_isolation_output_buffer()` (in `lib/media/load.php`), which uses PHP output buffering on `load-post.php`, `load-post-new.php`, `load-site-editor.php`, and `load-widgets.php` screens.

### HTML attribute injection

Cross-origin isolation requires that cross-origin resources include proper CORS attributes. WordPress handles this at two levels:

**Server-side** (PHP output buffer): The `wp_add_crossorigin_attributes()` function uses `WP_HTML_Tag_Processor` to add `crossorigin="anonymous"` to `<audio>`, `<img>`, `<link>`, `<script>`, `<video>`, and `<source>` tags that load cross-origin URLs.

**Client-side** (JavaScript MutationObserver): A MutationObserver in `packages/block-editor/src/hooks/cross-origin-isolation.js` monitors the DOM for dynamically added elements and adds `crossorigin="anonymous"` attributes at runtime. For iframes, it also sets the `credentialless` attribute where supported.

### Safari vs. Chrome differences

| Aspect | Chrome/Edge | Safari |
| --- | --- | --- |
| COEP mode | `credentialless` | `require-corp` |
| Iframe `credentialless` attribute | Supported | Not supported |
| Cross-origin resources | Load without explicit CORS | Must have CORS headers |
| Embed previews | Supported (except Facebook, SmugMug) | May be blocked |

Browsers that lack `credentialless` iframe support (currently Firefox and Safari) have client-side media processing disabled by default to avoid breaking third-party embeds. Developers can re-enable the feature via the `wp_client_side_media_processing_enabled` filter.

## Feature detection

Before enabling client-side processing, the browser's capabilities are checked (in `packages/upload-media/src/feature-detection.ts`). All checks must pass; failure at any point causes a transparent fallback to server-side processing.

| Check | Reason |
| --- | --- |
| WebAssembly available | Required for wasm-vips |
| SharedArrayBuffer available | Required for WASM threading (implies cross-origin isolation) |
| CSP allows `blob:` workers | Required for inline worker creation |
| `credentialless` iframe support | Required to avoid breaking third-party embeds |
| Device memory > 2 GB | WASM processing is memory-intensive |
| Network not on data saver or 2g/slow-2g | Processing generates multiple uploads |
| Web Worker support | Baseline requirement |

The PHP-side feature flag (`wp_client_side_media_processing_enabled` filter) is also checked before any JavaScript feature detection runs.

## Supported formats

| Format | Read | Write | Transparency | Animation | Progressive/Interlace |
| --- | --- | --- | --- | --- | --- |
| JPEG | Yes | Yes | No | No | Yes |
| PNG | Yes | Yes | Yes | No | Yes |
| WebP | Yes | Yes | Yes | Yes | No |
| AVIF | Yes | Yes | Yes | No | No |
| GIF | Yes | Yes | No | Yes | Yes |

Notes:
-   HEIC/HEIF is not supported due to trademark/licensing concerns.
-   AVIF encoding uses `effort: 2` to balance encoding speed with quality.
-   Animated GIF and WebP images preserve all frames during processing.
-   PNG-to-JPEG conversion is skipped when the PNG has transparency.

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
| `generate_sub_sizes` | `POST /wp/v2/media` | boolean | `true` | When `false`, the server skips thumbnail generation. The client will generate and sideload thumbnails. |
| `convert_format` | `POST /wp/v2/media`, `POST /wp/v2/media/{id}/sideload` | boolean | `true` | When `false`, the server skips format conversion (via `image_editor_output_format` filter). |

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

When client-side processing is enabled, the REST API root index (`GET /`) includes additional media settings (for users with `upload_files` capability):

-   `image_sizes` — All registered image sizes with dimensions and crop settings.
-   `image_size_threshold` — The big image size threshold value.
-   `image_output_formats` — Format conversion map (respects `image_editor_output_format` filter).
-   `jpeg_interlaced`, `png_interlaced`, `gif_interlaced` — Progressive/interlace settings (respects `image_save_progressive` filter).

## Concurrency

The upload store enforces two separate concurrency limits to balance performance and resource usage:

| Limit | Default | Reason |
| --- | --- | --- |
| Max concurrent uploads | 5 | Uploads are network-bound and can run in parallel. |
| Max concurrent image processing operations | 2 | WASM image processing is memory-intensive. Running too many operations simultaneously risks out-of-memory crashes. |

When a concurrency limit is reached, new items wait in the queue. As operations complete, pending items are automatically dequeued and processed.

Additionally, sideload uploads to the same WordPress post are serialized to prevent race conditions in attachment metadata updates. If one sideload is in progress for a post, other sideloads targeting the same post are paused until the first completes.
