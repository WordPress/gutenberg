<?php
/**
 * Server-side rendering of the `core/slider-controls` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider-controls` block on the server.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_controls( $attributes, $content ) {
	// If no content, return empty (shouldn't happen with template)
	if ( empty( $content ) ) {
		return '';
	}

	// Use HTML Tag Processor to add Interactivity API directives to buttons
	$processor = new WP_HTML_Tag_Processor( $content );

	// Track whether we just saw a previous/next wrapper
	$next_button_is_previous = false;
	$next_button_is_next     = false;

	// Process all tags
	while ( $processor->next_tag() ) {
		$tag = $processor->get_tag();

		// Check if this is a button wrapper div
		if ( 'DIV' === $tag ) {
			if ( $processor->has_class( 'wp-block-slider-controls__previous' ) ) {
				$next_button_is_previous = true;
				$next_button_is_next     = false;
			} elseif ( $processor->has_class( 'wp-block-slider-controls__next' ) ) {
				$next_button_is_next     = true;
				$next_button_is_previous = false;
			}
		}

		// Check if this is a button or anchor with wp-block-button__link class
		if ( ( 'BUTTON' === $tag || 'A' === $tag ) && $processor->has_class( 'wp-block-button__link' ) ) {
			if ( $next_button_is_previous ) {
				$processor->set_attribute( 'data-wp-on--click', 'actions.prevSlide' );
				$processor->set_attribute( 'data-wp-bind--disabled', 'state.isAtStart' );
				$processor->set_attribute( 'aria-label', __( 'Previous slide', 'gutenberg' ) );
				$next_button_is_previous = false;
			} elseif ( $next_button_is_next ) {
				$processor->set_attribute( 'data-wp-on--click', 'actions.nextSlide' );
				$processor->set_attribute( 'data-wp-bind--disabled', 'state.isAtEnd' );
				$processor->set_attribute( 'aria-label', __( 'Next slide', 'gutenberg' ) );
				$next_button_is_next = false;
			}
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
