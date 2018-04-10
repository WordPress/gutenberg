<?php
/**
 * Server-side rendering of the `core/text-columns` block.
 *
 * @package gutenberg
 */

function register_core_text_columns_block() {
	wp_register_script(
		'core-text-columns-block',
		gutenberg_url( '/build/__block_textColumns.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components' )
	);

	wp_register_style(
		'core-text-columns-block',
		gutenberg_url( '/build/__block_textColumns.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_textColumns.css' )
	);

	wp_style_add_data( 'core-text-columns-block', 'rtl', 'replace' );

	wp_register_style(
		'core-text-columns-block-editor',
		gutenberg_url( '/build/__block_textColumns_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_textColumns_editor.css' )
	);
	
	wp_style_add_data( 'core-text-columns-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/text-columns', array(
		'style' => 'core-text-columns-block',
		'editor_style' => 'core-text-columns-block-editor',
		'editor_script' => 'core-text-columns-block',
	) );
}

add_action( 'init', 'register_core_text_columns_block' );
