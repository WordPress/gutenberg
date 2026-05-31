# Client-Side Media Processing in WordPress 7.1

WordPress 7.1 ships client-side media processing — a capability that handles image compression, resizing, format conversion, rotation, and thumbnail generation directly in the user's browser using WebAssembly, rather than on the server.

This post outlines what's changing, how it works, and what plugin and theme developers need to know.

## What is client-side media processing?

Traditionally, when a user uploads an image in the block editor, the file is sent to the server where PHP (using GD or Imagick) generates thumbnails, applies format conversions, handles EXIF rotation, and scales large images. This approach is limited by PHP memory constraints, server CPU availability, and the capabilities of the installed image library.

Client-side media processing moves this work to the browser. Images are processed using [wasm-vips](https://github.com/kleisauke/wasm-vips), a WebAssembly compilation of the high-performance libvips image processing library. The processed images — including all thumbnails — are then uploaded to the server, which simply stores them. After all client-side operations complete, a finalize step applies the `wp_generate_attachment_metadata` filter with context `'update'` so plugins see the full sub-size metadata. This mirrors how the server already handles big-image uploads, where sub-sizes are deferred and trigger the same `'update'` pass.

## Key benefits

- **No more PHP memory limit failures.** Large image processing that would exceed PHP's memory limit now succeeds because it runs in the browser's memory space.
- **Reduced server load.** Image processing is offloaded to the user's device, freeing server CPU and memory for other tasks.
- **Consistent, high-quality output with modern image support.** All users get the same libvips-powered processing regardless of whether the server has GD or Imagick, and regardless of which version is installed.
- **Faster downloads for visitors.** libvips produces better-compressed output than GD or Imagick, so the generated images served to site visitors are smaller and load faster.
- **iPhone photos just work.** HEIC images can be decoded in the browser and converted to JPEG before upload, even on hosts without server-side HEIC support. **Note**: HEIC decode relies on platform codecs and is supported in Chromium browsers (Chrome, Edge, Brave) on macOS and on Windows with HEVC support, and in Safari on macOS. Firefox is not supported.
- **AVIF without server-side AVIF support.** Hosts whose PHP image editor doesn't support AVIF can still accept AVIF uploads when client-side processing is active. The MIME-type check is bypassed for client-decoded uploads — see the security FAQ below for details.
- **More resilient uploads.** Sub-size uploads are independent requests, so a network hiccup mid-upload doesn't lose the entire batch.

## What's included

- **Browser-based image processing** — Compression, resizing, cropping, format conversion (JPEG, PNG, WebP, AVIF, GIF), EXIF rotation, and progressive/interlaced encoding via WebAssembly in a Web Worker.
- **Thumbnail generation in the browser** — All registered image sub-sizes are generated client-side and uploaded individually via a new sideload REST API endpoint. Sizes that share dimensions with built-in sizes (e.g. Twenty Eleven's `large` matches `medium_large`) are deduplicated to a single physical file registered under all matching size names.
- **HEIC/HEIF support** — iPhone photos (`image/heic`, `image/heif`) are decoded in the browser via three fallback strategies (`createImageBitmap`, `HTMLImageElement` + `OffscreenCanvas`, and HEIC container parsing + WebCodecs `VideoDecoder`) and uploaded as JPEG. The original HEIC is kept as a companion file in `$metadata['original']` and removed when the attachment is deleted.
- **AVIF end-to-end uploads** — `vips-heif.wasm` is bundled in the worker so AVIF can be decoded client-side, and the REST API accepts the upload on hosts without server-side AVIF support.
- **Automatic format conversion** — The existing `image_editor_output_format` filter is respected client-side, enabling automatic conversion (e.g., JPEG to WebP) before upload.
- **Cross-origin isolation via Document-Isolation-Policy** — WordPress sends `Document-Isolation-Policy: isolate-and-credentialless` on block editor screens for Chromium 137+. DIP provides per-document isolation without breaking other iframes on the page.
- **Server-side hook compatibility** — `wp_generate_attachment_metadata` fires the same way as for a server-side upload: once with context `'create'` during the initial upload and again with `'update'` after `POST /wp/v2/media/{id}/finalize` runs. Plugins that hook into it (watermarking, CDN sync, etc.) continue to work, the same way they already handle the deferred-subsize pass on big-image uploads.
- **Smart fallback** — Browsers that don't support the required features automatically fall back to server-side processing with no user-facing change.
- **Image quality filter** — `editor.media.imageQuality` JavaScript filter to control client-side resize/crop quality (0–1, default 0.82).

## Technical overview

The implementation spans three JavaScript packages and several PHP files:

- **`@wordpress/upload-media`** — Manages the upload queue, concurrency (max 5 uploads, max 2 image processing operations), and orchestrates the pipeline.
- **`@wordpress/vips`** — Wraps wasm-vips in a Web Worker for non-blocking image processing. The WASM bundle is loaded lazily on first use and bundles `vips.wasm` and `vips-heif.wasm` (the latter is needed for AVIF and HEIF decode).
- **`@wordpress/media-utils`** — Handles HTTP transport to the WordPress REST API.

On the PHP side:

- **`gutenberg_is_client_side_media_processing_enabled()`** — Feature gate, filterable via `wp_client_side_media_processing_enabled`.
- **Cross-origin isolation** — `gutenberg_start_cross_origin_isolation_output_buffer()` sends `Document-Isolation-Policy` on `load-post.php`, `load-post-new.php`, `load-site-editor.php`, and `load-widgets.php` for Chromium 137+. The behavior is filterable via `gutenberg_use_document_isolation_policy`.
- **REST API extensions** — New `generate_sub_sizes` and `convert_format` parameters, sideload endpoint (`POST /wp/v2/media/{id}/sideload`), finalize endpoint (`POST /wp/v2/media/{id}/finalize`), `replace_file` flag for HEIC companion uploads, and new response fields (`exif_orientation`, `missing_image_sizes`, `filename`, `filesize`).

For the full architecture deep-dive, see the [client-side media processing architecture documentation](https://developer.wordpress.org/block-editor/explanations/architecture/client-side-media-architecture/).

## What plugin developers need to know

### Disabling client-side processing

If your plugin needs to disable client-side media processing, use the `wp_client_side_media_processing_enabled` filter:

```php
add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
```

### Server-side hooks still fire

A common concern: if client-side processing bypasses server-side image generation, do plugins that hook into `wp_generate_attachment_metadata` stop working? No — the filter fires the same way it does during a server-side upload, just with the work shifted around. WordPress fires it once with context `'create'` during the initial upload, and again with `'update'` after the finalize endpoint runs (once all client-side sub-size sideloads are complete). Plugins for watermarking, CDN sync, custom metadata processing, and similar use cases continue to work without modification — write them idempotently so they handle both passes correctly. This double-fire pattern matches how WordPress already handles big-image uploads on the server, where sub-size generation is deferred and triggers a second `'update'` pass.

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

- **External scripts loaded across origins** automatically get a `crossorigin="anonymous"` attribute via the server-side `wp_add_crossorigin_attributes()` output buffer and a client-side MutationObserver. `<img>` is excluded so external image previews aren't affected.
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

Client-side media processing is transparent to themes. Existing filters (`big_image_size_threshold`, `image_editor_output_format`, etc.) continue to work without modification. Image sizes registered via `add_image_size()` are automatically generated client-side, and sizes that share dimensions with built-in sizes are deduplicated to a single physical file.

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
| CPU cores | ≥ 2 | WASM image processing benefits from at least one core for the worker plus one for the UI thread. |
| Network | not `2g`/`slow-2g`, no [`Save-Data` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Save-Data) | The ~13 MB worker download is gated to faster connections; `3g` is allowed. |
| CSP `blob:` workers | must succeed | The worker is created from a blob URL; strict `worker-src` policies block it. |

Failing any check causes a transparent fallback to server-side processing.

## Known limitations

- **Non-Chromium browsers**: Disabled by default because Firefox and Safari don't support `Document-Isolation-Policy`. The HEIC canvas fallback still runs in Safari.
- **Low-memory devices**: Devices reporting 2 GB of RAM or less are excluded.
- **2g / slow-2g / Save-Data**: Excluded because of the ~13 MB worker download.
- **CSP restrictions**: Sites with `worker-src` directives that don't allow `blob:` fall back to server-side.

## Frequently asked questions

### Isn't this just a bandwidth optimization?

No — and it isn't a bandwidth win at all. The client uploads the original plus every sub-size, so total bytes over the wire actually go *up* compared to the server-side path (which receives only the original). The point is **server CPU and memory relief**: hosts no longer pay the GD/Imagick cost of generating sub-sizes on upload, which is one of the most common causes of PHP timeouts and memory-limit failures on shared hosting. See "Key benefits" above.

### Doesn't the "never trust the client" rule apply here?

Client-side processing is a **performance optimization, not a trust boundary**. The server still validates every uploaded file — MIME type, dimensions, capability checks, sanitization — and runs the same `wp_generate_attachment_metadata` filter chain. If the browser can't or won't process the file, WordPress falls back to server-side processing transparently.

The validation surface is preserved with one intentional exception: AVIF uploads from the client-side path bypass the server's `wp_prevent_unsupported_mime_type_uploads` check when `generate_sub_sizes=false`, so hosts whose PHP image editor doesn't support AVIF can still accept client-decoded AVIF files.

### What happens if the browser can't process the image?

Server-side processing runs as before. The fallback is automatic and transparent to the user — no UI change, no error. The exact gating (browser features, device memory, CPU cores, network class, CSP) is described in "Feature detection thresholds" above.

### Will my plugin's `wp_generate_attachment_metadata` hooks still run?

Yes. The filter fires the same way as during a server-side upload: once with context `'create'` during the initial upload, and again with `'update'` after the finalize endpoint runs (once all client-side sub-size sideloads complete). Watermarking, CDN sync, custom metadata processing, and similar plugins keep working without modification — write them idempotently so they handle both passes. See "Server-side hooks still fire" above.

### Does this change the format my users upload?

Only if `image_editor_output_format` says so — the existing filter is honored client-side. The one new behavior is HEIC: HEIC inputs are converted to JPEG before upload and the original is kept as a companion file. AVIF inputs upload as AVIF, even on hosts whose server-side image editor lacks AVIF support.

### Why aren't Firefox and Safari supported?

They don't ship `Document-Isolation-Policy`, which is what enables `SharedArrayBuffer` (required for the WASM pipeline). Users on those browsers get the existing server-side path — no regression. The HEIC canvas fallback still works in Safari for HEIC inputs.

## Testing and feedback

We encourage plugin and theme developers to test client-side media processing with their products. In particular:

- Verify that uploads work with your plugin's custom image sizes and format settings — including sizes that share dimensions with built-in sizes.
- Test HEIC uploads if you target sites with iPhone-using authors.
- Test AVIF uploads on hosts whose image editor lacks AVIF support.
- Check that cross-origin isolation doesn't break any external resources or embeds your plugin loads in the editor.
- Test with `wp_client_side_media_processing_enabled` returning `false` to ensure your fallback path works.

Please report any issues on the [Gutenberg GitHub repository](https://github.com/WordPress/gutenberg/issues). Related tracking issues:

- [Client-side media processing iteration for WordPress 7.1 (#76756)](https://github.com/WordPress/gutenberg/issues/76756)
- [Documentation tracking issue (#75111)](https://github.com/WordPress/gutenberg/issues/75111)

For detailed developer documentation, see:

- [Architecture explanation](https://developer.wordpress.org/block-editor/explanations/architecture/client-side-media-architecture/)
- [Developer how-to guide](https://developer.wordpress.org/block-editor/how-to-guides/client-side-media/)
- [Editor filters reference](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#client-side-media-processing)

Props to @swissspidy, @ajlende, and all contributors who worked on this feature.
