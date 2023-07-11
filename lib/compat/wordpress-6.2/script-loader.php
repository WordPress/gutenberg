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

/**
 * This function takes care of adding inline styles
 * in the proper place, depending on the theme in use.
 *
 * This method was added to core in 5.9.1, but with a single param ($style). The second param ($priority) was
 * added post 6.0, so the 6.1 release needs to have wp_enqueue_block_support_styles updated to include this param.
 *
 * For block themes, it's loaded in the head.
 * For classic ones, it's loaded in the body
 * because the wp_head action  happens before
 * the render_block.
 *
 * @link https://core.trac.wordpress.org/ticket/53494.
 *
 * @deprecated 6.2 Block supports styles are now stored for enqueuing via the style engine API. See: packages/style-engine/README.md.
 *
 * @param string $style String containing the CSS styles to be added.
 * @param int    $priority To set the priority for the add_action.
 */
function gutenberg_enqueue_block_support_styles( $style, $priority = 10 ) {
	_deprecated_function( __FUNCTION__, '6.2' );

	$action_hook_name = 'wp_footer';
	if ( wp_is_block_theme() ) {
		$action_hook_name = 'wp_head';
	}
	add_action(
		$action_hook_name,
		static function () use ( $style ) {
			echo "<style>$style</style>\n";
		},
		$priority
	);
}

add_filter(
	'block_editor_settings_all',
	static function( $settings ) {
		// We must override what core is passing now.
		$settings['__unstableIsBlockBasedTheme'] = wp_is_block_theme();
		return $settings;
	},
	100
);
