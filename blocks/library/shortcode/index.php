<?php
/**
 * Server-side rendering of the `core/shortcode` block.
 *
 * @package gutenberg
 */

function register_core_shortcode_block() {
	wp_register_script( 'core-shortcode-block', gutenberg_url( '/build/__block_shortcode.js' ) );

	register_block_type( 'core/shortcode', array(
		'editor_script' => 'core-shortcode-block',
	) );
}

add_action( 'init', 'register_core_shortcode_block' );
