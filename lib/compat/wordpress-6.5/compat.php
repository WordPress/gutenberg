<?php
/**
 * WordPress 6.5 compatibility functions.
 *
 * @package WordPress
 */

if ( ! function_exists( 'array_is_list' ) ) {
	/**
	 * Polyfill for `array_is_list()` function added in PHP 8.1.
	 *
	 * Determines if the given array is a list.
	 *
	 * An array is considered a list if its keys consist of consecutive numbers from 0 to count($array)-1.
	 *
	 * @see https://github.com/symfony/polyfill-php81/tree/main
	 *
	 * @since 6.5.0
	 *
	 * @param array<mixed> $arr The array being evaluated.
	 * @return bool True if array is a list, false otherwise.
	 */
	function array_is_list( $arr ) {
		if ( ( array() === $arr ) || ( array_values( $arr ) === $arr ) ) {
			return true;
		}

		$next_key = -1;

		foreach ( $arr as $k => $v ) {
			if ( ++$next_key !== $k ) {
				return false;
			}
		}

		return true;
	}
}

/**
 * Sets a global JS variable used to flag whether to direct the Site Logo block's admin urls
 * to the Customizer. This allows Gutenberg running on versions of WordPress < 6.5.0 to
 * support the previous location for the Site Icon settings. This function should not be
 * backported to core, and should be removed when the required WP core version for Gutenberg
 * is >= 6.5.0.
 */
function gutenberg_add_use_customizer_site_logo_url_flag() {
	if ( ! is_wp_version_compatible( '6.5' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalUseCustomizerSiteLogoUrl = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_add_use_customizer_site_logo_url_flag' );
