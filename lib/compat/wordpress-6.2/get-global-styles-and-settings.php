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
		 * $theme_has_support is stored as an int in the cache.
		 *
		 * The reason not to store it as a boolean is to avoid working
		 * with the $found parameter which apparently had some issues in some implementations
		 * https://developer.wordpress.org/reference/functions/wp_cache_get/
		 *
		 * Ignore cache when `WP_DEBUG` is enabled, so it doesn't interfere with the theme developers workflow.
		 */
		if ( ! WP_DEBUG && is_int( $theme_has_support ) ) {
			return (bool) $theme_has_support;
		}

		// Has the own theme a theme.json?
		$theme_has_support = is_readable( get_stylesheet_directory() . '/theme.json' );

		// Look up the parent if the child does not have a theme.json.
		if ( ! $theme_has_support ) {
			$theme_has_support = is_readable( get_template_directory() . '/theme.json' );
		}

		$theme_has_support = $theme_has_support ? 1 : 0;

		wp_cache_set( $cache_key, $theme_has_support, $cache_group );

		return (bool) $theme_has_support;
	}
}

if ( ! function_exists( 'wp_theme_has_theme_json_clean_cache' ) ) {
	/**
	 * Function to clean the cache used by wp_theme_has_theme_json method.
	 *
	 * Not to backport to core. Delete it instead.
	 */
	function wp_theme_has_theme_json_clean_cache() {
		_deprecated_function( __METHOD__, '14.7' );
	}
}

/**
 * Gets the global styles custom css from theme.json.
 *
 * @return string
 */
function gutenberg_get_global_styles_custom_css() {
	// Ignore cache when `WP_DEBUG` is enabled, so it doesn't interfere with the theme developers workflow.
	$can_use_cached = ! WP_DEBUG;
	$cache_key      = 'gutenberg_get_global_custom_css';
	$cache_group    = 'theme_json';
	if ( $can_use_cached ) {
		$cached = wp_cache_get( $cache_key, $cache_group );
		if ( $cached ) {
			return $cached;
		}
	}

	if ( ! wp_theme_has_theme_json() ) {
		return '';
	}

	$tree       = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$stylesheet = $tree->get_custom_css();

	if ( $can_use_cached ) {
		wp_cache_set( $cache_key, $stylesheet, $cache_group );
	}

	return $stylesheet;
}

/**
 * Private function to clean the caches used by gutenberg_get_global_settings method.
 *
 * @access private
 */
function _gutenberg_clean_theme_json_caches() {
	wp_cache_delete( 'wp_theme_has_theme_json', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_stylesheet', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_settings_custom', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_settings_theme', 'theme_json' );
	wp_cache_delete( 'gutenberg_get_global_custom_css', 'theme_json' );
	WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
}

/**
 * Tell the cache mechanisms not to persist theme.json data across requests.
 * The data stored under this cache group:
 *
 * - wp_theme_has_theme_json
 * - gutenberg_get_global_settings
 * - gutenberg_get_global_stylesheet
 *
 * There is some hooks consumers can use to modify parts
 * of the theme.json logic.
 * See https://make.wordpress.org/core/2022/10/10/filters-for-theme-json-data/
 *
 * The rationale to make this cache group non persistent is to make sure derived data
 * from theme.json is always fresh from the potential modifications done via hooks
 * that can use dynamic data (modify the stylesheet depending on some option,
 * or settings depending on user permissions, etc.).
 *
 * A different alternative considered was to invalidate the cache upon certain
 * events such as options add/update/delete, user meta, etc.
 * It was judged not enough, hence this approach.
 * See https://github.com/WordPress/gutenberg/pull/45372
 */
function _gutenberg_add_non_persistent_theme_json_cache_group() {
	wp_cache_add_non_persistent_groups( 'theme_json' );
}
add_action( 'plugins_loaded', '_gutenberg_add_non_persistent_theme_json_cache_group' );
