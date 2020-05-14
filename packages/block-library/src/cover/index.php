<?php
/**
 * Server-side rendering of the `core/cover` block.
 *
 * @package WordPress
 */

/**
 * Supports `playsinline` attribute server side for `core/cover`.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_cover( $attributes, $content ) {
	if ( isset( $attributes['backgroundType'] ) && $attributes['backgroundType'] === 'video' ) {
		return str_replace( 'autoplay muted', 'autoplay muted playsinline', $content );
	}

	return $content;
}

/**
 * Registers the `core/cover` block.
 */
function register_block_core_cover() {
	register_block_type_from_metadata(
		__DIR__ . '/cover',
		array(
			'render_callback' => 'render_block_core_cover',
		)
	);
}
add_action( 'init', 'register_block_core_cover' );
