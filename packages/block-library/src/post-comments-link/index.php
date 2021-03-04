<?php
/**
 * Server-side rendering of the `core/post-comments-link` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments-link` block on the server.
 *
 * @param  array    $attributes Block attributes.
 * @param  string   $content    Block default content.
 * @param  WP_Block $block      Block instance.
 * @return string   Returns the rendered link.
 */
function render_block_core_post_comments_link( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] )
		|| isset( $block->context['postId'] )
		&& ! comments_open( $block->context['postId'] ) ) {
			return '';
	}

	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );
	$comments_number    = (int) get_comments_number( $block->context['postId'] );
	$comments_link      = get_comments_link( $block->context['postId'] );
	$post_title         = get_the_title( $block->context['postId'] );
	$comment_text       = '';

	if ( 0 === $comments_number ) {
		$comment_text = sprintf(
			/* translators: %s post title */
			__( 'No comments<span class="screen-reader-text"> on %s</span>' ),
			$post_title
		);
	} elseif ( 1 === $comments_number ) {
		$comment_text = sprintf(
			/* translators: %s post title */
			__( 'One comment<span class="screen-reader-text"> on %s</span>' ),
			$post_title
		);
	} else {
		$comment_text = sprintf(
			/* translators: %1$d Number of comments, %2$s post title */
			__( '%1$d comments<span class="screen-reader-text"> on %2$s</span>' ),
			$comments_number,
			$post_title
		);
	}

	return sprintf( '<div %1$s>', $wrapper_attributes ) .
		'<a href="' . $comments_link . '">' . $comment_text . '</a>' .
		'</div>';
}

/**
 * Registers the `core/post-comments-link` block on the server.
 */
function register_block_core_post_comments_link() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comments-link',
		array(
			'render_callback' => 'render_block_core_post_comments_link',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments_link' );
