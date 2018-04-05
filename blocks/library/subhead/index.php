<?php
/**
 * Server-side rendering of the `core/subhead` block.
 *
 * @package gutenberg
 */

function register_core_subhead_block() {
	wp_register_script( 'core-subhead-block', gutenberg_url( '/build/__block_subhead.js' ) );

	wp_register_style(
		'core-subhead-block',
		gutenberg_url( '/build/__block_subhead.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_subhead.css' )
	);

	wp_style_add_data( 'core-subhead-block', 'rtl', 'replace' );

	register_block_type( 'core/subhead', array(
		'style' => 'core-subhead-block',
		'editor_script' => 'core-subhead-block',
	) );
}

add_action( 'init', 'register_core_subhead_block' );
