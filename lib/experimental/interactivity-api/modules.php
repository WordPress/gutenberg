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

	// TODO: Replace with a simpler version that only provides support for import maps.
	// TODO: Load only if the browser doesn't support import maps (https://github.com/guybedford/es-module-shims/issues/371).
	wp_enqueue_script(
		'es-module-shims',
		gutenberg_url( '/build/modules/importmap-polyfill.min.js' ),
		array(),
		null,
		array(
			'strategy' => 'defer',
		)
	);
}

add_action( 'wp_enqueue_scripts', 'gutenberg_register_interactivity_module' );
