<?php
/**
 * Server-side rendering of the `core/cover-image` block.
 *
 * @package gutenberg
 */

function register_core_cover_image_block() {
	wp_register_script( 'core-cover-image-block', gutenberg_url( '/build/__block_coverImage.js' ) );

	wp_register_style(
		'core-cover-image-block',
		gutenberg_url( '/build/__block_coverImage.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_coverImage.css' )
	);

	wp_style_add_data( 'core-cover-image-block', 'rtl', 'replace' );

	wp_register_style(
		'core-cover-image-block-editor',
		gutenberg_url( '/build/__block_coverImage_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_coverImage_editor.css' )
	);
	
	wp_style_add_data( 'core-cover-image-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/cover-image', array(
		'style' => 'core-cover-image-block',
		'editor_style' => 'core-cover-image-block-editor',
		'editor_script' => 'core-cover-image-block',
	) );
}

add_action( 'init', 'register_core_cover_image_block' );
