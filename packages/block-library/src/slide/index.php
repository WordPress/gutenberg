<?php
/**
 * Slide block.
 *
 * @package WordPress
 */
/**
 * Server-side rendering for the core/slide block.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block markup or an empty string if the slide has no inner blocks.
 */
function render_block_core_slide( $attributes, $content, $block ) {
	if ( empty( $block->inner_blocks ) ) {
		return '';
	}
	return $content;
}

/**
 * Registers the `core/slide` block on the server.
 */
function register_block_core_slide() {
	register_block_type_from_metadata(
		__DIR__ . '/slide',
		array(
			'render_callback' => 'render_block_core_slide',
		)
	);
}
add_action( 'init', 'register_block_core_slide' );
