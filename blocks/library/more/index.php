<?php
/**
 * Server-side rendering of the `core/more` block.
 *
 * @package gutenberg
 */

function register_core_more_block() {
	wp_register_script( 'core-more-block', gutenberg_url( '/build/__block_more.js' ) );

	register_block_type( 'core/more', array(
		'editor_script' => 'core-more-block',
	) );
}

add_action( 'init', 'register_core_more_block' );
