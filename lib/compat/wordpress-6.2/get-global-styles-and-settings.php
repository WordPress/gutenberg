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
		 */
		if (
			// Ignore cache when `WP_DEBUG` is enabled, so it doesn't interfere with the theme developers workflow.
			( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
			( 0 === $theme_has_support || 1 === $theme_has_support )
		) {
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

/**
 * Returns the stylesheet resulting of merging core, theme, and user data.
 *
 * @param array $types Types of styles to load. Optional.
 *                     It accepts 'variables', 'styles', 'presets' as values.
 *                     If empty, it'll load all for themes with theme.json support
 *                     and only [ 'variables', 'presets' ] for themes without theme.json support.
 *
 * @return string Stylesheet.
 */
function gutenberg_get_global_stylesheet( $types = array() ) {
	// Ignore cache when `WP_DEBUG` is enabled, so it doesn't interfere with the theme developers workflow.
	$can_use_cached = empty( $types ) && ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG );
	$cache_key      = 'gutenberg_get_global_stylesheet';
	$cache_group    = 'theme_json';
	if ( $can_use_cached ) {
		$cached = wp_cache_get( $cache_key, $cache_group );
		if ( $cached ) {
			return $cached;
		}
	}
	$tree                = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$supports_theme_json = wp_theme_has_theme_json();
	if ( empty( $types ) && ! $supports_theme_json ) {
		$types = array( 'variables', 'presets', 'base-layout-styles' );
	} elseif ( empty( $types ) ) {
		$types = array( 'variables', 'styles', 'presets' );
	}

	/*
	 * If variables are part of the stylesheet,
	 * we add them.
	 *
	 * This is so themes without a theme.json still work as before 5.9:
	 * they can override the default presets.
	 * See https://core.trac.wordpress.org/ticket/54782
	 */
	$styles_variables = '';
	if ( in_array( 'variables', $types, true ) ) {
		/*
		 * We only use the default, theme, and custom origins.
		 * This is because styles for blocks origin are added
		 * at a later phase (render cycle) so we only render the ones in use.
		 * @see wp_add_global_styles_for_blocks
		 */
		$origins          = array( 'default', 'theme', 'custom' );
		$styles_variables = $tree->get_stylesheet( array( 'variables' ), $origins );
		$types            = array_diff( $types, array( 'variables' ) );
	}

	/*
	 * For the remaining types (presets, styles), we do consider origins:
	 *
	 * - themes without theme.json: only the classes for the presets defined by core
	 * - themes with theme.json: the presets and styles classes, both from core and the theme
	 */
	$styles_rest = '';
	if ( ! empty( $types ) ) {
		/*
		 * We only use the default, theme, and custom origins.
		 * This is because styles for blocks origin are added
		 * at a later phase (render cycle) so we only render the ones in use.
		 * @see wp_add_global_styles_for_blocks
		 */
		$origins = array( 'default', 'theme', 'custom' );
		if ( ! $supports_theme_json ) {
			$origins = array( 'default' );
		}
		$styles_rest = $tree->get_stylesheet( $types, $origins );
	}
	$stylesheet = $styles_variables . $styles_rest;
	if ( $can_use_cached ) {
		wp_cache_set( $cache_key, $stylesheet, $cache_group );
	}
	return $stylesheet;
}

/**
 * Clean the cache used by the `gutenberg_get_global_stylesheet` function.
 */
function gutenberg_get_global_stylesheet_clean_cache() {
	wp_cache_delete( 'gutenberg_get_global_stylesheet', 'theme_json' );
}

/**
 * Private function to clean the cache used by the `gutenberg_get_global_stylesheet` function after an upgrade.
 *
 * It is hooked into the `upgrader_process_complete` action.
 *
 * @see default-filters.php
 *
 * @param WP_Upgrader $upgrader WP_Upgrader instance.
 * @param array       $options  Array of bulk item update data.
 */
function _gutenberg_get_global_stylesheet_clean_cache_upon_upgrading( $upgrader, $options ) {
	if ( 'update' !== $options['action'] ) {
		return;
	}

	if (
		'core' === $options['type'] ||
		'plugin' === $options['type'] ||
		// Clean cache only if the active theme was updated.
		( 'theme' === $options['type'] && ( isset( $options['themes'][ get_stylesheet() ] ) || isset( $options['themes'][ get_template() ] ) ) )
	) {
		gutenberg_get_global_stylesheet_clean_cache();
	}
}

/**
 * Function to get the settings resulting of merging core, theme, and user data.
 *
 * @param array $path    Path to the specific setting to retrieve. Optional.
 *                       If empty, will return all settings.
 * @param array $context {
 *     Metadata to know where to retrieve the $path from. Optional.
 *
 *     @type string $block_name Which block to retrieve the settings from.
 *                              If empty, it'll return the settings for the global context.
 *     @type string $origin     Which origin to take data from.
 *                              Valid values are 'all' (core, theme, and user) or 'base' (core and theme).
 *                              If empty or unknown, 'all' is used.
 * }
 *
 * @return array The settings to retrieve.
 */
function gutenberg_get_global_settings( $path = array(), $context = array() ) {
	if ( ! empty( $context['block_name'] ) ) {
		$new_path = array( 'blocks', $context['block_name'] );
		foreach ( $path as $subpath ) {
			$new_path[] = $subpath;
		}
		$path = $new_path;
	}

	// This is the default value when no origin is provided or when it is 'all'.
	$origin = 'custom';
	if (
		! wp_theme_has_theme_json() ||
		( isset( $context['origin'] ) && 'base' === $context['origin'] )
	) {
		$origin = 'theme';
	}

	$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $origin )->get_settings();
	return _wp_array_get( $settings, $path, $settings );
}
