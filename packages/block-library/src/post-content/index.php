<?php
/**
 * Server-side rendering of the `core/post-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-content` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string  Returns the filtered post content of the current post.
 */
function render_block_core_post_content( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	if ( ! in_the_loop() ) {
		the_post();
	}

	$content = get_the_content( null, false, $block->context['postId'] );

	if ( empty( $content ) && ! is_attachment() ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'entry-content' ) );
	$attachment         = '';

	add_filter( 'prepend_attachment', '__return_false' );
	$content = apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', get_the_content( null, false, $block->context['postId'] ) ) );
	remove_filter( 'prepend_attachment', '__return_false' );

	if ( is_attachment() ) {
		if (
			wp_attachment_is( 'audio', $block->context['postId'] ) ||
			wp_attachment_is( 'video', $block->context['postId'] ) ||
			wp_attachment_is( 'image', $block->context['postId'] )
		) {
			// @see https://developer.wordpress.org/reference/functions/prepend_attachment/
			$attachment = prepend_attachment( '' );
		} else {
			$attachment = sprintf(
				'<div class="wp-block-attachment__details"><a href="%1$s">%2$s</a></div>',
				esc_url( wp_get_attachment_url( $block->context['postId'] ) ),
				get_the_title( $block->context['postId'] )
			);
		}
	}

	return (
		'<div ' . $wrapper_attributes . '>' . $attachment . $content . '</div>'
	);
}

/**
 * Registers the `core/post-content` block on the server.
 */
function register_block_core_post_content() {
	register_block_type_from_metadata(
		__DIR__ . '/post-content',
		array(
			'render_callback' => 'render_block_core_post_content',
		)
	);
}
add_action( 'init', 'register_block_core_post_content' );
