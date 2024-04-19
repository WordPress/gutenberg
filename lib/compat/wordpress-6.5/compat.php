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

/**
 * Add a Patterns submenu (wp-admin/edit.php?post_type=wp_block) under the Appearance menu
 * for the Classic theme. This function should not be backported to core, and should be
 * removed when the required WP core version for Gutenberg is >= 6.5.0.
 *
 * @global array $submenu
 */
function gutenberg_add_patterns_page_submenu_item() {
	if ( ! is_wp_version_compatible( '6.5' ) && ! wp_is_block_theme() ) {
		// Move the Themes submenu forward and inject a Patterns submenu.
		global $submenu;
		$submenu['themes.php'][4] = $submenu['themes.php'][5];
		$submenu['themes.php'][5] = array( __( 'Patterns', 'gutenberg' ), 'edit_theme_options', 'edit.php?post_type=wp_block' );
		ksort( $submenu['themes.php'], SORT_NUMERIC );
	}
}
add_action( 'admin_init', 'gutenberg_add_patterns_page_submenu_item' );

/**
 * Filter the `wp_die_handler` to allow access to the Site Editor's Patterns page
 * (wp-admin/site-editor.php?path=%2Fpatterns) internally for the Classic theme. This
 * function should not be backported to core, and should be removed when the required
 * WP core version for Gutenberg is >= 6.5.0.
 *
 * @param callable $default_handler The default handler.
 * @return callable The default handler or a custom handler.
 */
function gutenberg_patterns_page_wp_die_handler( $default_handler ) {
	if ( ! is_wp_version_compatible( '6.5' ) && ! wp_is_block_theme() && str_contains( $_SERVER['REQUEST_URI'], 'site-editor.php' ) ) {
		$is_patterns      = isset( $_GET['postType'] ) && 'wp_block' === sanitize_key( $_GET['postType'] );
		$is_patterns_path = isset( $_GET['path'] ) && 'patterns' === sanitize_key( $_GET['path'] );
		if ( $is_patterns || $is_patterns_path ) {
			return '__return_false';
		}
	}
	return $default_handler;
}
add_filter( 'wp_die_handler', 'gutenberg_patterns_page_wp_die_handler' );
