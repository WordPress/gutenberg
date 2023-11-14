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
		'/wp-content/plugins/gutenberg/build/interactivity/index.min.js',
		'frontend'
	);
}

add_action( 'wp_enqueue_scripts', 'gutenberg_register_interactivity_module' );
