<?php
/**
 * Server-side rendering of the `core/pullquote` block.
 *
 * @package gutenberg
 */

function register_core_pullquote_block() {
	wp_register_script( 'core-pullquote-block', gutenberg_url( '/build/__block_pullquote.js' ) );

	register_block_type( 'core/pullquote', array(
		'editor_script' => 'core-pullquote-block',
	) );
}

add_action( 'init', 'register_core_pullquote_block' );
