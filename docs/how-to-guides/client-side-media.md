# Client-Side Media Processing

## Overview

Client-side media processing handles image compression, resizing, format conversion, rotation, and thumbnail generation in the browser using WebAssembly, rather than on the server. It is enabled by default in WordPress 7.1 for supported browsers and transparently falls back to server-side processing when unavailable.

This guide covers how plugin and theme developers can interact with, customize, and troubleshoot client-side media processing.

For a deep dive into the architecture, see [Client-side media processing architecture](/docs/explanations/architecture/client-side-media-architecture.md).

## Requirements

Client-side media processing activates only when the browser, device, and network all meet the thresholds below. Every check must pass; if any fails, WordPress transparently falls back to server-side processing with no user-facing change.

### Browser

The pipeline depends on [`Document-Isolation-Policy`](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) (DIP) to enable `SharedArrayBuffer`, which is currently limited to Chromium-based browsers.

| Browser | Minimum version | Notes |
| --- | --- | --- |
| Chrome | 137+ | Full support via Document-Isolation-Policy. |
| Edge | 137+ | Full support via Document-Isolation-Policy. |
| Firefox | — | Not supported (no Document-Isolation-Policy support). |
| Safari | — | Not supported for the WASM pipeline; the HEIC canvas fallback still works. |

### Browser capabilities

In addition to a supported browser, these APIs must be available:

