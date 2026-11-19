<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to post types.
 *
 * @package gutenberg
 */

/**
 * Adds author support to the `wp_block` post type.
 *
 * Every pattern already stores its `post_author`, and the post type's
 * capabilities already check it. Supporting `author` exposes it in the REST
 * API, so the inserter can tell the current user's patterns apart from the
 * rest of the site's.
 */
function gutenberg_add_wp_block_author_support() {
	add_post_type_support( 'wp_block', 'author' );
}
add_action( 'init', 'gutenberg_add_wp_block_author_support' );

/**
 * Keeps patterns when their author is deleted.
 *
 * Now that `wp_block` supports `author`, deleting a user would also delete
 * their patterns, which may be used across the site.
 *
 * @param array  $args      Arguments for registering a post type.
 * @param string $post_type Post type key.
 * @return array Filtered arguments.
 */
function gutenberg_keep_wp_block_on_user_delete( $args, $post_type ) {
	if ( 'wp_block' === $post_type ) {
		$args['delete_with_user'] = false;
	}
	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_keep_wp_block_on_user_delete', 10, 2 );
