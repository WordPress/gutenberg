<?php
/**
 * Server-side rendering of the `core/post-featured-image` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-featured-image` block on the server.
 *
 * @return string Returns the featured image for the current post.
 */
function render_block_core_post_featured_image() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	return '<p>' . get_the_post_thumbnail( $post ) . '</p>';
}

/**
 * Registers the `core/post-featured-image` block on the server.
 */
function register_block_core_post_featured_image() {
	$path     = __DIR__ . '/post-featured-image/block.json';
	$metadata = json_decode( file_get_contents( $path ), true );

	register_block_type(
		$metadata['name'],
		array_merge(
			$metadata,
			array(
				'render_callback' => 'render_block_core_post_featured_image',
			)
		)
	);
}
add_action( 'init', 'register_block_core_post_featured_image' );
