<?php
/**
 * Updates client assets for the editor.
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
function gutenberg_register_vendor_scripts( $scripts ) {
	$extension = SCRIPT_DEBUG ? '.js' : '.min.js';

	gutenberg_override_script(
		$scripts,
		'react',
		gutenberg_url( 'build/vendors/react' . $extension ),
		// See https://github.com/pmmmwh/react-refresh-webpack-plugin/blob/main/docs/TROUBLESHOOTING.md#externalising-react.
		SCRIPT_DEBUG ? array( 'wp-react-refresh-entry', 'wp-polyfill' ) : array( 'wp-polyfill' )
	);
	gutenberg_override_script(
		$scripts,
		'react-dom',
		gutenberg_url( 'build/vendors/react-dom' . $extension ),
		array( 'react' )
	);
}
add_action( 'wp_default_scripts', 'gutenberg_register_vendor_scripts' );
