<?php
/**
 * Server-side rendering of the `core/list` block.
 *
 * @package gutenberg
 */

function register_core_list_block() {
	wp_register_script( 'core-list-block', gutenberg_url( '/build/__block_list.js' ) );

	register_block_type( 'core/list', array(
		'editor_script' => 'core-list-block',
	) );
}

add_action( 'init', 'register_core_list_block' );
