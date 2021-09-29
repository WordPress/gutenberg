<?php
/**
 * Server-side rendering of the `core/comments-query` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/comments-query` block on the server.
 */
function register_block_core_comments_query() {
	register_block_type_from_metadata(
		__DIR__ . '/comments-query'
	);
}
add_action( 'init', 'register_block_core_comments_query' );
