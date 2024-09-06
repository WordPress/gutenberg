<?php
/**
 * Interactivity API functions specific for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

/**
 * Deregisters the Core Interactivity API Modules and replace them
 * with the ones from the Gutenberg plugin.
 */
function gutenberg_reregister_interactivity_script_modules() {
	$default_version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();
	wp_deregister_script_module( '@wordpress/interactivity' );
	wp_deregister_script_module( '@wordpress/interactivity-router' );

	wp_register_script_module(
		'@wordpress/interactivity',
		gutenberg_url( '/build/interactivity/' . ( SCRIPT_DEBUG ? 'debug.min.js' : 'index.min.js' ) ),
		array(),
		$default_version
	);

	wp_register_script_module(
		'@wordpress/interactivity-router',
		gutenberg_url( '/build/interactivity/router.min.js' ),
		array( '@wordpress/interactivity' ),
		$default_version
	);
}
add_action( 'init', 'gutenberg_reregister_interactivity_script_modules' );

function gutenberg_register_interactivity_script_module_data_hooks() {
		if ( ! has_filter( 'script_module_data_@wordpress/interactivity-router', array( wp_interactivity(), 'filter_script_module_interactivity_router_data' ) ) ) {
			add_filter(
				'script_module_data_@wordpress/interactivity-router',
				function ( $data ) {
					if ( ! isset( $data['i18n'] ) ) {
						$data['i18n'] = array();
					}
					$data['i18n']['loading'] = __( 'Loading page, please wait.', 'gutenberg' );
					$data['i18n']['loaded']  = __( 'Page Loaded.', 'gutenberg' );
					return $data;
				}
			);
		}
}
add_action( 'after_setup_theme', 'gutenberg_register_interactivity_script_module_data_hooks', 20 );
