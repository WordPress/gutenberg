<?php
/**
 * Server-side rendering of the `core/more` block.
 *
 * @package gutenberg
 */

function register_core_more_block() {
	wp_register_script( 'core-more-block', gutenberg_url( '/build/__block_more.js' ) );

	wp_register_style(
		'core-more-block-editor',
		gutenberg_url( '/build/__block_more_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_more_editor.css' )
	);
	
	wp_style_add_data( 'core-more-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/more', array(
		'editor_style' => 'core-more-block-editor',
		'editor_script' => 'core-more-block',
	) );
}

add_action( 'init', 'register_core_more_block' );
