<?php
/**
 * Server-side rendering of the `core/post-comment-author` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comment-author` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's content.
 */
function render_block_core_post_comment_author( $attributes, $content, $block ) {
	$comment_id = null;

	if ( ! empty( $block->context['commentId'] ) ) {
		$comment_id = $block->context['commentId'];
	}

	if ( ! empty( $attributes['commentId'] ) ) {
		$comment_id = $attributes['commentId'];
	}

	if ( ! $comment_id ) {
		return '';
	}

	return sprintf( '<div>%1$s</div>', get_comment_author( $comment_id ) );
}

/**
 * Registers the `core/post-comment-author` block on the server.
 */
function register_block_core_post_comment_author() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comment-author',
		array(
			'attributes' => [
				'commentId' => 'number'
			],
			'render_callback' => 'render_block_core_post_comment_author',
		)
	);
}
add_action( 'init', 'register_block_core_post_comment_author' );
