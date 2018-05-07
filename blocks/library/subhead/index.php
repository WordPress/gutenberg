<?php
/**
 * Server-side registration of the `core/subhead` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/subhead` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_subhead_block() {
	wp_register_script(
		'core-subhead-block',
		gutenberg_url( '/build/__block_subhead.js' ),
		array( 'wp-blocks', 'wp-i18n' )
	);

	wp_register_style(
		'core-subhead-block',
		gutenberg_url( '/build/__block_subhead.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_subhead.css' )
	);

	wp_style_add_data( 'core-subhead-block', 'rtl', 'replace' );

	wp_register_style(
		'core-subhead-block-editor',
		gutenberg_url( '/build/__block_subhead_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_subhead_editor.css' )
	);

	wp_style_add_data( 'core-subhead-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/subhead', array(
		'style'         => 'core-subhead-block',
		'editor_style'  => 'core-subhead-block-editor',
		'editor_script' => 'core-subhead-block',
	) );
}

add_action( 'init', 'register_core_subhead_block' );
