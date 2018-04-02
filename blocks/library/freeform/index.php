<?php
/**
 * Server-side rendering of the `core/freeform` block.
 *
 * @package gutenberg
 */

function register_core_freeform_block() {
	wp_register_script( 'core-freeform-block', gutenberg_url( '/build/__block_freeform.js' ) );

	register_block_type( 'core/freeform', array(
		'editor_script' => 'core-freeform-block',
	) );
}

add_action( 'init', 'register_core_freeform_block' );
