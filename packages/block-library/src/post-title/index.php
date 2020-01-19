<?php
/**
 * Server-side rendering of the `core/post-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-title` block on the server.
 *
 * @param array $attributes The block attributes.
 * @param array $content    The saved content.
 * @param array $block      The parsed block.
 *
 * @return string Returns the filtered post title for the current post wrapped inside "h1" tags.
 */
function render_block_core_post_title( $attributes, $content, $block ) {
	$post = isset( $block['context']['postId'] ) ? $block['context']['postId'] : gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	return '<h1>' . get_the_title( $post ) . '</h1>';
}

/**
 * Registers the `core/post-title` block on the server.
 */
function register_block_core_post_title() {
	$path     = __DIR__ . '/post-title/block.json';
	$metadata = json_decode( file_get_contents( $path ), true );

	register_block_type(
		$metadata['name'],
		array_merge(
			$metadata,
			array(
				'context'         => array(
					'postType' => 'core/post',
					'postId'   => 'core/post',
				),
				'render_callback' => 'render_block_core_post_title',
			)
		)
	);
}
add_action( 'init', 'register_block_core_post_title' );
