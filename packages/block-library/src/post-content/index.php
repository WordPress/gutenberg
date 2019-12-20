<?php
/**
 * Server-side rendering of the `core/post-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-content` block on the server.
 *
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_post_content() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	return (
		'<div class="entry-content">' .
			apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', get_the_content( $post ) ) ) .
		'</div>'
	);
}

/**
 * Registers the `core/post-content` block on the server.
 */
function register_block_core_post_content() {
	register_block_type(
		'core/post-content',
		array(
			'render_callback' => 'render_block_core_post_content',
		)
	);
}
add_action( 'init', 'register_block_core_post_content' );
