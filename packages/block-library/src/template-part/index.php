<?php
/**
 * Server-side rendering of the `core/template-part` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/template-part` block on the server.
 *
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_template_part( $attributes ) {
	$content_string = '';
	if ( isset( $attributes['id'] ) ) {
		$post = get_post( $attributes['id'] );
		if ( $post ) {
			$content_string = $post->post_content;
		}
	}

	return apply_filters( 'the_content', $content_string );
}

/**
 * Registers the `core/template-parts` block on the server.
 */
function register_block_core_template_part() {
	register_block_type(
		'core/template-part',
		array(
			'render_callback' => 'render_block_core_template_part',
		)
	);
}
add_action( 'init', 'register_block_core_template_part' );
