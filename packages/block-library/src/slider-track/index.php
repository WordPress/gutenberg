<?php
/**
 * Server-side rendering of the `core/slider-track` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/slider-track` block on the server.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the block markup.
 */
function render_block_core_slider_track( $attributes, $content, $block ) {
	$p           = new WP_HTML_Tag_Processor( $content );
	$slide_count = 0;

	/*
	 * Every .wp-block-slide element present in $content is non-empty,
	 * because empty slides return '' from their render callback and
	 * produce no markup. Count and bookmark them all directly.
	 */
	while ( $p->next_tag( array( 'class_name' => 'wp-block-slide' ) ) ) {
		++$slide_count;
		$p->set_bookmark( "slide_$slide_count" );
	}

	/*
	 * Check if pagination controls are nested inside the slides.
	 * Since slider-track only allows core/slide children, the pagination
	 * class can only appear in this content if it's inside a slide.
	 */
	$has_pagination_in_slides = str_contains( $content, 'wp-block-slider-pagination' );

	for ( $slide_index = 1; $slide_index <= $slide_count; ++$slide_index ) {
		if ( ! $p->seek( "slide_$slide_index" ) ) {
			continue;
		}

		$p->set_attribute( 'role', 'group' );
		$p->set_attribute( 'aria-roledescription', 'slide' );
		$p->set_attribute(
			'aria-label',
			sprintf(
				/* translators: 1: Slide number, 2: Total number of slides. */
				__( '%1$d of %2$d' ),
				$slide_index,
				$slide_count
			)
		);

		if ( $has_pagination_in_slides || 1 === $slide_index ) {
			$p->remove_attribute( 'inert' );
		} else {
			$p->set_attribute( 'inert', '' );
		}
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'              => 'wp-block-slider-track',
			'data-wp-on--scroll' => 'actions.handleScroll',
			'data-wp-init'       => 'callbacks.initTrack',
			'tabindex'           => '0',
			'aria-label'         => __( 'Slides' ),
		)
	);

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$p->get_updated_html()
	);
}

/**
 * Registers the `core/slider-track` block on the server.
 */
function register_block_core_slider_track() {
	register_block_type_from_metadata(
		__DIR__ . '/slider-track',
		array(
			'render_callback' => 'render_block_core_slider_track',
		)
	);
}
add_action( 'init', 'register_block_core_slider_track' );
