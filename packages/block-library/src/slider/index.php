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
	$pagination_content = '';
	$slides_content     = '';
	$other_content      = '';
	$slide_count        = 0;

	if ( $block instanceof WP_Block && ! empty( $block->inner_blocks ) ) {
		foreach ( $block->inner_blocks as $inner_block ) {
			$rendered_inner_block = $inner_block->render();

			if ( '' === $rendered_inner_block ) {
				continue;
			}

			if ( 'core/slider-pagination' === $inner_block->name ) {
				$pagination_content .= $rendered_inner_block;
				continue;
			}

			if ( 'core/slide' === $inner_block->name ) {
				$slides_content .= $rendered_inner_block;
				++$slide_count;
				continue;
			}

			$other_content .= $rendered_inner_block;
		}
	} else {
		$p = new WP_HTML_Tag_Processor( $content );
		while ( $p->next_tag( array( 'class_name' => 'wp-block-slide' ) ) ) {
			++$slide_count;
		}

		$slides_content = $content;
	}

	// If there are no slides, do not render the slider block.
	if ( 0 === $slide_count ) {
		return '';
	}

	$p           = new WP_HTML_Tag_Processor( $slides_content );
	$slide_index = 0;

	while ( $p->next_tag( array( 'class_name' => 'wp-block-slide' ) ) ) {
		++$slide_index;
		$p->set_attribute( 'role', 'group' );
		$p->set_attribute( 'aria-roledescription', 'slide' );
		$p->set_attribute(
			'aria-label',
			sprintf(
				/* translators: 1: Slide number, 2: Total number of slides. */
				__( 'Slide %1$d of %2$d' ),
				$slide_index,
				$slide_count
			)
		);

		if ( 1 === $slide_index ) {
			$p->remove_attribute( 'inert' );
		} else {
			$p->set_attribute( 'inert', '' );
		}
	}

	$track_markup = sprintf(
		'<div class="wp-block-slider-track" data-wp-on--scroll="actions.handleScroll" data-wp-init="callbacks.initTrack" tabindex="0" aria-label="%1$s">%2$s</div>',
		esc_attr__( 'Slides' ),
		$p->get_updated_html()
	);

	$rendered_content = $pagination_content . $track_markup . $other_content;

	$slides_to_show = isset( $attributes['slidesToShow'] ) ? (int) $attributes['slidesToShow'] : 1;
	$slides_to_show = max( 1, min( $slides_to_show, $slide_count ) );

	$context = array(
		'currentIndex' => 0,
		'totalSlides'  => $slide_count,
		'slidesToShow' => $slides_to_show,
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

	$aria_label = ! empty( $attributes['ariaLabel'] ) ? $attributes['ariaLabel'] : __( 'Slider' );

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'data-wp-interactive'  => 'core/slider',
			'data-wp-context'      => wp_json_encode( $context ),
			'data-wp-on--focusin'  => 'actions.handleFocusIn',
			'data-wp-on--focusout' => 'actions.handleFocusOut',
			'style'                => "--wp--slider-slides-to-show: {$slides_to_show}",
			'role'                 => 'region',
			'aria-roledescription' => 'carousel',
			'aria-label'           => $aria_label,
		)
	);

	// Add a visually hidden live region for screen readers.
	$live_region = '<div class="screen-reader-text" aria-live="off" aria-atomic="true" data-wp-bind--aria-live="state.ariaLive" data-wp-bind--text="state.currentSlideLabel"></div>';

	return sprintf(
		'<div %1$s>%2$s%3$s</div>',
		$wrapper_attributes,
		$rendered_content,
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
