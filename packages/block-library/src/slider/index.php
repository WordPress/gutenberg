<?php
/**
 * Slider Block.
 *
 * @package WordPress
 */

/**
 * Counts direct Slide children for the Slider frontend controller.
 *
 * @since 7.0.0
 *
 * @param array $inner_blocks Parsed inner blocks.
 * @return int Number of direct Slide blocks.
 */
function block_core_slider_count_slides( array $inner_blocks ): int {
	$slide_count = 0;

	foreach ( $inner_blocks as $inner_block ) {
		if ( 'core/slide' === ( $inner_block['blockName'] ?? '' ) ) {
			++$slide_count;
		}
	}

	return $slide_count;
}

/**
 * Moves the HTML processor to the next tag matching the query at a specific depth.
 *
 * @since 7.0.0
 *
 * @param WP_HTML_Processor  $processor HTML processor.
 * @param string|array|null  $query     Optional. Tag name or query.
 * @param int                $depth     Required nesting depth.
 * @return bool Whether a matching tag was found.
 */
function block_core_slider_next_tag_at_depth( WP_HTML_Processor $processor, $query, int $depth ): bool {
	while ( $processor->next_tag( $query ) ) {
		if ( $depth === $processor->get_current_depth() ) {
			return true;
		}
	}

	return false;
}

/**
 * Render callback for core/slider.
 *
 * @since 7.0.0
 *
 * @param array     $attributes Block attributes.
 * @param string    $content    Block content.
 * @param \WP_Block $block      Block instance.
 *
 * @return string Updated HTML.
 */
function block_core_slider_render( array $attributes, string $content, \WP_Block $block ): string {
	if ( '' === $content ) {
		return $content;
	}

	$slide_count = block_core_slider_count_slides( $block->parsed_block['innerBlocks'] ?? array() );
	$processor   = WP_HTML_Processor::create_fragment( $content );

	if ( null === $processor || ! $processor->next_tag( array( 'class_name' => 'wp-block-slider' ) ) ) {
		return $content;
	}

	$slider_depth = $processor->get_current_depth();
	$processor->set_attribute( 'data-wp-interactive', 'core/slider' );
	$processor->set_attribute(
		'data-wp-context',
		wp_json_encode(
			array(
				'activeSlideIndex' => 0,
				'slideCount'       => $slide_count,
			),
			JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP
		)
	);
	$processor->set_attribute( 'data-wp-init', 'callbacks.init' );
	$processor->set_attribute( 'data-wp-on-window--resize', 'callbacks.refresh' );
	$processor->set_bookmark( 'core/slider' );

	if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__viewport' ), $slider_depth + 1 ) ) {
		$processor->set_attribute( 'data-wp-on--scroll', 'actions.handleScroll' );
	}

	$processor->seek( 'core/slider' );

	if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__controls' ), $slider_depth + 1 ) ) {
		$controls_depth = $processor->get_current_depth();

		$processor->set_attribute( 'aria-label', __( 'Slider controls' ) );

		if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__arrow--previous' ), $controls_depth + 1 ) ) {
			$processor->set_attribute( 'aria-label', __( 'Previous slide' ) );
			$processor->set_attribute( 'data-wp-on--click', 'actions.previous' );
			$processor->set_attribute( 'data-wp-bind--disabled', '!state.canGoPrevious' );
		}

		if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__dots' ), $controls_depth + 1 ) ) {
			$dots_depth = $processor->get_current_depth();

			$processor->set_attribute( 'data-wp-class--is-moving-next', 'state.isDotAnimationNext' );
			$processor->set_attribute( 'data-wp-class--is-moving-previous', 'state.isDotAnimationPrevious' );
			$processor->set_attribute( 'data-wp-class--is-animation-frame-a', 'state.isDotAnimationFrameA' );
			$processor->set_attribute( 'data-wp-class--is-animation-frame-b', 'state.isDotAnimationFrameB' );
			$processor->set_attribute( 'data-wp-class--has-outgoing-next-dot', 'state.hasOutgoingNextDot' );
			$processor->set_attribute( 'data-wp-class--has-outgoing-previous-dot', 'state.hasOutgoingPreviousDot' );

			if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__dot--previous' ), $dots_depth + 1 ) ) {
				$processor->set_attribute( 'data-wp-class--is-visible', 'state.canGoPrevious' );
				$processor->set_attribute( 'data-wp-bind--aria-hidden', '!state.canGoPrevious' );
			}

			if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__dot--next' ), $dots_depth + 1 ) ) {
				$processor->set_attribute( 'data-wp-class--is-visible', 'state.canGoNext' );
				$processor->set_attribute( 'data-wp-bind--aria-hidden', '!state.canGoNext' );
			}
		}

		if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__arrow--next' ), $controls_depth + 1 ) ) {
			$processor->set_attribute( 'aria-label', __( 'Next slide' ) );
			$processor->set_attribute( 'data-wp-on--click', 'actions.next' );
			$processor->set_attribute( 'data-wp-bind--disabled', '!state.canGoNext' );
		}

		if ( block_core_slider_next_tag_at_depth( $processor, array( 'class_name' => 'wp-block-slider__status' ), $controls_depth + 1 ) ) {
			$processor->set_attribute( 'data-wp-text', 'state.slideStatus' );
		}
	}

	return $processor->get_updated_html();
}

/**
 * Registers the `core/slider` block on the server.
 *
 * @since 7.0.0
 */
function register_block_core_slider() {
	register_block_type_from_metadata(
		__DIR__ . '/slider',
		array(
			'render_callback' => 'block_core_slider_render',
		)
	);
}
add_action( 'init', 'register_block_core_slider' );
