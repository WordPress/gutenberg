<?php
/**
 * Server-side rendering of the `core/post-tags` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-tags` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post tags for the current post wrapped inside "a" tags.
 */
function render_block_core_post_tags( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_tags = get_the_tags( $block->context['postId'] );
	if ( ! empty( $post_tags ) ) {
		$classes = '';
		if ( isset( $attributes['textAlign'] ) ) {
			$classes .= 'has-text-align-' . $attributes['textAlign'];
		}

		$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classes ) );
		$output             = sprintf( '<div %1$s>', $wrapper_attributes );

		foreach ( $post_tags as $tag ) {
			$output .= '<a href="' . get_tag_link( $tag->term_id ) . '">' . $tag->name . '</a>' . ' | ';
		}

		$output  = trim( $output, ' | ' );
		$output .= '</div>';

		return $output;
	}
}

/**
 * Registers the `core/post-tags` block on the server.
 */
function register_block_core_post_tags() {
	register_block_type_from_metadata(
		__DIR__ . '/post-tags',
		array(
			'render_callback' => 'render_block_core_post_tags',
		)
	);
}
add_action( 'init', 'register_block_core_post_tags' );
