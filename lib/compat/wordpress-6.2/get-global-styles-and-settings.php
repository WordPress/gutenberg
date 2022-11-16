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

		if ( true === $clear_cache ) {
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
	/**
	 * Filters whether the cached global stylesheet can be used.
	 *
	 * @since 14.6.0
	 *
	 * @param boolean $can_use_cached Whether the cached global stylesheet can be used.
	 */
	$can_use_cached = apply_filters(
		'global_stylesheet_can_use_cache',
		( empty( $types ) ) &&
		( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
		( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG )
	);
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
	WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
}

/**
 * Private function to clean the cache used by the `gutenberg_get_global_stylesheet` function after an upgrade.
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
		( 'theme' === $options['type'] && array_key_exists( get_stylesheet(), $options['themes'] ) )
	) {
		gutenberg_get_global_stylesheet_clean_cache();
	}
}

