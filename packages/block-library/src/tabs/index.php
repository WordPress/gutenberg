<?php
/**
 * Server-side rendering of the `core/tabs` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/tabs` block on the server.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content.
 */
function render_block_core_tabs( $attributes, $content, $block ) {
	l( 'render core/tabs' );
	return $content;
}

/**
 * Registers the `core/tabs` block on server.
 */
function register_block_core_tabs() {
	register_block_type_from_metadata(
		__DIR__ . '/tabs',
		array(
			'render_callback' => 'render_block_core_tabs',
		)
	);
}
add_action( 'init', 'register_block_core_tabs' );
