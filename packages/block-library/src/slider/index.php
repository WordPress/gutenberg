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
	/*
	 * Count slides from the rendered markup. Empty slides return ''
	 * from their render callback, so only non-empty slides are present
	 * in $content.
	 */
	$slide_count = 0;
	$p           = new WP_HTML_Tag_Processor( $content );
	while ( $p->next_tag( array( 'class_name' => 'wp-block-slide' ) ) ) {
		++$slide_count;
	}

	$context = array(
		'currentIndex' => 0,
		'totalSlides'  => $slide_count,
		'hasFocus'     => false,
		'loop'         => isset( $attributes['loop'] ) ? (bool) $attributes['loop'] : true,
	);

	wp_interactivity_config(
		'core/slider',
		array(
			/* translators: 1: Current slide number, 2: Total number of slides. */
			'slideLabelTemplate' => __( 'Slide %1$d of %2$d' ),
		)
	);

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'data-wp-interactive'  => 'core/slider',
			'data-wp-context'      => wp_json_encode( $context ),
			'data-wp-on--focusin'  => 'actions.handleFocusIn',
			'data-wp-on--focusout' => 'actions.handleFocusOut',
			'role'                 => 'region',
			'aria-roledescription' => 'carousel',
			'aria-label'           => __( 'Slider' ),
		)
	);

	// Add a visually hidden live region for screen readers.
	$live_region = '<div class="screen-reader-text" aria-live="off" aria-atomic="true" data-wp-bind--aria-live="state.ariaLive" data-wp-bind--text="state.currentSlideLabel"></div>';

	return sprintf(
		'<div %1$s>%2$s%3$s</div>',
		$wrapper_attributes,
		$content,
		$live_region
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
