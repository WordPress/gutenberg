<?php
/**
 * Server-side rendering of the `core/author-name` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/author-name` block on the server.
 *
 * @param  array    $attributes Block attributes.
 * @param  string   $content    Block default content.
 * @param  WP_Block $block      Block instance.
 * @return string Returns the rendered author block.
 */
function render_block_core_author_name( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$author_id = get_post_field( 'post_author', $block->context['postId'] );
	if ( empty( $author_id ) ) {
		return '';
	}

	$classes = array_merge(
		isset( $attributes['className'] ) ? array( $attributes['className'] ) : array(),
		isset( $attributes['textAlign'] ) ? array( 'has-text-align-' . $attributes['textAlign'] ) : array()
	);

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	return sprintf( '<div %1$s>', $wrapper_attributes ) . get_the_author_meta( 'display_name', $author_id ) . '</div>';
}

/**
 * Registers the `core/author-name` block on the server.
 */
function register_block_core_author_name() {
	register_block_type_from_metadata(
		__DIR__ . '/author-name',
		array(
			'render_callback' => 'render_block_core_author_name',
		)
	);
}
add_action( 'init', 'register_block_core_author_name' );
