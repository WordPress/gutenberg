<?php
/**
 * Server-side rendering of the `core/embed` block.
 *
 * @package gutenberg
 */

function register_core_embed_block() {
	wp_register_script( 'core-embed-block', gutenberg_url( '/build/__block_embed.js' ) );

	wp_register_style(
		'core-embed-block',
		gutenberg_url( '/build/__block_embed.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_embed.css' )
	);

	wp_style_add_data( 'core-embed-block', 'rtl', 'replace' );

	wp_register_style(
		'core-embed-block-editor',
		gutenberg_url( '/build/__block_embed_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_embed_editor.css' )
	);
	
	wp_style_add_data( 'core-embed-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/embed', array(
		'style' => 'core-embed-block',
		'editor_style' => 'core-embed-block-editor',
		'editor_script' => 'core-embed-block',
	) );
}

add_action( 'init', 'register_core_embed_block' );
