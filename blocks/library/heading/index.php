<?php
/**
 * Server-side rendering of the `core/heading` block.
 *
 * @package gutenberg
 */

function register_core_heading_block() {
	wp_register_script( 'core-heading-block', gutenberg_url( '/build/__block_heading.js' ) );

	register_block_type( 'core/heading', array(
		'editor_script' => 'core-heading-block',
	) );
}

add_action( 'init', 'register_core_heading_block' );
