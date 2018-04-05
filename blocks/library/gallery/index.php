<?php
/**
 * Server-side rendering of the `core/gallery` block.
 *
 * @package gutenberg
 */

function register_core_gallery_block() {
	wp_register_script( 'core-gallery-block', gutenberg_url( '/build/__block_gallery.js' ) );

	wp_register_style(
		'core-gallery-block',
		gutenberg_url( '/build/__block_gallery.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_gallery.css' )
	);

	wp_style_add_data( 'core-gallery-block', 'rtl', 'replace' );

	register_block_type( 'core/gallery', array(
		'style' => 'core-gallery-block',
		'editor_script' => 'core-gallery-block',
	) );
	
}

add_action( 'init', 'register_core_gallery_block' );
