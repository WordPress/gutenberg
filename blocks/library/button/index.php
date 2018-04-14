<?php
/**
 * Server-side registration of the `core/button` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/button` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_button_block() {
	wp_register_script(
		'core-button-block',
		gutenberg_url( '/build/__block_button.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components', 'wp-element' )
	);

	wp_register_style(
		'core-button-block',
		gutenberg_url( '/build/__block_button.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_button.css' )
	);

	wp_style_add_data( 'core-button-block', 'rtl', 'replace' );

	wp_register_style(
		'core-button-block-editor',
		gutenberg_url( '/build/__block_button_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_button_editor.css' )
	);

	wp_style_add_data( 'core-button-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/button', array(
		'style'         => 'core-button-block',
		'editor_style'  => 'core-button-block-editor',
		'editor_script' => 'core-button-block',
	) );
}

add_action( 'init', 'register_core_button_block' );
