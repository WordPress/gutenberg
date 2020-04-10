<?php
/**
 * Server-side rendering of the `core/post-tags` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-tags` block on the server.
 *
 * @return string Returns the filtered post tags for the current post wrapped inside "a" tags.
 */
function render_block_core_post_tags() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	$post_tags = get_the_tags();
	if ( ! empty( $post_tags ) ) {
		$output = '';
		foreach ( $post_tags as $tag ) {
			$output .= '<a href="' . get_tag_link( $tag->term_id ) . '">' . $tag->name . '</a>' . ' | ';
		}
		return trim( $output, ' | ' );
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
