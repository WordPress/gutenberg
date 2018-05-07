<?php
/**
 * Server-side registration of the `core/code` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/code` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_code_block() {
	wp_register_script(
		'core-code-block',
		gutenberg_url( '/build/__block_code.js' ),
		array( 'wp-blocks', 'wp-i18n' )
	);

	wp_register_style(
		'core-code-block-editor',
		gutenberg_url( '/build/__block_code_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_code_editor.css' )
	);

	wp_style_add_data( 'core-code-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/code', array(
		'editor_style'  => 'core-code-block-editor',
		'editor_script' => 'core-code-block',
	) );
}

add_action( 'init', 'register_core_code_block' );
