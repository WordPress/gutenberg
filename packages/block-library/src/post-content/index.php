<?php
/**
 * Server-side rendering of the `core/post-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-content` block on the server.
 *
 * @param array $attributes The block attributes.
 * @param array $content    The saved content.
 * @param array $block      The parsed block.
 *
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_post_content( $attributes, $content, $block ) {
	$post = isset( $block['context']['postId'] ) ? $block['context']['postId'] : gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	return (
		'<div class="entry-content">' .
			apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', get_the_content( null, false, $post ) ) ) .
		'</div>'
	);
}

/**
 * Registers the `core/post-content` block on the server.
 */
function register_block_core_post_content() {
	$path     = __DIR__ . '/post-content/block.json';
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
				'render_callback' => 'render_block_core_post_content',
			)
		)
	);
}
add_action( 'init', 'register_block_core_post_content' );
