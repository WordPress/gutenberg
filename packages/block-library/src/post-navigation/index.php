<?php
/**
 * Server-side rendering of the `core/post-navigation` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-navigation` block on the server.
 *
 * @return string Returns the post navigation UI for the current post.
 */
function render_block_core_post_navigation() {
	global $wp_query;
	$wp_query->query_vars['posts_per_page'] = 1;
	$wp_query->max_num_pages                = $wp_query->found_posts;
	return get_the_posts_pagination();
}

/**
 * Registers the `core/post-navigation` block on the server.
 */
function register_block_core_post_navigation() {
	register_block_type(
		'core/post-navigation',
		array(
			'render_callback' => 'render_block_core_post_navigation',
		)
	);
}
add_action( 'init', 'register_block_core_post_navigation' );
