<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

/**
 * Registers additional core block patterns for the Gutenberg plugin.
 *
 * This function adds patterns that complement the existing WordPress core patterns.
 * It runs after core patterns are registered to ensure all patterns are available.
 *
 * @since 6.0.0
 */
function gutenberg_register_core_block_patterns() {
	register_block_pattern(
		'gutenberg/hello-world',
		array(
			'title'       => __( 'Hello World', 'gutenberg' ),
			'description' => _x( 'A simple pattern with a paragraph block saying hello world.', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:paragraph --><p>Hello World</p><!-- /wp:paragraph -->',
			'categories' => array( 'text' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_core_block_patterns', 20 );

