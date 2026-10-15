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
