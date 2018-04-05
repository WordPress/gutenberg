<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package gutenberg
 */

function register_core_image_block() {
	wp_register_script( 'core-image-block', gutenberg_url( '/build/__block_image.js' ) );

	wp_register_style(
		'core-image-block',
		gutenberg_url( '/build/__block_image.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_image.css' )
	);

	wp_style_add_data( 'core-image-block', 'rtl', 'replace' );

	register_block_type( 'core/image', array(
		'style' => 'core-image-block',
		'editor_script' => 'core-image-block',
	) );
}

add_action( 'init', 'register_core_image_block' );
