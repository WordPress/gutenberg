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
	// Running on WordPress 5.8.
	function gutenberg_enqueue_global_styles_assets() {
		$separate_assets = wp_should_load_separate_core_block_assets();
		$stylesheet      = wp_get_global_stylesheet();
		if ( empty( $stylesheet ) ) {
			return;
		}

		if (
			( doing_action( 'wp_footer' ) && ! $separate_assets ) ||
			( doing_action( 'wp_enqueue_scripts' ) && $separate_assets )
		) {
			// Block themes are not supported in WordPress 5.8.
			// Classic themes load the GS stylesheet in the head by default,
			// and load in body if they opted-in into loading separate assets.
			return;
		}

		if ( isset( wp_styles()->registered['global-styles'] ) ) {
			// There's a GS stylesheet (theme has theme.json),
			// so we overwrite it.
			wp_styles()->registered['global-styles']->extra['after'][0] = $stylesheet;
		} else {
			// There's no GS stylesheet (theme has no theme.json),
			// so we enqueue a new one.
			wp_register_style( 'global-styles', false, array(), true, true );
			wp_add_inline_style( 'global-styles', $stylesheet );
			wp_enqueue_style( 'global-styles' );
		}
	}
	add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_global_styles_assets' );
	add_action( 'wp_footer', 'gutenberg_enqueue_global_styles_assets' );
}
