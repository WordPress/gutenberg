<?php
/**
 * Server-side rendering of the `core/quote` block.
 *
 * @package gutenberg
 */

function register_core_quote_block() {
	wp_register_script( 'core-quote-block', gutenberg_url( '/build/__block_quote.js' ) );

	register_block_type( 'core/quote', array(
		'editor_script' => 'core-quote-block',
	) );
}

add_action( 'init', 'register_core_quote_block' );
