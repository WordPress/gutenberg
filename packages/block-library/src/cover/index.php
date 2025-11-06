<?php
/**
 * Server-side rendering of the `core/cover` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/cover` block on server.
 *
 * @since 6.0.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the cover block markup, if useFeaturedImage is true.
 */
function render_block_core_cover( $attributes, $content ) {
	// Handle embed video background.
	if (
		isset( $attributes['backgroundType'] ) &&
		'embed-video' === $attributes['backgroundType'] &&
		isset( $attributes['embedSrc'] ) &&
		! empty( $attributes['embedSrc'] ) &&
		is_string( $attributes['embedSrc'] )
	) {
		$embed_src = $attributes['embedSrc'];

		// Build the iframe HTML that will replace the figure.
		$iframe_html = sprintf(
			'<div class="wp-block-cover__video-background wp-block-cover__embed-background"><iframe src="%s" title="Background video" frameborder="0" allow="autoplay; fullscreen"></iframe></div>',
			esc_url( $embed_src )
		);

		// Use the HTML API to find and replace the figure.wp-block-embed element.
		$processor = new WP_HTML_Tag_Processor( $content );

		if ( $processor->next_tag(
			array(
				'tag_name'   => 'FIGURE',
				'class_name' => 'wp-block-embed',
			)
		) ) {
			// Use regex with PREG_OFFSET_CAPTURE to find the position of the figure element.
			// This follows the same pattern used for featured image insertion below.
			$figure_pattern = '/<figure\s+[^>]*\bwp-block-embed\b[^>]*>.*?<\/figure>/is';
			if ( 1 === preg_match( $figure_pattern, $content, $matches, PREG_OFFSET_CAPTURE ) ) {
				$figure_start  = $matches[0][1];
				$figure_length = strlen( $matches[0][0] );
				$figure_end    = $figure_start + $figure_length;

				// Replace the figure element with the iframe HTML.
				$content = substr( $content, 0, $figure_start ) . $iframe_html . substr( $content, $figure_end );
			}
		}

		return $content;
	}

	if ( 'image' !== $attributes['backgroundType'] || false === $attributes['useFeaturedImage'] ) {
		return $content;
	}

	$object_position = isset( $attributes['focalPoint'] )
		? round( $attributes['focalPoint']['x'] * 100 ) . '% ' . round( $attributes['focalPoint']['y'] * 100 ) . '%'
		: null;

	if ( ! ( $attributes['hasParallax'] || $attributes['isRepeated'] ) ) {
		$attr = array(
			'class'           => 'wp-block-cover__image-background',
			'data-object-fit' => 'cover',
		);

		if ( $object_position ) {
			$attr['data-object-position'] = $object_position;
			$attr['style']                = 'object-position:' . $object_position . ';';
		}

		$image = get_the_post_thumbnail( null, $attributes['sizeSlug'] ?? 'post-thumbnail', $attr );
	} else {
		if ( in_the_loop() ) {
			update_post_thumbnail_cache();
		}
		$current_featured_image = get_the_post_thumbnail_url( null, $attributes['sizeSlug'] ?? null );
		if ( ! $current_featured_image ) {
			return $content;
		}

		$current_thumbnail_id = get_post_thumbnail_id();

		$processor = new WP_HTML_Tag_Processor( '<div></div>' );
		$processor->next_tag();

		$current_alt = trim( strip_tags( get_post_meta( $current_thumbnail_id, '_wp_attachment_image_alt', true ) ) );
		if ( $current_alt ) {
			$processor->set_attribute( 'role', 'img' );
			$processor->set_attribute( 'aria-label', $current_alt );
		}

		$processor->add_class( 'wp-block-cover__image-background' );
		$processor->add_class( 'wp-image-' . $current_thumbnail_id );
		if ( $attributes['hasParallax'] ) {
			$processor->add_class( 'has-parallax' );
		}
		if ( $attributes['isRepeated'] ) {
			$processor->add_class( 'is-repeated' );
		}

		$styles  = 'background-position:' . ( $object_position ?? '50% 50%' ) . ';';
		$styles .= 'background-image:url(' . esc_url( $current_featured_image ) . ');';
		$processor->set_attribute( 'style', $styles );

		$image = $processor->get_updated_html();
	}

	/*
	 * Inserts the featured image between the (1st) cover 'background' `span` and 'inner_container' `div`,
	 * and removes eventual whitespace characters between the two (typically introduced at template level)
	 */
	$inner_container_start = '/<div\b[^>]+wp-block-cover__inner-container[\s|"][^>]*>/U';
	if ( 1 === preg_match( $inner_container_start, $content, $matches, PREG_OFFSET_CAPTURE ) ) {
		$offset  = $matches[0][1];
		$content = substr( $content, 0, $offset ) . $image . substr( $content, $offset );
	}

	return $content;
}

/**
 * Registers the `core/cover` block renderer on server.
 *
 * @since 6.0.0
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
