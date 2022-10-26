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
	 * @param boolean $clear_cache Whether the cache should be cleared and theme support recomputed. Default is false.
	 *
	 * @return boolean
	 */
	function wp_theme_has_theme_json( $clear_cache = false ) {
		static $theme_has_support = null;

		if ( false === $clear_cache ) {
			$theme_has_support = null;
		}

		if ( null !== $theme_has_support ) {
			return $theme_has_support;
		}

		// Has the own theme a theme.json?
		$theme_has_support = is_readable( get_stylesheet_directory() . '/theme.json' );

		// Look up the parent if the child does not have a theme.json.
		if ( ! $theme_has_support ) {
			$theme_has_support = is_readable( get_template_directory() . '/theme.json' );
		}

		return $theme_has_support;
	}
}

if ( ! function_exists( 'wp_theme_clean_theme_json_cached_data' ) ) {
	/**
	 * Clean theme.json related cached data.
	 */
	function wp_theme_clean_theme_json_cached_data() {
		wp_theme_has_theme_json( true );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
	}
}
