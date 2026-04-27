<?php
/**
 * Server-side rendering of the `core/slider-pagination-button` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider-pagination-button` block on the server.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_pagination_button( $attributes, $content ) {
	if ( empty( $content ) ) {
		return '';
	}

	$type        = $attributes['type'] ?? 'previous';
	$is_previous = 'previous' === $type;

	$p = new WP_HTML_Tag_Processor( $content );

	$label = $is_previous
		? __( 'Previous slide' )
		: __( 'Next slide' );

	// The button is the root element. Add the interactive namespace,
	// translated label, ARIA attributes, and Interactivity API directives.
	if ( $p->next_tag( array( 'class_name' => 'wp-block-slider-pagination-button' ) ) ) {
		$p->set_attribute( 'data-wp-interactive', 'core/slider' );
		$p->set_attribute( 'aria-label', $label );

		if ( $is_previous ) {
			$p->set_attribute( 'data-wp-on--click', 'actions.prevSlide' );
			$p->set_attribute( 'data-wp-bind--aria-disabled', 'state.isAtStart' );
		} else {
			$p->set_attribute( 'data-wp-on--click', 'actions.nextSlide' );
			$p->set_attribute( 'data-wp-bind--aria-disabled', 'state.isAtEnd' );
		}
	}

	return $p->get_updated_html();
}

/**
 * Registers the `core/slider-pagination-button` block on the server.
 */
function register_block_core_slider_pagination_button() {
	register_block_type_from_metadata(
		__DIR__ . '/slider-pagination-button',
		array(
			'render_callback' => 'render_block_core_slider_pagination_button',
		)
	);
}
add_action( 'init', 'register_block_core_slider_pagination_button' );
