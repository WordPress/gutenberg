<?php
/**
 * Client-side media processing functions.
 *
 * @package gutenberg
 */

/**
 * Checks whether client-side media processing is enabled.
 *
 * Client-side media processing uses the browser's capabilities to handle
 * tasks like image resizing and compression before uploading to the server.
 *
 * @since 20.8.0
 *
 * @return bool Whether client-side media processing is enabled.
 */
function gutenberg_is_client_side_media_processing_enabled() {
	// Disable in php-wasm environments (e.g. WordPress Playground) where
	// cross-origin isolation headers conflict with the iframe architecture.
	// See https://github.com/WordPress/gutenberg/issues/75941
	if ( 'wasm' === PHP_SAPI ) {
		return false;
	}

	/**
	 * Filters whether client-side media processing is enabled.
	 *
	 * @since 20.8.0
	 *
	 * @param bool $enabled Whether client-side media processing is enabled. Default true.
	 */
	return apply_filters( 'wp_client_side_media_processing_enabled', true );
}
