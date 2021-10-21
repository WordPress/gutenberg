<?php
/**
 * Server-side rendering of the `core/post-comment-reply-link` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comment-reply-link` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's content.
 */
function render_block_core_post_comment_reply_link( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}

	return sprintf(
		'<a %1$s>%2$s</a>',
		get_block_wrapper_attributes(),
		'Reply'
	);
}

/**
 * Registers the `core/post-comment-reply-link` block on the server.
 */
function register_block_core_post_comment_reply_link() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comment-reply-link',
		array(
			'render_callback' => 'render_block_core_post_comment_reply_link',
		)
	);
}

add_action( 'init', 'register_block_core_post_comment_reply_link' );
