<?php

/**
 * Server-side rendering of the `core/image` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/image` block on the server,
 * adding a data-id attribute to the element if core/gallery has added on pre-render.
 *
 * @since 5.9.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The block object.
 *
 * @return string The block content with the data-id attribute added.
 */
function render_block_core_group( $attributes, $content, $block ) {
	wp_enqueue_script_module( '@wordpress/block-library/group/view' );
    return $content;
}

/**
 * Registers the `core/image` block on server.
 *
 * @since 5.9.0
 */
function register_block_core_group() {
	register_block_type_from_metadata(
		__DIR__ . '/group',
		array(
			'render_callback' => 'render_block_core_group',
		)
	);
}
add_action( 'init', 'register_block_core_group' );
