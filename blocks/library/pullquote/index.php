<?php
/**
 * Server-side registration of the `core/pullquote` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/pullquote` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_pullquote_block() {
	wp_register_script(
		'core-pullquote-block',
		gutenberg_url( '/build/__block_pullquote.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components' )
	);

	wp_register_style(
		'core-pullquote-block',
		gutenberg_url( '/build/__block_pullquote.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_pullquote.css' )
	);

	wp_style_add_data( 'core-pullquote-block', 'rtl', 'replace' );

	wp_register_style(
		'core-pullquote-block-editor',
		gutenberg_url( '/build/__block_pullquote_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_pullquote_editor.css' )
	);

	wp_style_add_data( 'core-pullquote-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/pullquote', array(
		'style'         => 'core-pullquote-block',
		'editor_style'  => 'core-pullquote-block-editor',
		'editor_script' => 'core-pullquote-block',
	) );
}

add_action( 'init', 'register_core_pullquote_block' );
