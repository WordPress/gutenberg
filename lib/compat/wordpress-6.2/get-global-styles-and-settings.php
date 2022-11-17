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
	 * The result would be cached via the WP_Object_Cache.
	 * It can be cleared by calling wp_theme_has_theme_json_clean_cache().
	 *
	 * @return boolean
	 */
	function wp_theme_has_theme_json() {
		$cache_group       = 'theme_json';
		$cache_key         = 'wp_theme_has_theme_json';
		$theme_has_support = wp_cache_get( $cache_key, $cache_group );

		/**
		 * $theme_has_support is stored as a int in the cache.
		 *
		 * The reason not to store it as a boolean is to avoid working
		 * with the $found parameter which apparently had some issues in some implementations
		 * https://developer.wordpress.org/reference/functions/wp_cache_get/
		 */
		if ( 0 === $theme_has_support || 1 === $theme_has_support ) {
			return (bool) $theme_has_support;
		}

		// Has the own theme a theme.json?
		$theme_has_support = is_readable( get_stylesheet_directory() . '/theme.json' ) ? 1 : 0;

		// Look up the parent if the child does not have a theme.json.
		if ( 0 === $theme_has_support ) {
			$theme_has_support = is_readable( get_template_directory() . '/theme.json' ) ? 1 : 0;
		}

		wp_cache_set( $cache_key, $theme_has_support, $cache_group );

		return (bool) $theme_has_support;
	}
}

if ( ! function_exists( 'wp_theme_has_theme_json_clean_cache' ) ) {
	/**
	 * Function to clean the cache used by wp_theme_has_theme_json method.
	 */
	function wp_theme_has_theme_json_clean_cache() {
		wp_cache_delete( 'wp_theme_has_theme_json', 'theme_json' );
	}
}

if ( ! function_exists( '_wp_theme_has_theme_json_clean_cache_upon_upgrading_active_theme' ) ) {
	/**
	 * Private function to clean the cache used by wp_theme_has_theme_json method.
	 *
	 * It is hooked into the `upgrader_process_complete` action.
	 *
	 * @see default-filters.php
	 *
	 * @param WP_Upgrader $upgrader Instance of WP_Upgrader class.
	 * @param array       $options Metadata that identifies the data that is updated.
	 */
	function _wp_theme_has_theme_json_clean_cache_upon_upgrading_active_theme( $upgrader, $options ) {
		// The cache only needs cleaning when the active theme was updated.
		if (
			'update' === $options['action'] &&
			'theme' === $options['type'] &&
			( isset( $options['themes'][ get_stylesheet() ] ) || isset( $options['themes'][ get_template() ] ) )
		) {
			wp_theme_has_theme_json_clean_cache();
		}
	}
}
