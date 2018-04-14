<?php
/**
 * Server-side registration of the `core/freeform` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/freeform` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_freeform_block() {
	wp_register_script(
		'core-freeform-block',
		gutenberg_url( '/build/__block_freeform.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-utils' )
	);

	wp_register_style(
		'core-freeform-block-editor',
		gutenberg_url( '/build/__block_freeform_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_freeform_editor.css' )
	);

	wp_style_add_data( 'core-freeform-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/freeform', array(
		'editor_style'  => 'core-freeform-block-editor',
		'editor_script' => 'core-freeform-block',
	) );
}

add_action( 'init', 'register_core_freeform_block' );
