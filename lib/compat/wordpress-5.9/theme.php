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
 * The `validate_theme_requirements` method is using `gutenberg_is_fse_theme` in older versions of WP.
 *
 * @return boolean Whether the current theme is a block theme or not.
 */
function gutenberg_is_fse_theme() {
	return wp_is_block_theme();
}
