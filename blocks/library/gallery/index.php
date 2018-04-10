<?php
/**
 * Server-side rendering of the `core/gallery` block.
 *
 * @package gutenberg
 */

function register_core_gallery_block() {
	wp_register_script(
		'core-gallery-block',
		gutenberg_url( '/build/__block_gallery.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components', 'wp-element', 'wp-utils', 'wp-data' )
	);

	wp_register_style(
		'core-gallery-block',
		gutenberg_url( '/build/__block_gallery.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_gallery.css' )
	);

	wp_style_add_data( 'core-gallery-block', 'rtl', 'replace' );

	wp_register_style(
		'core-gallery-block-editor',
		gutenberg_url( '/build/__block_gallery_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_gallery_editor.css' )
	);
	
	wp_style_add_data( 'core-gallery-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/gallery', array(
		'style' => 'core-gallery-block',
		'editor_style' => 'core-gallery-block-editor',
		'editor_script' => 'core-gallery-block',
	) );
	
}

add_action( 'init', 'register_core_gallery_block' );
