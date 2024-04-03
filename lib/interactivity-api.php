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
		gutenberg_url( '/build/interactivity/index.min.js' ),
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
