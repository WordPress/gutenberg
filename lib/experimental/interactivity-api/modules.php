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
		array(),
		defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
	);

	// TODO: Move this to a local file and replace with a simpler version that
	// only provides support for import maps.
	wp_enqueue_script(
		'es-module-shims',
		'https://ga.jspm.io/npm:es-module-shims@1.8.2/dist/es-module-shims.js',
		array(),
		null,
		array(
			'strategy' => 'defer',
		)
	);
}

add_action( 'wp_enqueue_scripts', 'gutenberg_register_interactivity_module' );
