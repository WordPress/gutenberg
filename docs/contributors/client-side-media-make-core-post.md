# Client-Side Media Processing in WordPress 7.0

WordPress 7.0 introduces client-side media processing — a new capability that handles image compression, resizing, format conversion, rotation, and thumbnail generation directly in the user's browser using WebAssembly, rather than on the server.

This post outlines what's changing, how it works, and what plugin and theme developers need to know.

## What is client-side media processing?

Traditionally, when a user uploads an image in the block editor, the file is sent to the server where PHP (using GD or Imagick) generates thumbnails, applies format conversions, handles EXIF rotation, and scales large images. This approach is limited by PHP memory constraints, server CPU availability, and the capabilities of the installed image library.

Client-side media processing moves this work to the browser. Images are processed using [wasm-vips](https://github.com/kleisauke/wasm-vips), a WebAssembly compilation of the high-performance libvips image processing library. The processed images — including all thumbnails — are then uploaded to the server, which simply stores them without additional processing.

## Key benefits

- **No more PHP memory limit failures.** Large image processing that would exceed PHP's memory limit now succeeds because it runs in the browser's memory space.
- **Reduced server load.** Image processing is offloaded to the user's device, freeing server CPU and memory for other tasks.
- **Consistent, high-quality output with modern image support.** All users get the same libvips-powered processing regardless of whether the server has GD or Imagick, and regardless of which version is installed.
- **More resilient uploads.** The system can resume uploading individual thumbnails if a network interruption occurs, rather than having to restart the entire upload.


## What changed

Client-side media processing introduces several new capabilities:

- **Browser-based image processing**: Compression, resizing, cropping, format conversion (JPEG, PNG, WebP, AVIF, GIF), EXIF rotation, and progressive/interlaced encoding — all via WebAssembly in a Web Worker.
- **Thumbnail generation in the browser**: All registered image sub-sizes are generated client-side and uploaded individually via a new sideload REST API endpoint.
- **Automatic format conversion**: The existing `image_editor_output_format` filter is respected client-side, enabling automatic conversion (e.g., JPEG to WebP) before upload.
- **Smart fallback**: Browsers that don't support the required features (WebAssembly, SharedArrayBuffer, blob workers) automatically fall back to server-side processing with no user-facing change.
- **Cross-origin isolation**: WordPress now sends the required headers on block editor screens and iframes to enable `SharedArrayBuffer` access for WASM threading. This enables running the image eprocessing in the background - which means the editor remains responsive even during large image uploads.

## Technical overview

The implementation spans three JavaScript packages and several PHP files:

- **`@wordpress/upload-media`** — Manages the upload queue, concurrency (max 5 uploads, max 2 image processing operations), and orchestrates the processing pipeline.
- **`@wordpress/vips`** — Wraps wasm-vips in a Web Worker for non-blocking image processing. The WASM binary is loaded lazily on first use.
- **`@wordpress/media-utils`** — Handles HTTP transport to the WordPress REST API.

On the PHP side:

- **`wp_is_client_side_media_processing_enabled()`** — Feature detection function with the `wp_client_side_media_processing_enabled` filter.
- **Cross-origin isolation headers** — COOP/COEP headers are sent on block editor screens via `wp_start_cross_origin_isolation_output_buffer()`.
- **REST API extensions** — New `generate_sub_sizes` and `convert_format` parameters, a sideload endpoint (`POST /wp/v2/media/{id}/sideload`), and new response fields (`exif_orientation`, `missing_image_sizes`).

For the full architecture deep-dive, see the [client-side media processing architecture documentation](https://developer.wordpress.org/block-editor/explanations/architecture/client-side-media/).

## What plugin developers need to know

### Disabling client-side processing

If your plugin needs to disable client-side media processing, use the `wp_client_side_media_processing_enabled` filter:

```php
add_filter( 'wp_client_side_media_processing_enabled', '__return_false' );
```

### Existing filters still work

Client-side processing reads settings from the server and respects:

- `big_image_size_threshold` — Controls the maximum image dimension before scaling.
- `image_editor_output_format` — Controls automatic format conversion.
- `image_save_progressive` — Controls progressive/interlaced encoding.
- `wp_image_maybe_exif_rotate` — Controls EXIF rotation.

See https://github.com/WordPress/gutenberg/pull/74913 for additional details on filter usage and examples.

### Cross-origin isolation impact

WordPress now sends Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers on block editor screens. This enables `SharedArrayBuffer` but may affect plugins that:

- **Load external scripts without CORS headers**: WordPress automatically adds `crossorigin="anonymous"` attributes, but scripts from origins that don't support CORS may fail to load.
- **Use iframes for third-party embeds**: Some embeds may not work in cross-origin isolated contexts on browsers that don't support the `credentialless` iframe attribute (currently Firefox and Safari).

### Content Security Policy (CSP)

If your plugin sets a Content Security Policy, ensure the `worker-src` directive includes `blob:`:

```
Content-Security-Policy: worker-src 'self' blob:;
```

Without this, the WASM processing worker cannot be created and processing falls back to server-side.

## What theme developers need to know

Client-side media processing is transparent to themes. Existing filters (`big_image_size_threshold`, `image_editor_output_format`, etc.) continue to work without modification. Image sizes registered via `add_image_size()` are automatically generated client-side.

## Browser compatibility and fallback

| Browser | Minimum Version | Status |
| --- | --- | --- |
| Chrome | 92+ | Enabled by default |
| Edge | 92+ | Enabled by default |
| Firefox | 79+ | Disabled by default (no `credentialless` iframe support) |
| Safari | 15.2+ | Disabled by default (no `credentialless` iframe support) |

On unsupported or disabled browsers, WordPress falls back to server-side processing automatically. Users see no difference in behavior.

## Known limitations

- **HEIC/HEIF format**: Not supported due to trademark/licensing concerns. HEIC images fall back to server-side processing.
- **Low-memory devices**: Devices with 2 GB of RAM or less are automatically excluded from client-side processing.
- **CSP restrictions**: Sites with strict Content Security Policy headers that don't allow `blob:` workers will fall back to server-side processing.
- **Data saver / slow networks**: Client-side processing is disabled when the browser reports data saver mode or a 2g/slow-2g connection.
- **Firefox and Safari**: Disabled by default because these browsers don't support the `credentialless` iframe attribute, which means cross-origin isolation can break third-party embed previews. Developers can re-enable via the `wp_client_side_media_processing_enabled` filter.

## Testing and feedback

We encourage plugin and theme developers to test client-side media processing with their products. In particular:

- Verify that uploads work correctly with your plugin's custom image sizes and format settings.
- Check that cross-origin isolation doesn't break any external resources or embeds your plugin loads in the editor.
- Test with the `wp_client_side_media_processing_enabled` filter to ensure fallback behavior works as expected.

Please report any issues on the [Gutenberg GitHub repository](https://github.com/WordPress/gutenberg/issues). Related tracking issues:

- [Client-side media processing umbrella issue (#74333)](https://github.com/WordPress/gutenberg/issues/74333)
- [Documentation tracking issue (#75111)](https://github.com/WordPress/gutenberg/issues/75111)

For detailed developer documentation, see:

- [Architecture explanation](https://developer.wordpress.org/block-editor/explanations/architecture/client-side-media/)
- [Developer how-to guide](https://developer.wordpress.org/block-editor/how-to-guides/client-side-media/)
- [Editor filters reference](https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#client-side-media-processing)

Props to @swissspidy, @ajlende, and all contributors who worked on this feature.
