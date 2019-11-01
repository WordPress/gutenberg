<?php
/**
 * Server-side rendering of the `core/site-description` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-description` block on the server.
 *
 * @return string The render.
 */
function render_block_core_site_description() {
	return sprintf( '<p>%s</p>', get_bloginfo( 'description' ) );
}

/**
 * Registers the `core/site-description` block on the server.
 */
function register_block_core_site_description() {
	register_block_type(
		'core/site-description',
		array(
			'render_callback' => 'render_block_core_site_description',
		)
	);
}
add_action( 'init', 'register_block_core_site_description' );
