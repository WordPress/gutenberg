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
function render_block_core_slider_controls( $attributes, $content, $block ) {
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	unset( $attributes );

	// Process inner blocks to add Interactivity API directives
	$processed_content = $content;

	// Find core/button blocks and add directives
	if ( ! empty( $block->inner_blocks ) ) {
		foreach ( $block->inner_blocks as $buttons_block ) {
			if ( 'core/buttons' === $buttons_block->name && ! empty( $buttons_block->inner_blocks ) ) {
				foreach ( $buttons_block->inner_blocks as $index => $button_block ) {
					if ( 'core/button' === $button_block->name ) {
						$button_html      = $button_block->render();
						$button_classname = isset( $button_block->attributes['className'] ) ? $button_block->attributes['className'] : '';

						// Add directives based on button class
						if ( strpos( $button_classname, 'wp-block-slider-controls__previous' ) !== false ) {
							$modified_button   = str_replace(
								'<a ',
								'<a data-wp-on--click="actions.prevSlide" data-wp-bind--disabled="state.isAtStart" ',
								$button_html
							);
							$processed_content = str_replace( $button_html, $modified_button, $processed_content );
						} elseif ( strpos( $button_classname, 'wp-block-slider-controls__next' ) !== false ) {
							$modified_button   = str_replace(
								'<a ',
								'<a data-wp-on--click="actions.nextSlide" data-wp-bind--disabled="state.isAtEnd" ',
								$button_html
							);
							$processed_content = str_replace( $button_html, $modified_button, $processed_content );
						}
					}
				}
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
		$processed_content
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
