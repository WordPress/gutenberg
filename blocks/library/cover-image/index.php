<?php
/**
 * Server-side rendering of the `core/cover-image` block.
 *
 * @package gutenberg
 */

function register_core_cover_image_block() {
	wp_register_script( 'core-cover-image-block', gutenberg_url( '/build/__block_coverImage.js' ) );

	register_block_type( 'core/cover-image', array(
		'editor_script' => 'core-cover-image-block',
	) );
}

add_action( 'init', 'register_core_cover_image_block' );
