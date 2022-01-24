<?php
/**
 * Load global styles assets in the front-end.
 *
 * @package gutenberg
 */

/*
 * This code lives in script-loader.php
 * where we just load styles using wp_get_global_stylesheet.
 */
if ( ! function_exists( 'wp_get_global_styles' ) ) {
	/**
	 * Fetches the preferences for each origin (core, theme, user)
	 * and enqueues the resulting stylesheet.
	 */
	function gutenberg_enqueue_global_styles_assets() {
		$stylesheet = wp_get_global_stylesheet();
		if ( empty( $stylesheet ) ) {
			return;
		}

		if ( isset( wp_styles()->registered['global-styles'] ) ) {
			// We're in WordPress 5.8, so we overwrite the existing.
			wp_styles()->registered['global-styles']->extra['after'][0] = $stylesheet;
		} else {
			// WordPress 5.7 or lower.
			wp_register_style( 'global-styles', false, array(), true, true );
			wp_add_inline_style( 'global-styles', $stylesheet );
			wp_enqueue_style( 'global-styles' );
		}
	}
	add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles_assets' );
}
