<?php
/**
 * Server-side rendering of the `core/code` block.
 *
 * @package gutenberg
 */

function register_core_code_block() {
	wp_register_script( 'core-code-block', gutenberg_url( '/build/__block_code.js' ) );

	register_block_type( 'core/code', array(
		'editor_script' => 'core-code-block',
	) );
}

add_action( 'init', 'register_core_code_block' );
