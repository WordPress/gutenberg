<?php
/**
 * Server-side rendering of the `core/accordion` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/accordion` block on the server,
 * adding a data-id attribute to the element if core/gallery has added on pre-render.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content with the data-id attribute added.
 */
function render_block_core_accordion( $attributes, $content, $block ) {
	return $content;
}

/**
 * Registers the `core/accordion` block on server.
 */
function register_block_core_accordion() {
	register_block_type_from_metadata(
		__DIR__ . '/accordion',
		array(
			'render_callback' => 'render_block_core_accordion',
		)
	);
}
add_action( 'init', 'register_block_core_accordion' );
