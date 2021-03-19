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
	if ( ! isset( $attributes['style']['color']['duotone'] ) ) {
		return $content;
	}

	$id        = $attributes['style']['color']['duotone']['id'];
	$values    = $attributes['style']['color']['duotone']['values'];
	$selectors = array(
		'div.wp-block-image .' . $id . ' img',
		'figure.wp-block-image.' . $id . ' img',
	);
	$selector  = implode( ', ', $selectors );

	$duotone = gutenberg_render_duotone_filter( $selector, $id, $values );

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
