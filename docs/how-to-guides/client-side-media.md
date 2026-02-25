# Client-Side Media Processing

## Overview

Client-side media processing handles image compression, resizing, format conversion, rotation, and thumbnail generation in the browser using WebAssembly, rather than on the server. It is enabled by default in WordPress 7.0 for supported browsers and transparently falls back to server-side processing when unavailable.

This guide covers how plugin and theme developers can interact with, customize, and troubleshoot client-side media processing.

For a deep dive into the architecture, see [Client-side media processing architecture](/docs/explanations/architecture/client-side-media.md).

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

Client-side processing will apply this conversion before uploading. If a PNG has transparency and the target format is JPEG, the conversion is skipped to preserve the alpha channel.

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

## Cross-origin isolation considerations

Client-side media processing requires [cross-origin isolation](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated), which WordPress enables automatically on block editor screens. This has implications for plugins:

### Impact on plugins

-   **Third-party embeds**: Some embeds (e.g., Facebook, SmugMug) may not work in cross-origin isolated contexts on browsers that don't support the `credentialless` iframe attribute. WordPress disables embed previews for known-incompatible providers.
-   **External scripts**: Scripts loaded from other origins will automatically get a `crossorigin="anonymous"` attribute added. This is handled by WordPress both server-side (via HTML processing) and client-side (via a MutationObserver).
-   **iframes**: Non-sandboxed iframes also get the `crossorigin` and `credentialless` attributes where supported.

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
| `image_size` | string | Yes | The image size name (e.g., `thumbnail`, `medium`, `large`, `scaled`, `original`). |
| `convert_format` | boolean | No | Whether to apply server-side format conversion. Default `true`. |

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

## Troubleshooting

| Problem | Cause | Solution |
| --- | --- | --- |
| Client-side processing not activating | `SharedArrayBuffer` unavailable | Verify cross-origin isolation headers are being sent. Check `window.crossOriginIsolated` in the browser console. |
| WASM module fails to load | Incorrect MIME type for `.wasm` files | Add `AddType application/wasm wasm` to your `.htaccess` or server configuration. WordPress does this automatically for Apache via `mod_rewrite_rules`. |
| CSP blocks worker creation | `worker-src` directive too restrictive | Add `blob:` to the `worker-src` CSP directive: `worker-src 'self' blob:` |
| Embed previews broken | Cross-origin isolation blocks third-party iframes | This is expected on browsers without `credentialless` iframe support (Firefox, Safari). Embed previews are automatically disabled for incompatible providers. |
| Processing falls back on capable browser | Feature disabled server-side | Check that `wp_client_side_media_processing_enabled` filter is not returning `false`. |
| Large images cause browser to slow down | Insufficient device memory | Devices with ≤ 2 GB RAM are automatically excluded. Consider reducing the big image size threshold for your site. |
| Upload fails with "image transcoding error" | Unsupported format or corrupt file | Verify the file is a supported format (JPEG, PNG, WebP, AVIF, GIF). HEIC/HEIF is not supported. |

## Browser compatibility

| Browser | Minimum Version | Notes |
| --- | --- | --- |
| Chrome | 92+ | Full support. |
| Edge | 92+ | Full support. |
| Firefox | 79+ | Disabled by default (no `credentialless` iframe support). Can be re-enabled via the `wp_client_side_media_processing_enabled` filter. |
| Safari | 15.2+ | Disabled by default (no `credentialless` iframe support). Uses `require-corp` COEP mode. |

On unsupported browsers, WordPress automatically falls back to server-side processing with no user-facing changes.
