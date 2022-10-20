<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_theme_has_theme_json' ) ) {
	/**
	 * Whether a theme or its parent have a theme.json file.
	 *
	 * @return boolean
	 */
	function wp_theme_has_theme_json() {
		static $theme_has_support = null;

		if ( isset( $theme_has_support ) ) {
			return $theme_has_support;
		}

		// Has the own theme a theme.json?
		$candidate         = get_stylesheet_directory() . '/theme.json';
		$theme_has_support = is_readable( $candidate );

		// Has the parent a theme.json if the theme does not?
		if ( ! $theme_has_support ) {
			$candidate         = get_template_directory() . '/theme.json';
			$theme_has_support = is_readable( $candidate );
		}

		return $theme_has_support;
	}
}