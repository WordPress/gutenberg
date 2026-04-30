<?php
/**
 * Server-side rendering of the `core/slider-pagination-button` block.
 *
 * @package WordPress
 */

/**
 * Returns the SVG path `d` attribute for a given arrow icon style and direction.
 *
 * These paths match the @wordpress/icons chevronLeft/Right and arrowLeft/Right icons.
 *
 * @param string $arrow_icon Icon style: 'chevron' or 'arrow'.
 * @param bool   $is_previous True for the previous (left-pointing) button.
 * @return string SVG path data.
 */
function get_slider_pagination_button_icon_path( $arrow_icon, $is_previous ) {
	$paths = array(
		'chevron' => array(
			'previous' => 'M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z',
			'next'     => 'M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z',
		),
		'arrow'   => array(
			'previous' => 'M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z',
			'next'     => 'm14.5 6.5-1 1 3.7 3.7H4v1.6h13.2l-3.7 3.7 1 1 5.6-5.5z',
		),
	);

	$icon_paths = $paths[ $arrow_icon ] ?? $paths['chevron'];
	$direction  = $is_previous ? 'previous' : 'next';

	return $icon_paths[ $direction ];
}

/**
 * Renders the `core/slider-pagination-button` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_pagination_button( $attributes, $content, $block ) {
	$type        = $attributes['type'] ?? 'previous';
	$is_previous = 'previous' === $type;
	$arrow_icon  = $block->context['arrowIcon'] ?? 'chevron';
	$button_type = $block->context['navigationButtonType'] ?? 'icon';
	$button_text = $is_previous ? __( 'Previous' ) : __( 'Next' );
	$label       = $is_previous ? __( 'Previous slide' ) : __( 'Next slide' );

	// Build the button inner HTML based on navigationButtonType.
	$icon_svg  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" class="wp-block-slider-pagination-button__icon"><path d="' . esc_attr( get_slider_pagination_button_icon_path( $arrow_icon, $is_previous ) ) . '" /></svg>';
	$text_span = '<span class="wp-block-slider-pagination-button__text">' . esc_html( $button_text ) . '</span>';

	if ( 'icon' === $button_type ) {
		$button_inner = $icon_svg;
	} elseif ( 'text' === $button_type ) {
		$button_inner = $text_span;
	} elseif ( $is_previous ) {
		$button_inner = $icon_svg . $text_span;
	} else {
		$button_inner = $text_span . $icon_svg;
	}

	// Compose the button markup.
	$button_classes = 'wp-block-slider-pagination-button is-type-' . esc_attr( $type ) . ' is-icon-' . esc_attr( $arrow_icon );
	$button_type_attr = 'button';

	// Only add aria-label if button is icon-only (no visible text)
	$button_attrs = 'class="' . $button_classes . '" type="' . $button_type_attr . '" data-wp-interactive="core/slider"';
	if ( 'icon' === $button_type ) {
		$button_attrs .= ' aria-label="' . esc_attr( $label ) . '"';
	}
	if ( $is_previous ) {
		$button_attrs .= ' data-wp-on--click="actions.prevSlide" data-wp-bind--aria-disabled="state.isAtStart"';
	} else {
		$button_attrs .= ' data-wp-on--click="actions.nextSlide" data-wp-bind--aria-disabled="state.isAtEnd"';
	}

	return '<button ' . $button_attrs . '>' . $button_inner . '</button>';
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
