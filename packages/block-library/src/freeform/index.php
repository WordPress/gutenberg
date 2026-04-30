<?php
/**
 * Server-side rendering of the `core/freeform` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/freeform` block on server.
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block content.
 *
 * @return string Returns the block content with shortcodes processed.
 */
function render_block_core_freeform( $attributes, $content ) {
	return do_shortcode( $attributes['content'] ?? $content );
}

/**
 * Registers the `core/freeform` block on server.
 */
function register_block_core_freeform() {
	register_block_type_from_metadata(
		__DIR__ . '/freeform',
		array(
			'render_callback' => 'render_block_core_freeform',
		)
	);
}
add_action( 'init', 'register_block_core_freeform' );
