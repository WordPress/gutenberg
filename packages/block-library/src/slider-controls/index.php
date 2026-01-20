<?php
/**
 * Server-side rendering of the `core/slider-controls` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider-controls` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_controls( $attributes, $content ) {

	// Use HTML Tag Processor to add Interactivity API directives to buttons
	$processor = new WP_HTML_Tag_Processor( $content );

	// Find all <a> tags (core/button renders as links)
	while ( $processor->next_tag( 'a' ) ) {
		$class_attribute = $processor->get_attribute( 'class' );

		if ( ! $class_attribute ) {
			continue;
		}

		// Add directives based on button class
		if ( strpos( $class_attribute, 'wp-block-slider-controls__previous' ) !== false ) {
			$processor->set_attribute( 'data-wp-on--click', 'actions.prevSlide' );
			$processor->set_attribute( 'data-wp-bind--disabled', 'state.isAtStart' );
			$processor->set_attribute( 'role', 'button' );
		} elseif ( strpos( $class_attribute, 'wp-block-slider-controls__next' ) !== false ) {
			$processor->set_attribute( 'data-wp-on--click', 'actions.nextSlide' );
			$processor->set_attribute( 'data-wp-bind--disabled', 'state.isAtEnd' );
			$processor->set_attribute( 'role', 'button' );
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => 'wp-block-slider-controls',
		)
	);

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$processor->get_updated_html()
	);
}

/**
 * Registers the `core/slider-controls` block on the server.
 */
function register_block_core_slider_controls() {
	register_block_type_from_metadata(
		__DIR__ . '/slider-controls',
		array(
			'render_callback' => 'render_block_core_slider_controls',
		)
	);
}
add_action( 'init', 'register_block_core_slider_controls' );
