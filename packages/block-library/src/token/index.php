<?php
/**
 * Server-side rendering of the `core/token` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/token` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_token( $attributes ) {
	if ( empty( $attributes ) ) {
		return '';
	}

	return __( $attributes['content'] );
}

/**
 * Registers the `core/token` block.
 */
function register_block_core_token() {
	register_block_type_from_metadata(
		__DIR__ . '/token',
		array(
			'render_callback' => 'render_block_core_token',
		)
	);
}
add_action( 'init', 'register_block_core_token' );
