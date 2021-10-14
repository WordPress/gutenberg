<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

/**
 * Function to get the settings resulting of merging core, theme, and user data.
 *
 * @param array  $path              Path to the specific setting to retrieve. Optional.
 *                                  If empty, will return all settings.
 * @param string $block_name        Which block to retrieve the settings from. Optional
 *                                  If empty, it'll return the settings for the global context.
 * @param string $origin            Which origin to take data from. Optional.
 *                                  It can be 'all' (core, theme, and user) or 'base' (core and theme).
 *                                  If empty or unknown, 'all' is used.
 *
 * @return array The settings to retrieve.
 */
function gutenberg_get_global_settings( $path = array(), $block_name = '', $origin = 'all' ) {
	if ( '' !== $block_name ) {
		$path = array_merge( array( 'blocks', $block_name ), $path );
	}

	$theme_supports = gutenberg_get_default_block_editor_settings();

	if ( 'base' === $origin ) {
		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $theme_supports, 'theme' )->get_settings();
	} else {
		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $theme_supports )->get_settings();
	}

	return _wp_array_get( $settings, $path, $settings );
}

/**
 * Function to get the styles resulting of merging core, theme, and user data.
 *
 * @param array  $path              Path to the specific style to retrieve. Optional.
 *                                  If empty, will return all styles.
 * @param string $block_name        Which block to retrieve the styles from. Optional.
 *                                  If empty, it'll return the styles for the global context.
 * @param string $origin            Which origin to take data from. Optional.
 *                                  It can be 'all' (core, theme, and user) or 'base' (core and theme).
 *                                  If empty or unknown, 'all' is used.
 *
 * @return array The styles to retrieve.
 */
function gutenberg_get_global_styles( $path = array(), $block_name = '', $origin = 'all' ) {
	if ( '' !== $block_name ) {
		$path = array_merge( array( 'blocks', $block_name ), $path );
	}

	if ( 'base' === $origin ) {
		$origin = 'theme';
	} else {
		$origin = 'user';
	}

	$theme_supports = gutenberg_get_default_block_editor_settings();
	$styles         = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $theme_supports, $origin )['styles'];

	return _wp_array_get( $styles, $path, $styles );
}

/**
 * Returns the stylesheet resulting of merging core, theme, and user data.
 *
 * @param string $type     Type of the stylesheet. Optional.
 *                         It accepts 'all', 'block_styles', 'css_variables', 'presets'.
 *                         If empty, it'll resolve to all (theme with theme.json support)
 *                         or 'presets' (theme without theme.json support).
 *
 * @return string Stylesheet.
 */
function gutenberg_get_global_stylesheet( $type = '' ) {
	// Return cached value if it can be used and exists.
	// It's cached by theme to make sure that theme switching clears the cache.
	$can_use_cached = (
		( 'all' === $type ) &&
		( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
		( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) &&
		( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) &&
		! is_admin()
	);
	$transient_name = 'gutenberg_global_styles_' . get_stylesheet();
	if ( $can_use_cached ) {
		$cached = get_transient( $transient_name );
		if ( $cached ) {
			return $cached;
		}
	}

	$supports_theme_json = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();
	$supports_link_color = get_theme_support( 'experimental-link-color' );
	if ( empty( $type ) && ! $supports_theme_json ) {
		$type = 'presets';
	} elseif ( empty( $type ) ) {
		$type = 'all';
	}

	$origins = array( 'core', 'theme', 'user' );
	if ( ! $supports_theme_json && ! $supports_link_color ) {
		// In this case we only enqueue the core presets (CSS Custom Properties + the classes).
		$origins = array( 'core' );
	} elseif ( ! $supports_theme_json && $supports_link_color ) {
		// For the legacy link color feauter to work, the CSS Custom Properties
		// should be in scope (either the core or the theme ones).
		$origins = array( 'core', 'theme' );
	}

	$theme_supports = gutenberg_get_default_block_editor_settings();
	$tree           = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $theme_supports );
	$stylesheet     = $tree->get_stylesheet( $type, $origins );

	if ( $can_use_cached ) {
		// Cache for a minute.
		// This cache doesn't need to be any longer, we only want to avoid spikes on high-traffic sites.
		set_transient( $transient_name, $stylesheet, MINUTE_IN_SECONDS );
	}

	return $stylesheet;
}
