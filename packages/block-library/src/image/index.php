<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package WordPress
 */

/**
 * Supports `duotone` attribute server side for `core/image`.
 *
 * @param array  $attributes The block attributes.
 * @param string $content HTML content of the block.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_image( $attributes, $content ) {
	if ( ! isset( $attributes['duotone'] ) ) {
		return $content;
	}

	$duotone_slug   = $attributes['duotone']['slug'];
	$duotone_values = $attributes['duotone']['values'];
	$edit_selector  = 'img';

	$duotone = gutenberg_render_duotone_filter( $duotone_slug, $edit_selector, $duotone_values );

	return $content . $duotone;
}

/**
 * Registers the `core/image` block.
 */
function register_block_core_image() {
	register_block_type_from_metadata(
		__DIR__ . '/image',
		array(
			'render_callback' => 'render_block_core_image',
		)
	);
}
add_action( 'init', 'register_block_core_image' );
