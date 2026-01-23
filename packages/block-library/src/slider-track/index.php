<?php
/**
 * Server-side rendering of the `core/slider-track` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider-track` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_track( $attributes, $content ) {
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'              => 'wp-block-slider-track',
			'data-wp-on--scroll' => 'actions.handleScroll',
			'data-wp-init'       => 'callbacks.initTrack',
			'data-wp-watch'      => 'callbacks.updateTrack',
		)
	);

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/slider-track` block on the server.
 */
function register_block_core_slider_track() {
	register_block_type_from_metadata(
		__DIR__ . '/slider-track',
		array(
			'render_callback' => 'render_block_core_slider_track',
		)
	);
}
add_action( 'init', 'register_block_core_slider_track' );
