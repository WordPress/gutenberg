<?php
/**
 * Server-side rendering of the `core/nextpage` block.
 *
 * @package gutenberg
 */

function register_core_nextpage_block() {
	wp_register_script( 'core-nextpage-block', gutenberg_url( '/build/blocks/library/nextpage.js' ) );

	wp_register_style(
		'core-nextpage-block-editor',
		gutenberg_url( '/build/blocks/library/nextpage_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/nextpage_editor.css' )
	);
	
	wp_style_add_data( 'core-nextpage-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/nextpage', array(
		'editor_style' => 'core-nextpage-block-editor',
		'editor_script' => 'core-nextpage-block',
	) );
}

add_action( 'init', 'register_core_nextpage_block' );
