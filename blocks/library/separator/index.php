<?php
/**
 * Server-side rendering of the `core/separator` block.
 *
 * @package gutenberg
 */

function register_core_separator_block() {
	wp_register_script( 'core-separator-block', gutenberg_url( '/build/__block_separator.js' ) );

	wp_register_style(
		'core-separator-block',
		gutenberg_url( '/build/__block_separator.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_separator.css' )
	);

	wp_style_add_data( 'core-separator-block', 'rtl', 'replace' );

	register_block_type( 'core/separator', array(
		'style' => 'core-separator-block',
		'editor_script' => 'core-separator-block',
	) );
}

add_action( 'init', 'register_core_separator_block' );
