<?php
/**
 * Server-side rendering of the `core/code` block.
 *
 * @package gutenberg
 */

function register_core_code_block() {
	wp_register_script( 'core-code-block', gutenberg_url( '/build/blocks/library/code.js' ) );

	wp_register_style(
		'core-code-block-editor',
		gutenberg_url( '/build/blocks/library/code_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/code_editor.css' )
	);
	
	wp_style_add_data( 'core-code-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/code', array(
		'editor_style' => 'core-code-block-editor',
		'editor_script' => 'core-code-block',
	) );
}

add_action( 'init', 'register_core_code_block' );
