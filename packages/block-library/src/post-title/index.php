<?php
/**
 * Server-side rendering of the `core/post-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-title` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the filtered post title for the current post wrapped inside "h1" tags.
 */
function render_block_core_post_title( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	return '<h1>' . get_the_title( $block->context['postId'] ) . '</h1>';
}

/**
 * Registers the `core/post-title` block on the server.
 */
function register_block_core_post_title() {
	register_block_type_from_metadata(
		__DIR__ . '/post-title',
		array(
			'render_callback' => 'render_block_core_post_title',
		)
	);
}
add_action( 'init', 'register_block_core_post_title' );
