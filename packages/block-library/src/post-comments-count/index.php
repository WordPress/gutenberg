<?php
/**
 * Server-side rendering of the `core/post-comments-count` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments-count` block on the server.
 *
 * @return string Returns the filtered post comments count for the current post.
 */
function render_block_core_post_comments_count() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	return get_comments_number( $post );
}

/**
 * Registers the `core/post-comments-count` block on the server.
 */
function register_block_core_post_comments_count() {
	register_block_type(
		'core/post-comments-count',
		array(
			'render_callback' => 'render_block_core_post_comments_count',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments_count' );
