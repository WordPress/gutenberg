<?php
/**
 * Server-side rendering of the `core/post-comments-query` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/post-comments-query` block on the server.
 */
function register_block_core_post_comments_query() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comments-query'
	);
}
add_action( 'init', 'register_block_core_post_comments_query' );
