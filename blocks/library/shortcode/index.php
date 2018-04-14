<?php
/**
 * Server-side registration of the `core/shortcode` block.
 *
 * @package gutenberg
 */

/**
 * Registers the `core/shortcode` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_shortcode_block() {
	wp_register_script(
		'core-shortcode-block',
		gutenberg_url( '/build/__block_shortcode.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components', 'wp-element' )
	);

	wp_register_style(
		'core-shortcode-block-editor',
		gutenberg_url( '/build/__block_shortcode_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_shortcode_editor.css' )
	);

	wp_style_add_data( 'core-shortcode-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/shortcode', array(
		'editor_style'  => 'core-shortcode-block-editor',
		'editor_script' => 'core-shortcode-block',
	) );
}

add_action( 'init', 'register_core_shortcode_block' );
