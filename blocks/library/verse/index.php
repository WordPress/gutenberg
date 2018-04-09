<?php
/**
 * Server-side rendering of the `core/verse` block.
 *
 * @package gutenberg
 */

function register_core_verse_block() {
	wp_register_script( 'core-verse-block', gutenberg_url( '/build/blocks/library/verse.js' ) );

	wp_register_style(
		'core-verse-block-editor',
		gutenberg_url( '/build/blocks/library/verse_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/verse_editor.css' )
	);
	
	wp_style_add_data( 'core-verse-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/verse', array(
		'editor_style' => 'core-verse-block-editor',
		'editor_script' => 'core-verse-block',
	) );
}

add_action( 'init', 'register_core_verse_block' );
