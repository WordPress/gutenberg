<?php
/**
 * Server-side rendering of the `core/comment-avatar` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/comment-avatar` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Return the post comment's content.
 */
function render_block_core_comment_avatar( $attributes, $content, $block ) {
	if ( ! isset( $block->context['commentId'] ) ) {
		return '';
	}

	$comment = get_comment( $block->context['commentId'] );
	if ( ! $comment ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	$width  = isset( $attributes['width'] ) ? $attributes['width'] : '96';
	$height = isset( $attributes['height'] ) ? $attributes['height'] : '96';
	/* translators: %s is the Comment Author name */
	$alt = sprintf( __( '%s Avatar' ), $comment->comment_author );

	return get_avatar(
		$comment,
		null,
		'',
		$alt,
		array(
			'height'     => $height,
			'width'      => $width,
			'extra_attr' => $wrapper_attributes,
			'class'      => 'wp-block-comment-avatar ' . $attributes['className'],
		)
	);
}

/**
 * Registers the `core/comment-avatar` block on the server.
 */
function register_block_core_comment_avatar() {
	register_block_type_from_metadata(
		__DIR__ . '/comment-avatar',
		array(
			'render_callback' => 'render_block_core_comment_avatar',
		)
	);
}
add_action( 'init', 'register_block_core_comment_avatar' );
