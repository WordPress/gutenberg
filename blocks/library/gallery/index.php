<?php
/**
 * Server-side rendering of the `core/gallery` block.
 *
 * @package gutenberg
 */

function register_core_gallery_block() {
	wp_register_script( 'core-gallery-block', gutenberg_url( '/build/__block_gallery.js' ) );

	register_block_type( 'core/gallery', array(
		'editor_script' => 'core-gallery-block',
	) );
}

add_action( 'init', 'register_core_gallery_block' );
