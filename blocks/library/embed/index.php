<?php
/**
 * Server-side rendering of the `core/embed` block.
 *
 * @package gutenberg
 */

function register_core_embed_block() {
	wp_register_script( 'core-embed-block', gutenberg_url( '/build/__block_embed.js' ) );

	register_block_type( 'core/embed', array(
		'editor_script' => 'core-embed-block',
	) );
}

add_action( 'init', 'register_core_embed_block' );
