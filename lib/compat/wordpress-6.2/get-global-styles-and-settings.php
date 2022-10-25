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
	 * @param boolean $use_cache Whether data should be computed from scratch or use the cache, if available
	 *
	 * @return boolean
	 */
	function wp_theme_has_theme_json( $use_cache = true ) {
		static $theme_has_support = null;

		if ( false === $use_cache ) {
			$theme_has_support = null;
		}

		if ( null !== $theme_has_support ) {
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

if ( ! function_exists( 'wp_theme_clean_theme_json_cached_data' ) ) {
	/**
	 * Clean theme.json related cached data.
	 */
	function wp_theme_clean_theme_json_cached_data() {
		wp_theme_has_theme_json( false );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
	}
}
