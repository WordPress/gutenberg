<?php
/**
 * Server-side rendering of the `core/heading` block.
 *
 * @package gutenberg
 */

function register_core_heading_block() {
	wp_register_script( 'core-heading-block', gutenberg_url( '/build/__block_heading.js' ) );

	wp_register_style(
		'core-heading-block-editor',
		gutenberg_url( '/build/__block_heading_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_heading_editor.css' )
	);
	
	wp_style_add_data( 'core-heading-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/heading', array(
		'editor_style' => 'core-heading-block-editor',
		'editor_script' => 'core-heading-block',
	) );
}

add_action( 'init', 'register_core_heading_block' );
