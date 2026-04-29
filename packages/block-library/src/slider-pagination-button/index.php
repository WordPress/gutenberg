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
	if ( empty( $content ) ) {
		return '';
	}

	$type        = $attributes['type'] ?? 'previous';
	$is_previous = 'previous' === $type;
	$arrow_icon  = $block->context['arrowIcon'] ?? 'chevron';

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

	// Replace the SVG path to match the selected arrow icon style.
	if ( 'chevron' !== $arrow_icon && $p->next_tag( 'path' ) ) {
		$p->set_attribute( 'd', get_slider_pagination_button_icon_path( $arrow_icon, $is_previous ) );
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
