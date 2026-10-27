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
	/**
	 * Filters whether client-side media processing is enabled.
	 *
	 * @since 20.8.0
	 *
	 * @param bool $enabled Whether client-side media processing is enabled. Default true.
	 */
	return apply_filters( 'wp_client_side_media_processing_enabled', true );
}
