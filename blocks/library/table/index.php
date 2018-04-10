<?php
/**
 * Server-side rendering of the `core/table` block.
 *
 * @package gutenberg
 */

function register_core_table_block() {
	wp_register_script( 'core-table-block', gutenberg_url( '/build/__block_table.js' ) );

	wp_register_style(
		'core-table-block',
		gutenberg_url( '/build/__block_table.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_table.css' )
	);

	wp_style_add_data( 'core-table-block', 'rtl', 'replace' );

	wp_register_style(
		'core-table-block-editor',
		gutenberg_url( '/build/__block_table_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_table_editor.css' )
	);
	
	wp_style_add_data( 'core-table-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/table', array(
		'style' => 'core-table-block',
		'editor_style' => 'core-table-block-editor',
		'editor_script' => 'core-table-block',
	) );
}

add_action( 'init', 'register_core_table_block' );
