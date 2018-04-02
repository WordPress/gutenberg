<?php
/**
 * Server-side rendering of the `core/button` block.
 *
 * @package gutenberg
 */

function register_core_button_block() {
	wp_register_script( 'core-button-block', gutenberg_url( '/build/__block_button.js' ) );

	register_block_type( 'core/button', array(
		'editor_script' => 'core-button-block',
	) );
}

add_action( 'init', 'register_core_button_block' );
