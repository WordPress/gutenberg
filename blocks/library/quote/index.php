<?php
/**
 * Server-side rendering of the `core/quote` block.
 *
 * @package gutenberg
 */

function register_core_quote_block() {
	wp_register_script( 'core-quote-block', gutenberg_url( '/build/blocks/library/quote.js' ) );

	wp_register_style(
		'core-quote-block',
		gutenberg_url( '/build/blocks/library/quote.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/quote.css' )
	);

	wp_style_add_data( 'core-quote-block', 'rtl', 'replace' );

	wp_register_style(
		'core-quote-block-editor',
		gutenberg_url( '/build/blocks/library/quote_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/blocks/library/quote_editor.css' )
	);
	
	wp_style_add_data( 'core-quote-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/quote', array(
		'style' => 'core-quote-block',
		'editor_style' => 'core-quote-block-editor',
		'editor_script' => 'core-quote-block',
	) );
}

add_action( 'init', 'register_core_quote_block' );
