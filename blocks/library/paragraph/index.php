<?php
/**
 * Server-side registration of the `core/paragraph` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/paragraph` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_paragraph_block() {
	wp_register_script(
		'core-paragraph-block',
		gutenberg_url( '/build/__block_paragraph.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components', 'wp-element' )
	);

	wp_register_style(
		'core-paragraph-block',
		gutenberg_url( '/build/__block_paragraph.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_paragraph.css' )
	);

	wp_style_add_data( 'core-paragraph-block', 'rtl', 'replace' );

	wp_register_style(
		'core-paragraph-block-editor',
		gutenberg_url( '/build/__block_paragraph_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_paragraph_editor.css' )
	);

	wp_style_add_data( 'core-paragraph-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/paragraph', array(
		'style'         => 'core-paragraph-block',
		'editor_style'  => 'core-paragraph-block-editor',
		'editor_script' => 'core-paragraph-block',
	) );
}

add_action( 'init', 'register_core_paragraph_block' );
