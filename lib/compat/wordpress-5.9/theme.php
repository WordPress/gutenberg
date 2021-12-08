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
