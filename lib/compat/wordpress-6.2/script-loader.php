<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Registers vendor JavaScript files to be used as dependencies of the editor
 * and plugins.
 *
 * This function is called from a script during the plugin build process, so it
 * should not call any WordPress PHP functions.
 *
 * @since 13.0
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_vendor_scripts_62( $scripts ) {
	$extension = SCRIPT_DEBUG ? '.js' : '.min.js';

	$script = $scripts->query( 'wp-inert-polyfill', 'registered' );
	if ( ! $script ) {
		$scripts->add( 'wp-inert-polyfill', gutenberg_url( 'build/vendors/inert-polyfill' . $extension ), array() );
	}

	$script       = $scripts->query( 'wp-polyfill', 'registered' );
	$script->deps = array_merge( $script->deps, array( 'wp-inert-polyfill' ) );
}
add_action( 'wp_default_scripts', 'gutenberg_register_vendor_scripts_62' );
