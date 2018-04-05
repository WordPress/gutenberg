<?php
/**
 * Server-side rendering of the `core/pullquote` block.
 *
 * @package gutenberg
 */

function register_core_pullquote_block() {
	wp_register_script( 'core-pullquote-block', gutenberg_url( '/build/__block_pullquote.js' ) );

	wp_register_style(
		'core-pullquote-block',
		gutenberg_url( '/build/__block_pullquote.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_pullquote.css' )
	);

	wp_style_add_data( 'core-pullquote-block', 'rtl', 'replace' );

	register_block_type( 'core/pullquote', array(
		'style' => 'core-pullquote-block',
		'editor_script' => 'core-pullquote-block',
	) );
}

add_action( 'init', 'register_core_pullquote_block' );
