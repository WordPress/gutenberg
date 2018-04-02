<?php
/**
 * Server-side rendering of the `core/separator` block.
 *
 * @package gutenberg
 */

function register_core_separator_block() {
	wp_register_script( 'core-separator-block', gutenberg_url( '/build/__block_separator.js' ) );

	register_block_type( 'core/separator', array(
		'editor_script' => 'core-separator-block',
	) );
}

add_action( 'init', 'register_core_separator_block' );
