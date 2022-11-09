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
	 * The result would be cached via the WP_Object_Cache
	 * under the `wp_theme_has_theme_json` key.
	 *
	 * @return boolean
	 */
	function wp_theme_has_theme_json() {
		$cache_group       = 'theme_json';
		$cache_key         = 'wp_theme_has_theme_json';
		$cache_found       = false;
		$theme_has_support = wp_cache_get( $cache_key, $cache_group, false, $cache_found );
		if ( $cache_found ) {
			return $theme_has_support;
		}

		// Has the own theme a theme.json?
		$theme_has_support = is_readable( get_stylesheet_directory() . '/theme.json' );

		// Look up the parent if the child does not have a theme.json.
		if ( ! $theme_has_support ) {
			$theme_has_support = is_readable( get_template_directory() . '/theme.json' );
		}

		wp_cache_set( $cache_key, $theme_has_support, $cache_group );

		return $theme_has_support;
	}
}

if ( ! function_exists( 'wp_theme_clean_theme_json_cached_data' ) ) {
	/**
	 * Clean theme.json related cached data.
	 */
	function wp_theme_clean_theme_json_cached_data() {
		wp_cache_delete( 'wp_theme_has_theme_json', 'theme_json' );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
	}
}
