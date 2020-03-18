<?php
/**
 * Server-side rendering of the `core/post-author` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-author` block on the server.
 *
 * @return string Returns the filtered post author for the current post wrapped inside "h6" tags.
 */
function render_block_core_post_author() {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}
	// translators: %s: The author.
	return '<address>' . sprintf( __( 'By %s' ), get_the_author() ) . '</address>';
}

/**
 * Registers the `core/post-author` block on the server.
 */
function register_block_core_post_author() {
	$path     = __DIR__ . '/post-author/block.json';
	$metadata = json_decode( file_get_contents( $path ), true );

	register_block_type(
		$metadata['name'],
		array_merge(
			$metadata,
			array(
				'render_callback' => 'render_block_core_post_author',
			)
		)
	);
}
add_action( 'init', 'register_block_core_post_author' );
