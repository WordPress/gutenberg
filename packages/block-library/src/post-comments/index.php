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
	$comments = get_comments(
		array(
			'post_id' => $post->ID,
		)
	);
	$output   = '';
	foreach ( $comments as $comment ) {
		$output .= '<p>' . $comment->comment_author . '<br />' . $comment->comment_content . '</p>';
	}
	return $output;
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
