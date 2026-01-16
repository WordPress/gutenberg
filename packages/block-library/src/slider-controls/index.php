<?php
/**
 * Server-side rendering of the `core/slider-controls` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider-controls` block on the server.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_controls( $attributes ) {
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	unset( $attributes );

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => 'wp-block-slider-controls',
		)
	);

	return sprintf(
		'<div %1$s>
			<button
				type="button"
				class="wp-block-slider-controls__button wp-block-slider-controls__previous"
				aria-label="%2$s"
				data-wp-on--click="actions.prevSlide"
				data-wp-bind--disabled="state.isAtStart"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
					<path d="M14.6 7l-1.2-1L8 12l5.4 6 1.2-1-4.6-5z" />
				</svg>
			</button>
			<button
				type="button"
				class="wp-block-slider-controls__button wp-block-slider-controls__next"
				aria-label="%3$s"
				data-wp-on--click="actions.nextSlide"
				data-wp-bind--disabled="state.isAtEnd"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
					<path d="M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z" />
				</svg>
			</button>
		</div>',
		$wrapper_attributes,
		esc_attr__( 'Previous slide', 'gutenberg' ),
		esc_attr__( 'Next slide', 'gutenberg' )
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
