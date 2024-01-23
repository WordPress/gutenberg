<?php
/**
 * Interactive modules.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Register the `@wordpress/interactivity` module.
 *
 * !! This will be removed once https://github.com/WordPress/gutenberg/pull/58066
 * is merged.
 */
function gutenberg_register_interactivity_module() {
	wp_register_script_module(
		'@wordpress/interactivity',
		gutenberg_url( '/build/interactivity/index.min.js' ),
		array(),
		defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
	);
}

add_action( 'wp_enqueue_scripts', 'gutenberg_register_interactivity_module' );
