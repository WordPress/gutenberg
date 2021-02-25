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
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		get_comment_author( $block->context['commentId'] )
	);
}

/**
 * Registers the `core/post-comment-author` block on the server.
 */
function register_block_core_post_comment_author() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comment-author',
		array(
			'render_callback' => 'render_block_core_post_comment_author',
		)
	);
}
add_action( 'init', 'register_block_core_post_comment_author' );
