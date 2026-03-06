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

/**
 * Returns the major Chromium version from the current request's User-Agent.
 *
 * Matches all Chromium-based browsers (Chrome, Edge, Opera, Brave).
 *
 * @return int|null The major Chromium version, or null if not a Chromium browser.
 */
function gutenberg_get_chromium_major_version(): ?int {
	if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
		return null;
	}
	if ( preg_match( '/Chrome\/(\d+)/', $_SERVER['HTTP_USER_AGENT'], $matches ) ) {
		return (int) $matches[1];
	}
	return null;
}

/**
 * Disables client-side media processing for non-Chromium browsers.
 *
 * Safari and Firefox lack support for Document-Isolation-Policy,
 * which is required for cross-origin isolation (SharedArrayBuffer).
 *
 * @param bool $enabled Whether client-side media processing is enabled.
 * @return bool Filtered value.
 */
function gutenberg_disable_media_processing_for_non_chromium( $enabled ) {
	if ( ! $enabled ) {
		return $enabled;
	}

	// Don't gate non-HTTP contexts (CLI, cron) — no browser to check.
	if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
		return $enabled;
	}

	// Only enable for Chromium-based browsers.
	if ( null === gutenberg_get_chromium_major_version() ) {
		return false;
	}

	return $enabled;
}
add_filter( 'wp_client_side_media_processing_enabled', 'gutenberg_disable_media_processing_for_non_chromium' );
