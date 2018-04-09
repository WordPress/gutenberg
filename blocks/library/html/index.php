<?php
/**
 * Server-side rendering of the `core/html` block.
 *
 * @package gutenberg
 */

function register_core_html_block() {
	wp_register_script( 'core-html-block', gutenberg_url( '/build/blocks/library/html.js' ) );

	wp_register_style(
		'core-html-block-editor',
		gutenberg_url( '/build/blocks/library/html_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/html_editor.css' )
	);
	
	wp_style_add_data( 'core-html-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/html', array(
		'editor_style' => 'core-html-block-editor',
		'editor_script' => 'core-html-block',
	) );
}

add_action( 'init', 'register_core_html_block' );
