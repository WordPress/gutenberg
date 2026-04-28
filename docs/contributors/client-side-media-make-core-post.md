# Client-Side Media Processing in WordPress 7.1

WordPress 7.1 ships client-side media processing — a capability that handles image compression, resizing, format conversion, rotation, and thumbnail generation directly in the user's browser using WebAssembly, rather than on the server.

The infrastructure landed during the 7.0 development cycle, when the feature graduated from a Gutenberg experiment to a core Gutenberg feature. Shipping was deferred to 7.1 to give the feature additional time to bake and to land HEIC support, end-to-end AVIF uploads, and several performance and stability improvements. See the [7.1 iteration tracking issue](https://github.com/WordPress/gutenberg/issues/76756) for the full scope.

This post outlines what's changing, how it works, and what plugin and theme developers need to know.

## What is client-side media processing?

Traditionally, when a user uploads an image in the block editor, the file is sent to the server where PHP (using GD or Imagick) generates thumbnails, applies format conversions, handles EXIF rotation, and scales large images. This approach is limited by PHP memory constraints, server CPU availability, and the capabilities of the installed image library.

Client-side media processing moves this work to the browser. Images are processed using [wasm-vips](https://github.com/kleisauke/wasm-vips), a WebAssembly compilation of the high-performance libvips image processing library. The processed images — including all thumbnails — are then uploaded to the server, which simply stores them. After all client-side operations complete, a finalize step re-runs the `wp_generate_attachment_metadata` filter on the server so plugins continue to see the same hook surface as before.

## Key benefits

- **No more PHP memory limit failures.** Large image processing that would exceed PHP's memory limit now succeeds because it runs in the browser's memory space.
- **Reduced server load.** Image processing is offloaded to the user's device, freeing server CPU and memory for other tasks.
- **Consistent, high-quality output with modern image support.** All users get the same libvips-powered processing regardless of whether the server has GD or Imagick, and regardless of which version is installed.
- **iPhone photos just work.** HEIC images can be decoded in the browser and converted to JPEG before upload, even on hosts without server-side HEIC support.
- **AVIF without server-side AVIF support.** Hosts whose PHP image editor doesn't support AVIF can still accept AVIF uploads when client-side processing is active.
- **More resilient uploads.** Sub-size uploads are independent requests, so a network hiccup mid-upload doesn't lose the entire batch.

## What's new in 7.1

The 7.0 cycle delivered the foundation; 7.1 adds:

- **HEIC/HEIF support** — iPhone photos (`image/heic`, `image/heif`) are decoded in the browser via three fallback strategies (`createImageBitmap`, `HTMLImageElement` + `OffscreenCanvas`, and HEIC container parsing + WebCodecs `VideoDecoder`) and uploaded as JPEG (`.jpg`). The original HEIC is kept as a companion file in `$metadata['original']` and removed when the attachment is deleted.
- **AVIF end-to-end uploads** — `vips-heif.wasm` is now bundled in the worker, so AVIF can be decoded client-side. The REST API skips its `wp_prevent_unsupported_mime_type_uploads` check when `generate_sub_sizes=false`, so hosts without server-side AVIF support still accept the upload ([#76371](https://github.com/WordPress/gutenberg/pull/76371)).
- **Batch thumbnail generation** — Sub-sizes are now generated from a single in-memory copy of the source image via `image.copyMemory()` and `thumbnailImage()`, replacing the previous decode-per-thumbnail approach ([#76979](https://github.com/WordPress/gutenberg/pull/76979)). The libvips discussion this is based on showed roughly a 60× per-thumbnail speedup.
- **Sub-size deduplication** — When themes register image sizes with the same dimensions as built-in sizes (e.g. Twenty Eleven's `large` matches `medium_large`), the client now generates one physical file and registers it under all matching size names via the sideload route's `image_size` parameter (now accepts `string | string[]`) ([#77036](https://github.com/WordPress/gutenberg/pull/77036)).
- **Single VIPS instance guarantee** — `getVips()` caches a promise rather than an instance, eliminating a race that could create multiple vips instances under concurrent first-time calls ([#76780](https://github.com/WordPress/gutenberg/pull/76780)).
- **Fixed save lock during uploads** — The Save Draft button now respects `isPostSavingLocked` (it didn't before), and the legacy upload path no longer toggles the lock per file in a way that left it stuck on multi-file uploads ([#76973](https://github.com/WordPress/gutenberg/pull/76973)).
- **Loosened device requirements** — The minimum CPU core count was lowered from 4 to 2, and `3g` connections are now allowed (previously blocked) ([#76616](https://github.com/WordPress/gutenberg/pull/76616)). Device memory and Save-Data thresholds are unchanged.
- **`<img>` removed from cross-origin attribute injection** — `<img>` no longer gets `crossorigin="anonymous"` injected on cross-origin URLs, which was breaking external image previews. Document-Isolation-Policy doesn't require it for client-side processing to function ([#76618](https://github.com/WordPress/gutenberg/pull/76618)).
- **Smaller build output** — Removed unused `vips-jxl.wasm` (~3.1 MB), skipped non-minified worker output and source maps for inlined-WASM modules. The vips worker bundle dropped from ~16 MB to ~13 MB and `build/modules/vips/` from 26 MB to 10 MB ([#76639](https://github.com/WordPress/gutenberg/pull/76639), [#76615](https://github.com/WordPress/gutenberg/pull/76615), [#75993](https://github.com/WordPress/gutenberg/pull/75993)).
- **`convert_format` declared as boolean on the sideload route** — Lets REST coerce string values from `multipart/form-data`, fixing a HEIC filename-suffix drift bug ([#77565](https://github.com/WordPress/gutenberg/pull/77565)).

## What changed during 7.0

The 7.0 cycle delivered the foundation — published here for historical context since the feature was originally targeted for that release:

- **Browser-based image processing**: Compression, resizing, cropping, format conversion (JPEG, PNG, WebP, AVIF, GIF), EXIF rotation, and progressive/interlaced encoding — all via WebAssembly in a Web Worker.
- **Thumbnail generation in the browser**: All registered image sub-sizes are generated client-side and uploaded individually via the new sideload REST API endpoint.
- **Automatic format conversion**: The existing `image_editor_output_format` filter is respected client-side, enabling automatic conversion (e.g., JPEG to WebP) before upload.
- **Smart fallback**: Browsers that don't support the required features automatically fall back to server-side processing with no user-facing change.
- **Cross-origin isolation via Document-Isolation-Policy**: WordPress sends `Document-Isolation-Policy: isolate-and-credentialless` on block editor screens for Chromium 137+, replacing the COEP/COOP approach in core. DIP provides per-document isolation without breaking other iframes on the page.
- **Server-side hook compatibility**: After all client-side operations complete, `POST /wp/v2/media/{id}/finalize` re-runs `wp_generate_attachment_metadata` so plugins that hook into it (watermarking, CDN sync, etc.) continue to work.
- **Image quality filter**: `editor.media.imageQuality` JavaScript filter to control client-side resize/crop quality (0–1, default 0.82).

## Technical overview

The implementation spans three JavaScript packages and several PHP files:

- **`@wordpress/upload-media`** — Manages the upload queue, concurrency (max 5 uploads, max 2 image processing operations), and orchestrates the pipeline.
- **`@wordpress/vips`** — Wraps wasm-vips in a Web Worker for non-blocking image processing. The WASM bundle is loaded lazily on first use and bundles `vips.wasm` and `vips-heif.wasm` (the latter is needed for AVIF and HEIF decode).
- **`@wordpress/media-utils`** — Handles HTTP transport to the WordPress REST API.

On the PHP side:

- **`gutenberg_is_client_side_media_processing_enabled()`** — Feature gate, filterable via `wp_client_side_media_processing_enabled`.
- **Cross-origin isolation** — `gutenberg_start_cross_origin_isolation_output_buffer()` sends `Document-Isolation-Policy` on `load-post.php`, `load-post-new.php`, `load-site-editor.php`, and `load-widgets.php` for Chromium 137+. The behavior is filterable via `gutenberg_use_document_isolation_policy`.
- **REST API extensions** — New `generate_sub_sizes` and `convert_format` parameters, sideload endpoint (`POST /wp/v2/media/{id}/sideload`), finalize endpoint (`POST /wp/v2/media/{id}/finalize`), `replace_file` flag for HEIC companion uploads, and new response fields (`exif_orientation`, `missing_image_sizes`, `filename`, `filesize`).

For the full architecture deep-dive, see the [client-side media processing architecture documentation](https://developer.wordpress.org/block-editor/explanations/architecture/client-side-media/).

## What plugin developers need to know

### Disabling client-side processing

If your plugin needs to disable client-side media processing, use the `wp_client_side_media_processing_enabled` filter:

```php
add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
```

### Server-side hooks still fire

A common concern: if client-side processing bypasses server-side image generation, do plugins that hook into `wp_generate_attachment_metadata` stop working? No — after all client-side operations complete (including thumbnail sideloads), WordPress calls a finalize endpoint that re-applies this filter, ensuring plugins for watermarking, CDN sync, custom metadata processing, and similar use cases continue to work without modification.

If finalize fails, the error is logged but the upload still succeeds — the call is best-effort so a plugin failure can't block the user's upload.

### Existing filters still work

Client-side processing reads settings from the server and respects:

- `big_image_size_threshold` — Maximum image dimension before scaling.
- `image_editor_output_format` — Automatic format conversion.
- `image_save_progressive` — Progressive/interlaced encoding.
- `wp_image_maybe_exif_rotate` — EXIF rotation.

There is **no** `client_side_supported_mime_types` filter; the supported set (`image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`) is fixed at `CLIENT_SIDE_SUPPORTED_MIME_TYPES`.

### JavaScript hook: `editor.media.imageQuality`

Filter to control image quality (0–1) for client-side resize and crop operations. Default `0.82`.

```js
wp.hooks.addFilter(
	'editor.media.imageQuality',
	'my-plugin/custom-quality',
	( quality, context ) => {
		// context: { item, mimeType, resize }
		if ( context.mimeType === 'image/webp' ) {
			return 0.9;
		}
		return quality;
	}
);
```

The quality value is passed through to the vips worker during resize and crop operations.

### Cross-origin isolation impact

WordPress sends `Document-Isolation-Policy: isolate-and-credentialless` on block editor screens for Chromium 137+. Since DIP is per-document, it doesn't impose the page-wide constraints of COEP/COOP. Notable behavior:

- **External scripts loaded across origins** automatically get a `crossorigin="anonymous"` attribute via the server-side `wp_add_crossorigin_attributes()` output buffer and a client-side MutationObserver. Note: `<img>` was excluded from this list in 7.1 ([#76618](https://github.com/WordPress/gutenberg/pull/76618)) so external image previews don't break.
- **DIP is skipped on admin pages with an `action` other than `edit`**, which keeps third-party page builders that rely on same-origin iframe access functional.

You can override the gating with `gutenberg_use_document_isolation_policy` if you need to force DIP on or off:

```php
add_filter( 'gutenberg_use_document_isolation_policy', '__return_true' );
```

### Content Security Policy (CSP)

If your plugin sets a Content Security Policy, ensure the `worker-src` directive includes `blob:`:

```
Content-Security-Policy: worker-src 'self' blob:;
```

Without this, the WASM processing worker cannot be created and processing falls back to server-side.

## What theme developers need to know

Client-side media processing is transparent to themes. Existing filters (`big_image_size_threshold`, `image_editor_output_format`, etc.) continue to work without modification. Image sizes registered via `add_image_size()` are automatically generated client-side, and sizes that share dimensions with built-in sizes are now deduplicated to a single physical file ([#77036](https://github.com/WordPress/gutenberg/pull/77036)).

## Browser compatibility and fallback

Client-side processing depends on `Document-Isolation-Policy` to enable `SharedArrayBuffer`, which is currently only available in Chromium-based browsers.

| Browser | Minimum Version | Status |
| --- | --- | --- |
| Chrome | 137+ | Full support via Document-Isolation-Policy |
| Edge | 137+ | Full support via Document-Isolation-Policy |
| Firefox | — | Not supported (no Document-Isolation-Policy) — falls back to server-side |
| Safari | — | Not supported for the WASM pipeline; HEIC canvas fallback still works |

On unsupported browsers WordPress falls back to server-side processing automatically. Users see no difference in behavior.

## Feature detection thresholds

In addition to API support, the client checks several runtime conditions before activating the WASM pipeline:

| Check | Threshold | Why |
| --- | --- | --- |
| Device memory | > 2 GB | WASM image processing can OOM on very low-memory devices. |
| CPU cores | ≥ 2 | Lowered from 4 in [#76616](https://github.com/WordPress/gutenberg/pull/76616). |
| Network | not `2g`/`slow-2g`, no Save-Data | The ~13 MB worker download is gated to faster connections; `3g` is allowed. |
| CSP `blob:` workers | must succeed | The worker is created from a blob URL; strict `worker-src` policies block it. |

Failing any check causes a transparent fallback to server-side processing.

## Known limitations

- **Non-Chromium browsers**: Disabled by default because Firefox and Safari don't support `Document-Isolation-Policy`. The HEIC canvas fallback still runs in Safari.
- **Low-memory devices**: Devices reporting 2 GB of RAM or less are excluded.
- **2g / slow-2g / Save-Data**: Excluded because of the ~13 MB worker download.
- **CSP restrictions**: Sites with `worker-src` directives that don't allow `blob:` fall back to server-side.

## Testing and feedback

We encourage plugin and theme developers to test client-side media processing with their products. In particular:

- Verify that uploads work with your plugin's custom image sizes and format settings — including sizes that share dimensions with built-in sizes.
- Test HEIC uploads if you target sites with iPhone-using authors.
- Test AVIF uploads on hosts whose image editor lacks AVIF support.
- Check that cross-origin isolation doesn't break any external resources or embeds your plugin loads in the editor.
- Test with `wp_client_side_media_processing_enabled` returning `false` to ensure your fallback path works.

Please report any issues on the [Gutenberg GitHub repository](https://github.com/WordPress/gutenberg/issues). Related tracking issues:

- [Client-side media processing iteration for WordPress 7.1 (#76756)](https://github.com/WordPress/gutenberg/issues/76756)
- [WordPress 7.0 iteration (historical) (#74333)](https://github.com/WordPress/gutenberg/issues/74333)
- [Documentation tracking issue (#75111)](https://github.com/WordPress/gutenberg/issues/75111)

For detailed developer documentation, see:

- [Architecture explanation](https://developer.wordpress.org/block-editor/explanations/architecture/client-side-media/)
- [Developer how-to guide](https://developer.wordpress.org/block-editor/how-to-guides/client-side-media/)
- [Editor filters reference](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#client-side-media-processing)

Props to @swissspidy, @ajlende, and all contributors who worked on this feature.
