<?php
/**
 * Server-side rendering of the `core/post-comments-count` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments-count` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the filtered post comments count for the current post.
 */
function render_block_core_post_comments_count( $attributes ) {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	$class = 'wp-block-post-comments-count';
	if ( isset( $attributes['className'] ) ) {
		$class .= ' ' . $attributes['className'];
	}
	return sprintf(
		'<span class="%1$s">%2$s</span>',
		esc_attr( $class ),
		get_comments_number( $post )
	);
}

/**
 * Registers the `core/post-comments-count` block on the server.
 */
function register_block_core_post_comments_count() {
	register_block_type_from_metadata(
		__DIR__ . '/post-comments-count',
		array(
			'attributes'      => array(
				'className' => array(
					'type' => 'string',
				),
			),
			'render_callback' => 'render_block_core_post_comments_count',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments_count' );
