<?php
/**
 * Server-side rendering of the `core/buttons` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/buttons` block on the server.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content, or empty string if the block has no inner blocks.
 */
function render_block_core_buttons( $attributes, $content, $block ) {
	if ( empty( $block->inner_blocks ) ) {
		return '';
	}

	return $content;
}

/**
 * Registers the `core/buttons` block on the server.
 */
function register_block_core_buttons() {
	register_block_type_from_metadata(
		__DIR__ . '/buttons',
		array(
			'render_callback' => 'render_block_core_buttons',
		)
	);
}
add_action( 'init', 'register_block_core_buttons' );
