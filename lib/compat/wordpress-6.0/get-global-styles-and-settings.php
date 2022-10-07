<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

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
		$path = array_merge( array( 'blocks', $context['block_name'] ), $path );
	}
	$origin = 'custom';
	if ( isset( $context['origin'] ) && 'base' === $context['origin'] ) {
		$origin = 'theme';
	}
	$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $origin )->get_settings();
	return _wp_array_get( $settings, $path, $settings );
}

/**
 * Function to get the styles resulting of merging core, theme, and user data.
 *
 * @param array $path    Path to the specific style to retrieve. Optional.
 *                       If empty, will return all styles.
 * @param array $context {
 *     Metadata to know where to retrieve the $path from. Optional.
 *
 *     @type string $block_name Which block to retrieve the styles from.
 *                              If empty, it'll return the styles for the global context.
 *     @type string $origin     Which origin to take data from.
 *                              Valid values are 'all' (core, theme, and user) or 'base' (core and theme).
 *                              If empty or unknown, 'all' is used.
 * }
 *
 * @return array The styles to retrieve.
 */
function gutenberg_get_global_styles( $path = array(), $context = array() ) {
	if ( ! empty( $context['block_name'] ) ) {
		$path = array_merge( array( 'blocks', $context['block_name'] ), $path );
	}
	$origin = 'custom';
	if ( isset( $context['origin'] ) && 'base' === $context['origin'] ) {
		$origin = 'theme';
	}
	$styles = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $origin )->get_raw_data()['styles'];
	return _wp_array_get( $styles, $path, $styles );
}

/**
 * Returns a string containing the SVGs to be referenced as filters (duotone).
 *
 * @return string
 */
function gutenberg_get_global_styles_svg_filters() {
	// Return cached value if it can be used and exists.
	// It's cached by theme to make sure that theme switching clears the cache.
	$transient_name = 'gutenberg_global_styles_svg_filters_' . get_stylesheet();
	$can_use_cached = (
		( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
		( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) &&
		( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) &&
		! is_admin()
	);
	if ( $can_use_cached ) {
		$cached = get_transient( $transient_name );
		if ( $cached ) {
			return $cached;
		}
	}

	$supports_theme_json = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();

	$origins = array( 'default', 'theme', 'custom' );
	if ( ! $supports_theme_json ) {
		$origins = array( 'default' );
	}

	$tree = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$svgs = $tree->get_svg_filters( $origins );

	if ( $can_use_cached ) {
		// Cache for a minute, same as gutenberg_get_global_stylesheet.
		set_transient( $transient_name, $svgs, MINUTE_IN_SECONDS );
	}

	return $svgs;
}
