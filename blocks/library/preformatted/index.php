<?php
/**
 * Server-side rendering of the `core/preformatted` block.
 *
 * @package gutenberg
 */

function register_core_preformatted_block() {
	wp_register_script( 'core-preformatted-block', gutenberg_url( '/build/__block_preformatted.js' ) );

	wp_register_style(
		'core-preformatted-block-editor',
		gutenberg_url( '/build/__block_preformatted_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_preformatted_editor.css' )
	);
	
	wp_style_add_data( 'core-preformatted-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/preformatted', array(
		'editor_style' => 'core-preformatted-block-editor',
		'editor_script' => 'core-preformatted-block',
	) );
}

add_action( 'init', 'register_core_preformatted_block' );
