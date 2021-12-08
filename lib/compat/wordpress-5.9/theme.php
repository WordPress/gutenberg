<?php
/**
 * Additions to the WordPress theme.php file
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_is_block_theme' ) ) {
	/**
	 * Returns whether the current theme is a block theme or not.
	 *
	 * @return boolean Whether the current theme is a block theme or not.
	 */
	function wp_is_block_theme() {
		return is_readable( get_theme_file_path( '/block-templates/index.html' ) ) ||
			is_readable( get_theme_file_path( '/templates/index.html' ) );
	}
}

/**
 * Note: We have to maintain this function for backward compatibility with WP 5.8.
 * Only remove once 5.9 is the minimum supported WordPress version for the Gutenberg plugin.
 *
 * @return boolean Whether the current theme is a block theme or not.
 */
function gutenberg_is_fse_theme() {
	return wp_is_block_theme();
}
