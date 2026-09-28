<?php
/**
 * Plugin Name: Gutenberg Test Plugin: Disable Cross-Origin Isolation
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disable-cross-origin-isolation
 */

/*
 * Skip the Document-Isolation-Policy header while leaving client-side media
 * processing enabled. Without cross-origin isolation, SharedArrayBuffer is
 * unavailable, so the full VIPS/WASM pipeline fails feature detection and the
 * editor falls back to the HEIC canvas conversion mode — mirroring Safari,
 * where full client-side processing is unsupported but HEIC files are still
 * converted to JPEG via createImageBitmap + OffscreenCanvas before upload.
 */
add_filter( 'gutenberg_use_document_isolation_policy', '__return_false' );