-   **WebAssembly** — required for wasm-vips.
-   **SharedArrayBuffer** — required for WASM threading (implies cross-origin isolation via DIP is active).
-   **Web Worker** — required for the off-main-thread vips worker.
-   **CSP allows `blob:` workers** — the `worker-src` directive must include `blob:` (see [Content Security Policy requirements](#content-security-policy-csp-requirements)).

### Device and network

| Requirement | Threshold | Reason |
| --- | --- | --- |
| Device memory | > 2 GB | WASM image processing holds the full image plus working buffers in memory; devices reporting ≤ 2 GB RAM are excluded to avoid out-of-memory crashes. |
| CPU cores | ≥ 2 | A WASM worker can monopolize a core during encode; at least two cores keeps the UI thread responsive. |
| Network connection | Not `2g`/`slow-2g`, Save-Data off | The ~13 MB worker download is gated to faster connections; `3g` and above are allowed. |

> **Note:** HEIC/HEIF decoding uses a separate, looser gate. It needs only `createImageBitmap` and `OffscreenCanvas`, so Safari can convert iPhone photos even though it can't run the WASM pipeline. See [Supported file formats](#supported-file-formats).

For the full list of checks and the exact detection logic, see the [architecture documentation](/docs/explanations/architecture/client-side-media-architecture.md#feature-detection).

## Disabling client-side media processing

Use the `wp_client_side_media_processing_enabled` filter to disable client-side processing.

### Disable site-wide

```php
add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
```

### Disable conditionally

```php
add_filter( 'wp_client_side_media_processing_enabled', 'example_disable_for_non_admins' );

function example_disable_for_non_admins( $enabled ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}
	return $enabled;
}
```

When disabled, all image processing reverts to the traditional server-side pipeline. No other changes are needed.

## Customizing image processing settings

Client-side processing respects existing WordPress image filters. These filters are read from the server via the REST API index and applied during client-side processing.

### Big image size threshold

The `big_image_size_threshold` filter controls the maximum dimension for uploaded images. Images larger than this threshold are scaled down. The default is 2560 pixels.

```php
// Change the big image threshold to 1920px.
add_filter( 'big_image_size_threshold', function () {
	return 1920;
} );
```

This works the same way whether processing happens client-side or server-side.

### Image output format conversion

The `image_editor_output_format` filter controls automatic format conversion (e.g., converting JPEG uploads to WebP).

```php
// Convert all JPEG uploads to WebP.
add_filter( 'image_editor_output_format', function ( $formats ) {
	$formats['image/jpeg'] = 'image/webp';
	return $formats;
} );
```

Client-side processing will apply this conversion before uploading sub-sized images. If a PNG has transparency and the target format is JPEG, the conversion is skipped to preserve the alpha channel.

### Progressive/interlaced image output

The `image_save_progressive` filter controls whether images are saved with progressive (JPEG) or interlaced (PNG, GIF) encoding.

```php
// Enable progressive JPEG output.
add_filter( 'image_save_progressive', function ( $interlaced, $mime_type ) {
	if ( 'image/jpeg' === $mime_type ) {
		return true;
	}
	return $interlaced;
}, 10, 2 );
```

## Supported file formats

Client-side processing handles the following MIME types in the WASM/vips pipeline: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`. Files outside this set fall through to one of two paths depending on type:

-   **HEIC/HEIF** (`image/heic`, `image/heif`): the client decodes the file with `createImageBitmap`, an `HTMLImageElement`/`OffscreenCanvas` strategy, or a HEIC-container + WebCodecs `VideoDecoder` path (Chromium 107+ via the platform codec — VideoToolbox on macOS, the Microsoft HEVC Video Extension on Windows), exports a JPEG (`.jpg`, MIME `image/jpeg`), and lets the server generate sub-sizes from the JPEG. The original HEIC is kept as a companion file in `$metadata['original']` and deleted with the attachment.
-   **Other** (video, audio, documents): the file is uploaded directly to the server with default parameters and standard server-side processing. No client-side step runs.

The set of MIME types eligible for the WASM pipeline is fixed at `CLIENT_SIDE_SUPPORTED_MIME_TYPES` in `packages/upload-media/src/store/constants.ts` — there is no public filter for adding or removing types.

## Animated GIF to video conversion

When an opaque animated GIF is uploaded, the editor converts it to a companion MP4 (or WebM) video and switches the block to a "GIF" variation of the Video block that plays like the original GIF. This reduces download size dramatically while preserving the look-and-feel of an animated GIF. Conversion happens client-side via the browser's WebCodecs APIs and the `@wordpress/video-conversion` package; for the full pipeline see the [architecture documentation](/docs/explanations/architecture/client-side-media-architecture.md#animated-gif-to-video-conversion).

What plugin and theme developers should know:

-   **The attachment stays a GIF.** An uploaded GIF remains a single `image/gif` attachment in the media library. The converted video and a first-frame poster are stored as _companion files_, recorded in `media_details.animated_video` and `media_details.animated_video_poster` — they are never separate attachments. They are removed automatically when the GIF attachment is deleted.
-   **The front end renders a real video block.** The swap is a block switch in the editor, not a render-time filter. The published content is a native `core/video` block (`<video autoplay loop muted playsinline poster>`), so there is no GIF-specific output filtering to account for.
-   **Transparent GIFs are not converted.** A `<video>` cannot reproduce GIF transparency, so transparent animated GIFs upload as ordinary images with no companion.
-   **It is reversible.** Users can switch a converted block back to the original GIF via the "Display as GIF" toolbar control (or the Image block's "Display as original GIF" toggle), which also opts the image out of re-conversion.
-   **Galleries, Media & Text, and Cover are unaffected.** Only standalone Image blocks are converted; GIFs inside a Gallery stay GIFs, and Media & Text / Cover media is untouched.
-   **Browser support.** Conversion requires WebCodecs video encoding (`ImageDecoder` + `VideoEncoder`). Browsers without it — notably Firefox — transparently upload the original GIF instead, with no error.

There is no public filter to opt a site out of GIF conversion specifically; disabling client-side media processing entirely (see [Disabling client-side media processing](#disabling-client-side-media-processing)) also disables it.

## Working with the upload store (JavaScript)

Client-side media processing is managed by the `core/upload-media` data store. Plugin developers can use its public API to monitor and interact with uploads.

### Checking upload status

```js
import { select } from '@wordpress/data';
import { store as uploadStore } from '@wordpress/upload-media';

// Check if any upload is in progress.
const uploading = select( uploadStore ).isUploading();

// Get all items in the upload queue.
const items = select( uploadStore ).getItems();
```

### Adding items to the upload queue

```js
import { dispatch } from '@wordpress/data';
import { store as uploadStore } from '@wordpress/upload-media';

dispatch( uploadStore ).addItems( {
	files: [ file1, file2 ],
	onSuccess( attachment ) {
		console.log( 'Uploaded:', attachment.id );
	},
	onError( error ) {
		console.error( 'Upload failed:', error.message );
	},
	onBatchSuccess() {
		console.log( 'All files in batch uploaded.' );
	},
	additionalData: {
		post: postId,
	},
} );
```

### Available selectors

| Selector | Returns | Description |
| --- | --- | --- |
| `isUploading()` | `boolean` | Whether any upload is currently active. |
| `isUploadingById( id )` | `boolean` | Whether a specific attachment ID is being uploaded. |
| `isUploadingByUrl( url )` | `boolean` | Whether a specific URL is being uploaded. |
| `getItems()` | `array` | All items in the upload queue. |
| `getSettings()` | `object` | Current upload settings (concurrency limits, allowed types, etc.). |

### Available actions

| Action | Description |
| --- | --- |
| `addItems( args )` | Add files to the upload queue. Accepts `files`, `onChange`, `onSuccess`, `onBatchSuccess`, `onError`, `additionalData`, `allowedTypes`. |
| `cancelItem( id, error )` | Cancel an in-progress upload and clean up resources. |
| `retryItem( id )` | Retry a failed upload. |

## Server-side plugin compatibility

When client-side processing is active, the `wp_generate_attachment_metadata` filter fires the same way it does for a server-side upload: once with context `'create'` during the initial upload, and again with `'update'` after WordPress calls the finalize endpoint (`POST /wp/v2/media/{id}/finalize`) once all client-side sub-size sideloads complete. Plugins that rely on this hook for watermarking, CDN sync, custom image sizes, or other post-processing continue to work without modification — write them idempotently so they handle both passes correctly.

This double-fire pattern is the same one WordPress uses for big-image uploads on the server, where sub-size generation is deferred and triggers a second `'update'` pass. Plugins that already work with big-image uploads accommodate it without changes.

If the finalize request fails, the error is logged but the upload still succeeds — finalization is best-effort so that a plugin failure does not block the user's upload.

## Controlling image quality (JavaScript)

The `editor.media.imageQuality` filter allows plugins to control the quality setting (0–1) used during client-side image resize and crop operations. The default quality is `0.82`.

```js
wp.hooks.addFilter(
	'editor.media.imageQuality',
	'my-plugin/custom-quality',
	( quality, context ) => {
		// context contains: item, mimeType, resize
		if ( context.mimeType === 'image/webp' ) {
			return 0.9;
		}
		return quality;
	}
);
```

The quality value is passed through to the vips worker during resize and crop operations.

## Using the finalize endpoint

After all client-side thumbnail sideloads complete, the finalize endpoint triggers server-side post-processing:

```
POST /wp/v2/media/{id}/finalize
```

This endpoint applies the `wp_generate_attachment_metadata` filter with context `'update'`, then saves the updated metadata. It requires `edit_post` and `upload_files` capabilities. This is the second of two passes during a client-side upload — see [Server-side plugin compatibility](#server-side-plugin-compatibility) for the full picture.

WordPress calls this endpoint automatically as part of the client-side upload pipeline. Plugin developers do not need to call it manually — it is documented here for context on how server-side hooks are preserved.

## Cross-origin isolation considerations

Client-side media processing requires `SharedArrayBuffer` for WASM threading. WordPress enables this automatically on block editor screens using [`Document-Isolation-Policy`](https://github.com/nicolo-ribaudo/tc39-proposal-structs/blob/main/test262-filtering/isolation-explainer.md) (DIP), which provides per-document cross-origin isolation without affecting other iframes on the page.

### Impact on plugins

-   **External scripts**: Scripts loaded from other origins will automatically get a `crossorigin="anonymous"` attribute added, handled by WordPress server-side (via HTML processing) and client-side (via a MutationObserver).
-   **Third-party page builders**: DIP is skipped on admin pages with an `action` parameter other than `edit`, to avoid conflicts with page builders that rely on same-origin iframe access.

### Content Security Policy (CSP) requirements

If your site or plugin sets a Content Security Policy, the `worker-src` directive must include `blob:` to allow inline worker creation:

```
Content-Security-Policy: worker-src 'self' blob:;
```

Without this, the WASM processing worker cannot be created and client-side processing will fall back to server-side.

### Checking isolation status

You can verify cross-origin isolation is active in the browser console:

```js
console.log( window.crossOriginIsolated ); // true if isolation is active
```

## Using the sideload endpoint

The sideload endpoint allows uploading pre-processed image variants (thumbnails, scaled versions) to an existing attachment:

```
POST /wp/v2/media/{id}/sideload
```

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `image_size` | string \| string[] | Yes | The image size name (e.g., `thumbnail`, `medium`, `large`, `scaled`, `original`). Pass an array to register a single physical file under multiple sizes that share dimensions. |
| `generate_sub_sizes` | boolean | No | Whether the server should generate additional sub-sizes from this upload. Default `true`. |
| `convert_format` | boolean | No | Whether to apply server-side format conversion via `image_editor_output_format`. Default `true`. |
| `replace_file` | boolean | No | When `true`, replaces the attachment's main file with the uploaded file, updating the MIME type and metadata and deleting the old file. Default `false`. Used by the HEIC → JPEG companion path. |

### Example

```js
const formData = new FormData();
formData.append( 'file', thumbnailBlob, 'image-150x150.webp' );

await wp.apiFetch( {
	path: `/wp/v2/media/123/sideload?image_size=thumbnail`,
	method: 'POST',
	body: formData,
} );
```

This endpoint requires both `edit_post` and `upload_files` capabilities.

### Dimension validation

The endpoint checks that the uploaded file's dimensions are appropriate for the `image_size` you declare. An `original` upload must match the attachment's stored dimensions exactly; a regular registered size (`thumbnail`, `medium`, and so on) must not exceed that size's registered width or height (with a 1px rounding tolerance); and every size must have positive dimensions. The `scaled`, `full`, and `original-heic` sizes are exempt from the maximum-dimension check. If validation fails, the uploaded file is discarded and the request returns a `400` response with one of `rest_upload_dimension_mismatch`, `rest_upload_invalid_dimensions`, or `rest_upload_unknown_size`.

## Troubleshooting

| Problem | Cause | Solution |
| --- | --- | --- |
| Client-side processing not activating | Browser lacks Document-Isolation-Policy support | Client-side processing requires Chrome/Edge 137+. Check `window.crossOriginIsolated` in the browser console. |
| Client-side processing not activating on Chrome 137+ | `Document-Isolation-Policy` header not sent | Verify you're editing a post or page (the header is skipped on admin pages with an `action` other than `edit`). Some third-party page builders may suppress the header. |
| WASM module fails to load | Incorrect MIME type for `.wasm` files | Add `AddType application/wasm wasm` to your `.htaccess` or server configuration. WordPress does this automatically for Apache via `mod_rewrite_rules`. |
| CSP blocks worker creation | `worker-src` directive too restrictive | Add `blob:` to the `worker-src` CSP directive: `worker-src 'self' blob:` |
| Processing falls back on capable browser | Feature disabled server-side | Check that `wp_client_side_media_processing_enabled` filter is not returning `false`. |
| Large images cause browser to slow down | Insufficient device memory | Devices with ≤ 2 GB RAM are automatically excluded. Consider reducing the big image size threshold for your site. |
| Feature disabled on a low-spec laptop | Below 2 CPU cores or 2 GB RAM | These thresholds protect underpowered devices from OOMs. Disable the gate per request only if you've confirmed the device can handle WASM image processing. |
| Feature disabled on slow network | `2g`/`slow-2g` connection or Save-Data is on | The ~13 MB worker download is gated behind `effectiveType` and `saveData`. `3g` and faster connections are allowed. |
| HEIC upload error on a server without HEIC support | Server-side HEIC decoder missing | The client converts HEIC to JPEG before upload — this should not occur in browsers that match `isHeicCanvasSupported()`. Verify the browser provides `createImageBitmap` and `OffscreenCanvas`. |
| Upload fails with "image transcoding error" | Unsupported format or corrupt file | Verify the file is a supported format (JPEG, PNG, WebP, AVIF, GIF, HEIC). |
| Save Draft button stays disabled | Lock not released | Ensure all upload items have completed or been cancelled. The lock releases when the upload queue is empty. |
| Sideload request rejected with a 400 dimension error | Uploaded variant doesn't match the declared `image_size` | The sideload endpoint validates dimensions. Make sure the file matches the size in `image_size`: an exact match for `original`, or within the registered maximum for a named size like `thumbnail`. |

## Debugging the WASM processor

The WASM image processor (wasm-vips) writes internal `stdout`/`stderr` messages (for example, non-actionable AVIF codec warnings) that are suppressed by default to keep the browser console clean. To capture this output while debugging, assign a function to `globalThis.__vipsDebug` before uploading:

```js
globalThis.__vipsDebug = ( text ) => console.log( '[vips]', text );
```

Set it back to `undefined` when you're done.
