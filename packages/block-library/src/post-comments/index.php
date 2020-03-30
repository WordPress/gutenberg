<?php
/**
 * Server-side rendering of the `core/post-comments` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments` block on the server.
 *
 * @return string Returns the filtered post comments for the current post wrapped inside "p" tags.
 */
function render_block_core_post_comments() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}

	ob_start();
	// This generates a deprecate message.
	// Ideally this deprecation is removed.
	comments_template();
	ob_get_clean();

	ob_start();
	wp_list_comments( array( 'page' => $post->ID ) );
	$comments = ob_get_clean();

	return $comments;
}

/**
 * Registers the `core/post-comments` block on the server.
 */
function register_block_core_post_comments() {
	register_block_type(
		'core/post-comments',
		array(
			'render_callback' => 'render_block_core_post_comments',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments' );
