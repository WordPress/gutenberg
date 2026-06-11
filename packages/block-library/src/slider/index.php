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
	$processor   = new WP_HTML_Tag_Processor( $content );

	if ( ! $processor->next_tag( array( 'class_name' => 'wp-block-slider' ) ) ) {
		return $content;
	}

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

	if ( $processor->next_tag( array( 'class_name' => 'wp-block-slider__viewport' ) ) ) {
		$processor->set_attribute( 'data-wp-on--scroll', 'actions.handleScroll' );
	}

	if ( $processor->next_tag( array( 'class_name' => 'wp-block-slider__arrow--previous' ) ) ) {
		$processor->set_attribute( 'data-wp-on--click', 'actions.previous' );
		$processor->set_attribute( 'data-wp-bind--disabled', '!state.canGoPrevious' );
	}

	if ( $processor->next_tag( array( 'class_name' => 'wp-block-slider__dot--previous' ) ) ) {
		$processor->set_attribute( 'data-wp-class--is-visible', 'state.canGoPrevious' );
		$processor->set_attribute( 'data-wp-bind--aria-hidden', '!state.canGoPrevious' );
	}

	if ( $processor->next_tag( array( 'class_name' => 'wp-block-slider__dot--next' ) ) ) {
		$processor->set_attribute( 'data-wp-class--is-visible', 'state.canGoNext' );
		$processor->set_attribute( 'data-wp-bind--aria-hidden', '!state.canGoNext' );
	}

	if ( $processor->next_tag( array( 'class_name' => 'wp-block-slider__arrow--next' ) ) ) {
		$processor->set_attribute( 'data-wp-on--click', 'actions.next' );
		$processor->set_attribute( 'data-wp-bind--disabled', '!state.canGoNext' );
	}

	if ( $processor->next_tag( array( 'class_name' => 'wp-block-slider__status' ) ) ) {
		$processor->set_attribute( 'data-wp-text', 'state.slideStatus' );
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
