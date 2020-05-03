<?php
/**
 * Server-side rendering of the `core/site-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-title` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The render.
 */
function render_block_core_site_title( $attributes ) {
	$tag_name = 'h1';
	if ( isset( $attributes['level'] ) ) {
		$tag_name = 0 === $attributes['level'] ? 'p' : 'h' . $attributes['level'];
	}
	return sprintf( '<%1$s>%2$s</%1$s>', $tag_name, get_bloginfo( 'name' ) );
}

/**
 * Registers the `core/site-title` block on the server.
 */
function register_block_core_site_title() {
	register_block_type_from_metadata(
		__DIR__ . '/site-title',
		array(
			'render_callback' => 'render_block_core_site_title',
		)
	);
}
add_action( 'init', 'register_block_core_site_title' );
