<?php
/**
 * Server-side rendering of the `core/post-comments` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-comments` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post comments for the current post wrapped inside "p" tags.
 */
function render_block_core_post_comments( $attributes, $content, $block ) {
	global $post;

	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_before = $post;

	$post = get_post( $block->context['postId'] );
	setup_postdata( $post );

	// This generates a deprecate message.
	// Ideally this deprecation is removed.
	ob_start();
	comments_template();
	$post = $post_before;
	return ob_get_clean();
}

/**
 * Registers the `core/post-comments` block on the server.
 */
function register_block_core_post_comments() {
	register_block_type(
		'core/post-comments',
		array(
			'render_callback' => 'render_block_core_post_comments',
		)
	);
}
add_action( 'init', 'register_block_core_post_comments' );
