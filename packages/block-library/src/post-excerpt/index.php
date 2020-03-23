<?php
/**
 * Server-side rendering of the `core/post-excerpt` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-excerpt` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the filtered post excerpt for the current post wrapped inside "p" tags.
 */
function render_block_core_post_excerpt( $attributes ) {
	$post = gutenberg_get_post_from_context();
	if ( ! $post ) {
		return '';
	}

	$more_text = isset( $attributes['moreText'] ) ? '<a href="' . esc_url( get_the_permalink( $post ) ) . '">' . $attributes['moreText'] . '</a>' : '';

	$filter_excerpt_length = function() use ( $attributes ) {
		return isset( $attributes['wordCount'] ) ? $attributes['wordCount'] : 55;
	};
	add_filter(
		'excerpt_length',
		$filter_excerpt_length
	);

	$output = '<p>' . get_the_excerpt( $post );
	if ( ! isset( $attributes['showMoreOnNewLine'] ) || $attributes['showMoreOnNewLine'] ) {
		$output .= '</p>' . '<p>' . $more_text . '</p>';
	} else {
		$output .= ' ' . $more_text . '</p>';
	}

	remove_filter(
		'excerpt_length',
		$filter_excerpt_length
	);

	return $output;
}

/**
 * Registers the `core/post-excerpt` block on the server.
 */
function register_block_core_post_excerpt() {
	$path     = __DIR__ . '/post-excerpt/block.json';
	$metadata = json_decode( file_get_contents( $path ), true );

	register_block_type(
		$metadata['name'],
		array_merge(
			$metadata,
			array(
				'render_callback' => 'render_block_core_post_excerpt',
			)
		)
	);
}
add_action( 'init', 'register_block_core_post_excerpt' );
