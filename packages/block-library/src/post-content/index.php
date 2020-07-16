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
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_post_content( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	return (
		'<div class="entry-content">' .
			apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', get_the_content( null, false, $block->context['postId'] ) ) ) .
		'</div>'
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

/**
 * Only show the `core/post-content` block when editing templates and template parts.
 * This is to prevent infinite recursions (post content containing a Post Content block
 * that attempts to embed the post content it is part of).
 *
 * @param bool|array $allowed_block_types Array of block type slugs, or
 *                                        boolean to enable/disable all.
 * @param WP_Post    $post                The post resource data.
 */
function disallow_core_post_content_block_outside_templates( $allowed_block_types, $post ) {
	if ( in_array( $post->post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
		return $allowed_block_types;
	}
	return array_diff( $allowed_block_types, array( 'core/post-content' ) );
}

add_filter( 'allowed_block_types', 'disallow_core_post_content_block_outside_templates', 10, 2 );
