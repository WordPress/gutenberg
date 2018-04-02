<?php
/**
 * Server-side rendering of the `core/text-columns` block.
 *
 * @package gutenberg
 */

function register_core_text_columns_block() {
	wp_register_script( 'core-text-columns-block', gutenberg_url( '/build/__block_textColumns.js' ) );

	register_block_type( 'core/text-columns', array(
		'editor_script' => 'core-text-columns-block',
	) );
}

add_action( 'init', 'register_core_text_columns_block' );
