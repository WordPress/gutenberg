<?php
/**
 * Server-side rendering of the `core/columns` block.
 *
 * @package gutenberg
 */

function register_core_columns_block() {
	wp_register_script( 'core-columns-block', gutenberg_url( '/build/__block_columns.js' ) );

	wp_register_style(
		'core-columns-block',
		gutenberg_url( '/build/__block_columns.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_columns.css' )
	);
	
	wp_style_add_data( 'core-columns-block', 'rtl', 'replace' );

	wp_register_style(
		'core-columns-block-editor',
		gutenberg_url( '/build/__block_columns_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_columns_editor.css' )
	);
	
	wp_style_add_data( 'core-columns-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/columns', array(
		'style' => 'core-columns-block',
		'editor_style' => 'core-columns-block-editor',
		'editor_script' => 'core-columns-block',
	) );
}

add_action( 'init', 'register_core_columns_block' );
