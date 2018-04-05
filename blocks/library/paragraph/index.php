<?php
/**
 * Server-side rendering of the `core/paragraph` block.
 *
 * @package gutenberg
 */

function register_core_paragraph_block() {
	wp_register_script( 'core-paragraph-block', gutenberg_url( '/build/__block_paragraph.js' ) );

	wp_register_style(
		'core-paragraph-block',
		gutenberg_url( '/build/__block_paragraph.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_paragraph.css' )
	);

	wp_style_add_data( 'core-paragraph-block', 'rtl', 'replace' );

	register_block_type( 'core/paragraph', array(
		'style' => 'core-paragraph-block',
		'editor_script' => 'core-paragraph-block',
	) );
}

add_action( 'init', 'register_core_paragraph_block' );
