<?php
/**
 * Server-side rendering of the `core/paragraph` block.
 *
 * @package gutenberg
 */

function register_core_paragraph_block() {
	wp_register_script( 'core-paragraph-block', gutenberg_url( '/build/__block_paragraph.js' ) );

	register_block_type( 'core/paragraph', array(
		'editor_script' => 'core-paragraph-block',
	) );
}

add_action( 'init', 'register_core_paragraph_block' );
