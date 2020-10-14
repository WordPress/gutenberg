<?php
/**
 * Server-side rendering of the `core/post-comment-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comment-content` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's content.
 */
function render_block_core_post_comment_content( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}

	return sprintf( '<div>%1$s</div>', get_comment_text( $block->context['commentId'] ) );
}

/**
 * Registers the `core/post-comment-content` block on the server.
 */
function register_block_core_post_comment_content() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comment-content',
		array(
			'api_version'     => 2,
			'render_callback' => 'render_block_core_post_comment_content',
		)
	);
}
add_action( 'init', 'register_block_core_post_comment_content' );
