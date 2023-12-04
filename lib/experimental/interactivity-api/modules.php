<?php
/**
 * Interactive modules.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Register the `@wordpress/interactivity` module.
 */
function gutenberg_register_interactivity_module() {
	gutenberg_register_module(
		'@wordpress/interactivity',
		gutenberg_url( '/build/interactivity/index.min.js' ),
		array(),
		defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
	);
}

add_action( 'wp_enqueue_scripts', 'gutenberg_register_interactivity_module' );
