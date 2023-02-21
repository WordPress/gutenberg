<?php
/**
 * Server-side rendering of the `core/cover` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/cover` block on server.
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the cover block markup, if useFeaturedImage is true.
 */
function render_block_core_cover( $attributes, $content ) {
	$wrapper_attrs = array();

	if ( 'image' === $attributes['backgroundType'] && false !== $attributes['useFeaturedImage'] ) {
		if ( ! ( $attributes['hasParallax'] || $attributes['isRepeated'] ) ) {
			$attr = array(
				'class'           => 'wp-block-cover__image-background',
				'data-object-fit' => 'cover',
			);

			if ( isset( $attributes['focalPoint'] ) ) {
				$object_position              = round( $attributes['focalPoint']['x'] * 100 ) . '%' . ' ' . round( $attributes['focalPoint']['y'] * 100 ) . '%';
				$attr['data-object-position'] = $object_position;
				$attr['style']                = 'object-position: ' . $object_position;
			}

			$image = get_the_post_thumbnail( null, 'post-thumbnail', $attr );

			/*
			 * Inserts the featured image between the (1st) cover 'background' `span` and 'inner_container' `div`,
			 * and removes eventual withespace characters between the two (typically introduced at template level)
			 */
			$inner_container_start = '/<div\b[^>]+wp-block-cover__inner-container[\s|"][^>]*>/U';
			if ( 1 === preg_match( $inner_container_start, $content, $matches, PREG_OFFSET_CAPTURE ) ) {
				$offset  = $matches[0][1];
				$content = substr( $content, 0, $offset ) . $image . substr( $content, $offset );
			}
		} else {
			if ( in_the_loop() ) {
				update_post_thumbnail_cache();
			}
			$current_featured_image = get_the_post_thumbnail_url();

			$styles = 'background-image:url(' . esc_url( $current_featured_image ) . '); ';

			if ( isset( $attributes['minHeight'] ) ) {
				$height_unit = empty( $attributes['minHeightUnit'] ) ? 'px' : $attributes['minHeightUnit'];
				$height      = " min-height:{$attributes['minHeight']}{$height_unit}";

				$styles .= $height;
			}

			$wrapper_attrs['style'] = $styles;
		}
	}

	$preg_class_pattern = '/class="([^"]*)"/';
	preg_match(
		$preg_class_pattern,
		$content,
		$class_matches
	);
	if ( isset( $class_matches[1] ) ) {
		$classes = explode( ' ', $class_matches[1] );
		$classes = array_diff( $classes, array( 'wp-block-cover' ) ) ;
		$classes = implode( ' ', $classes );
		$wrapper_attrs['class'] = $classes;
	}
	$wrapper_attributes = get_block_wrapper_attributes( $wrapper_attrs );

	$content = preg_replace(
		$preg_class_pattern,
		$wrapper_attributes,
		$content,
		1
	);

	return $content;
}

/**
 * Registers the `core/cover` block renderer on server.
 */
function register_block_core_cover() {
	register_block_type_from_metadata(
		__DIR__ . '/cover',
		array(
			'render_callback' => 'render_block_core_cover',
		)
	);
}
add_action( 'init', 'register_block_core_cover' );
