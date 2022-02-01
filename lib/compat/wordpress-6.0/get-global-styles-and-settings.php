<?php
/**
 * API to interact with global settings & styles.
 *
 * @package gutenberg
 */

 if ( ! function_exists( 'wp_get_global_styles_svg_filters' ) ) {
	/**
	 * Returns a string containing the SVGs to be referenced as filters (duotone).
	 *
	 * @return string
	 */
	function wp_get_global_styles_svg_filters() {
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

		$origins = array( 'default', 'theme', 'user' );
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
}
