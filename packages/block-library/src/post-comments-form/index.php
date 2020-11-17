<?php
/**
 * Server-side rendering of the `core/post-comments-form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments-form` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post comments form for the current post.
 */
function render_block_core_post_comments_form( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$classes = '';
	if ( isset( $attributes['textAlign'] ) ) {
		$classes .= 'has-text-align-' . $attributes['textAlign'];
	}

	ob_start();
	comment_form( array(), $block->context['postId'] );
	$form               = ob_get_clean();
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classes ) );

	return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $form );
}

/**
 * Registers the `core/post-comments-form` block on the server.
 */
function register_block_core_post_comments_form() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comments-form',
		array(
			'render_callback' => 'render_block_core_post_comments_form',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments_form' );
