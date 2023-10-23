<?php
/**
 * Server-side rendering of the `core/overlay` block.
 *
 * @package WordPress
 */

/**
 *  Registers the `core/navigation-overlay` block on the server.
 */
function register_block_core_navigation_overlay() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-overlay',
		array(
			'render_callback' => 'render_block_core_navigation_overlay',
		)
	);
}

/**
 * Renders the `core/navigation-overlay` block on the server.
 *
 *
 * @param array $attributes Block attributes.
 *
 * @return string Returns the output of the overlay.
 */
function render_block_core_navigation_overlay( $attributes ) {
	return 'navigation overlay';
}

add_action( 'init', 'register_block_core_navigation_overlay' );
