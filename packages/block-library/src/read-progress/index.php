<?php
/**
 * Server-side rendering of the `core/read-progress` block.
 *
 * @package WordPress
 */

/**
 * When the `core/read-progress` block is rendering, we need to enqueue the script.
 *
 * @since 5.8.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block      The parsed block.
 *
 * @return string Returns the block content.
 */
function render_block_core_read_progress( $attributes, $content ) {
	wp_enqueue_script_module( '@wordpress/block-library/read-progress/view' );
	return $content;
}

/**
 * Registers the `core/read-progress` block on server.
 *
 * @since 5.8.0
 */
function register_block_core_read_progress() {
	register_block_type_from_metadata(
		__DIR__ . '/read-progress',
		array(
			'render_callback' => 'render_block_core_read_progress',
		)
	);
}

add_action( 'init', 'register_block_core_read_progress' );
