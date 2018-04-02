<?php
/**
 * Server-side rendering of the `core/subhead` block.
 *
 * @package gutenberg
 */

function register_core_subhead_block() {
	wp_register_script( 'core-subhead-block', gutenberg_url( '/build/__block_subhead.js' ) );

	register_block_type( 'core/subhead', array(
		'editor_script' => 'core-subhead-block',
	) );
}

add_action( 'init', 'register_core_subhead_block' );
