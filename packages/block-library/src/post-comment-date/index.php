<?php
/**
 * Server-side rendering of the `core/post-comment-date` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comment-date` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's date.
 */
function render_block_core_post_comment_date( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();
	return sprintf(
		'<div %1$s><time datetime="%2$s">%3$s</time></div>',
		$wrapper_attributes,
		get_comment_date( 'c', $block->context['commentId'] ),
		get_comment_date(
			isset( $attributes['format'] ) ? $attributes['format'] : '',
			$block->context['commentId']
		)
	);
}

/**
 * Registers the `core/post-comment-date` block on the server.
 */
function register_block_core_post_comment_date() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comment-date',
		array(
			'render_callback' => 'render_block_core_post_comment_date',
		)
	);
}
add_action( 'init', 'register_block_core_post_comment_date' );
