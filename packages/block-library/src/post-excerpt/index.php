<?php
/**
 * Server-side rendering of the `core/post-excerpt` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-excerpt` block on the server.
 *
 * @return string Returns the filtered post excerpt for the current post wrapped inside "p" tags.
 */
function render_block_core_post_excerpt() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	return '<p>' . get_the_excerpt( $post ) . '</p>';
}

/**
 * Registers the `core/post-excerpt` block on the server.
 */
function register_block_core_post_excerpt() {
	register_block_type(
		'core/post-excerpt',
		array(
			'render_callback' => 'render_block_core_post_excerpt',
		)
	);
}
add_action( 'init', 'register_block_core_post_excerpt' );
