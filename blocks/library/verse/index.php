<?php
/**
 * Server-side registration of the `core/verse` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/verse` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_verse_block() {
	wp_register_script(
		'core-verse-block',
		gutenberg_url( '/build/__block_verse.js' ),
		array( 'wp-blocks', 'wp-i18n' )
	);

	wp_register_style(
		'core-verse-block-editor',
		gutenberg_url( '/build/__block_verse_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_verse_editor.css' )
	);

	wp_style_add_data( 'core-verse-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/verse', array(
		'editor_style'  => 'core-verse-block-editor',
		'editor_script' => 'core-verse-block',
	) );
}

add_action( 'init', 'register_core_verse_block' );
