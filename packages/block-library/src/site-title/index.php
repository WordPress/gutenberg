<?php
/**
 * Server-side rendering of the `core/site-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-title` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns a rendering of the the site title.
 */
function render_block_core_site_title( $attributes ) {
	return sprintf( '<h1>%s</h1>', get_bloginfo( 'name' ) );
}

/**
 * Registers the `core/site-title` block on server.
 */
function register_block_core_site_title() {
	register_block_type(
		'core/site-title',
		array(
			'attributes'      => array(),
			'render_callback' => 'render_block_core_site_title',
		)
	);
}
add_action( 'init', 'register_block_core_site_title' );
