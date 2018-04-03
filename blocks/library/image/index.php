<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package gutenberg
 */

function register_core_image_block() {
	wp_register_script( 'core-image-block', gutenberg_url( '/build/__block_image.js' ) );

	register_block_type( 'core/image', array(
		'editor_script' => 'core-image-block',
	) );
}

add_action( 'init', 'register_core_image_block' );
