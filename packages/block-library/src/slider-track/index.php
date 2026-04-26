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
	$depth       = 0;
	$slide_count = 0;
	$has_pagination_in_slides = false;

	/*
	 * Build a lookup of which slides have inner blocks,
	 * based on the WP_Block inner_blocks tree. Slides without inner blocks
	 * are excluded from the rendered output and the slide count.
	 */
	$slide_has_inner_blocks = array();
	$raw_slide_index        = 0;
	foreach ( $block->inner_blocks as $inner_block ) {
		if ( 'core/slide' === $inner_block->name ) {
			++$raw_slide_index;
			$slide_has_inner_blocks[ $raw_slide_index ] = ! empty( $inner_block->inner_blocks );
		}
	}

	$raw_slide_counter = 0;

	while ( $p->next_token() ) {
		if ( '#tag' !== $p->get_token_type() ) {
			continue;
		}

		if ( $p->is_tag_closer() ) {
			if ( $depth > 0 ) {
				--$depth;
			}
			continue;
		}

		if ( 0 === $depth && $p->has_class( 'wp-block-slide' ) ) {
			++$raw_slide_counter;
			// Only count and bookmark slides that have inner blocks.
			if ( ! empty( $slide_has_inner_blocks[ $raw_slide_counter ] ) ) {
				++$slide_count;
				$p->set_bookmark( "slide_$slide_count" );
			}
		}

		if ( $depth > 0 && $p->has_class( 'wp-block-slider-pagination' ) ) {
			$has_pagination_in_slides = true;
		}

		$tag_name = $p->get_tag();
		if ( $tag_name && ! WP_HTML_Processor::is_void( $tag_name ) ) {
			++$depth;
		}
	}

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
