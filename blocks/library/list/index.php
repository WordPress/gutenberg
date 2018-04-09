<?php
/**
 * Server-side rendering of the `core/list` block.
 *
 * @package gutenberg
 */

function register_core_list_block() {
	wp_register_script( 'core-list-block', gutenberg_url( '/build/blocks/library/list.js' ) );

	wp_register_style(
		'core-list-block-editor',
		gutenberg_url( '/build/blocks/library/list_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/list_editor.css' )
	);
	
	wp_style_add_data( 'core-list-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/list', array(
		'editor_style' => 'core-list-block-editor',
		'editor_script' => 'core-list-block',
	) );
}

add_action( 'init', 'register_core_list_block' );
