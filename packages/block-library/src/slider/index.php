<?php
/**
 * Server-side rendering of the `core/slider` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider( $attributes, $content, $block ) {
	// Find the slider-track to get slide count
	$slide_count = 0;
	foreach ( $block->inner_blocks as $inner_block ) {
		if ( 'core/slider-track' === $inner_block->name ) {
			$slide_count = count( $inner_block->inner_blocks );
			break;
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'data-wp-interactive' => 'core/slider',
			'data-wp-context'     => wp_json_encode(
				array(
					'currentIndex' => 0,
					'totalSlides'  => $slide_count,
				)
			),
		)
	);

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/slider` block on the server.
 */
function register_block_core_slider() {
	register_block_type_from_metadata(
		__DIR__ . '/slider',
		array(
			'render_callback' => 'render_block_core_slider',
		)
	);
}
add_action( 'init', 'register_block_core_slider' );
