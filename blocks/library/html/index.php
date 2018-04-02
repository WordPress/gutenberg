<?php
/**
 * Server-side rendering of the `core/html` block.
 *
 * @package gutenberg
 */

function register_core_html_block() {
	wp_register_script( 'core-html-block', gutenberg_url( '/build/__block_html.js' ) );

	register_block_type( 'core/html', array(
		'editor_script' => 'core-html-block',
	) );
}

add_action( 'init', 'register_core_html_block' );
