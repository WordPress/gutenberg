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
	// The view module decides whether a background video may play, so it is
	// only needed for the two video background types.
	if (
		isset( $attributes['backgroundType'] ) &&
		in_array( $attributes['backgroundType'], array( 'video', 'embed-video' ), true )
	) {
		wp_enqueue_script_module( '@wordpress/block-library/cover/view' );
	}

	// Handle embed video background.
	if (
		isset( $attributes['backgroundType'] ) &&
		'embed-video' === $attributes['backgroundType'] &&
		isset( $attributes['url'] ) &&
		! empty( $attributes['url'] ) &&
		is_string( $attributes['url'] )
	) {
		$url = $attributes['url'];

		// Use WordPress's native oEmbed processing (includes caching).
		$oembed_html = wp_oembed_get( $url );

		if ( $oembed_html ) {
			// Read the iframe src with the HTML API, which returns the attribute
			// value decoded, so `&amp;` in the query string becomes `&`.
			$oembed_processor = new WP_HTML_Tag_Processor( $oembed_html );
			$iframe_src       = $oembed_processor->next_tag( 'IFRAME' )
				? $oembed_processor->get_attribute( 'src' )
				: null;
			if ( is_string( $iframe_src ) && '' !== $iframe_src ) {
				// Detect provider from iframe src URL.
				$lower_src = strtolower( $iframe_src );
				$provider  = null;

				if ( str_contains( $lower_src, 'youtube.com' ) || str_contains( $lower_src, 'youtu.be' ) ) {
					$provider = 'youtube';
				} elseif ( str_contains( $lower_src, 'vimeo.com' ) ) {
					$provider = 'vimeo';
				} elseif ( str_contains( $lower_src, 'videopress.com' ) ) {
					$provider = 'videopress';
				} elseif ( str_contains( $lower_src, 'wordpress.tv' ) ) {
					$provider = 'wordpress-tv';
				}

				// Modify iframe src to add background video parameters based on provider.
				$parsed_url         = wp_parse_url( $iframe_src );
				$reduced_motion_src = null;
				if ( $parsed_url && isset( $parsed_url['host'] ) ) {
					// Parse existing query parameters.
					$query_params = array();
					if ( isset( $parsed_url['query'] ) ) {
						parse_str( $parsed_url['query'], $query_params );
					}

					// Add background video parameters based on provider. The
					// autoplay parameters are kept separate so a source without
					// them can also be built, which the view script swaps in for
					// a visitor who has asked for reduced motion.
					$autoplay_params = array();
					if ( 'youtube' === $provider ) {
						$query_params['mute']           = '1';
						$query_params['loop']           = '1';
						$query_params['controls']       = '0';
						$query_params['modestbranding'] = '1';
						$query_params['playsinline']    = '1';

						// For loop to work, we need the playlist parameter.
						$path          = $parsed_url['path'] ?? '';
						$path_segments = explode( '/', $path );
						$video_id      = end( $path_segments );
						if ( $video_id ) {
								$query_params['playlist'] = $video_id;
						}

						$autoplay_params['autoplay'] = '1';
					} elseif ( 'vimeo' === $provider ) {
						$query_params['muted']       = '1';
						$query_params['loop']        = '1';
						$query_params['controls']    = '0';
						$query_params['transparent'] = '0';

						// Vimeo's background mode always autoplays, so it can only
						// be used when autoplay is allowed.
						$autoplay_params['autoplay']   = '1';
						$autoplay_params['background'] = '1';
					} elseif ( 'videopress' === $provider || 'wordpress-tv' === $provider ) {
						$query_params['loop']  = '1';
						$query_params['muted'] = '1';

						$autoplay_params['autoplay'] = '1';
					}

					// Rebuild the URL with new parameters.
					$iframe_base = $parsed_url['scheme'] . '://' . $parsed_url['host'];
					if ( isset( $parsed_url['path'] ) ) {
						$iframe_base .= $parsed_url['path'];
					}

					$reduced_motion_src = empty( $query_params )
						? $iframe_base
						: $iframe_base . '?' . http_build_query( $query_params );

					$iframe_src = empty( $autoplay_params )
						? $reduced_motion_src
						: $iframe_base . '?' . http_build_query( array_merge( $query_params, $autoplay_params ) );
				}

				// Build the iframe HTML that will replace the figure. The server
				// renders the autoplaying source, and the view script swaps in the
				// one without autoplay for a visitor who prefers reduced motion.
				$iframe_html = sprintf(
					'<div class="wp-block-cover__video-background wp-block-cover__embed-background" data-wp-interactive="core/cover" data-wp-context=\'%s\'><iframe src="%s" data-wp-bind--src="state.videoSrc" title="Background video" frameborder="0" allow="autoplay; fullscreen"></iframe></div>',
					esc_attr(
						wp_json_encode(
							array(
								'src'              => $iframe_src,
								'reducedMotionSrc' => $reduced_motion_src,
							)
						)
					),
					esc_url( $iframe_src )
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
			}
		}

		return $content;
	}

	// Handle uploaded video background. The video is saved with `autoplay`, so
	// the view module stops it for a visitor who prefers reduced motion. The
	// directives are added here rather than in the saved markup so existing
	// content does not need a deprecation.
	if (
		isset( $attributes['backgroundType'] ) &&
		'video' === $attributes['backgroundType']
	) {
		$processor = new WP_HTML_Tag_Processor( $content );

		if ( $processor->next_tag(
			array(
				'tag_name'   => 'VIDEO',
				'class_name' => 'wp-block-cover__video-background',
			)
		) ) {
			$processor->set_attribute( 'data-wp-interactive', 'core/cover' );
			$processor->set_attribute( 'data-wp-init', 'callbacks.stopBackgroundVideo' );

			$content = $processor->get_updated_html();
		}

		return $content;
	}

	// Handle uploaded image background.
	if (
		'image' === $attributes['backgroundType'] &&
		empty( $attributes['useFeaturedImage'] ) &&
		empty( $attributes['hasParallax'] ) &&
		empty( $attributes['isRepeated'] ) &&
		isset( $attributes['id'] ) &&
		is_numeric( $attributes['id'] )
	) {
		$size_slug = isset( $attributes['sizeSlug'] ) && is_string( $attributes['sizeSlug'] ) ? $attributes['sizeSlug'] : 'full';
		$image_src = wp_get_attachment_image_src( (int) $attributes['id'], $size_slug );
		$sizes     = $image_src ? block_core_cover_get_background_image_sizes( $attributes, $image_src[1], $image_src[2] ) : null;

		if ( $sizes ) {
			$processor = new WP_HTML_Tag_Processor( $content );
			if (
				$processor->next_tag(
					array(
						'tag_name'   => 'IMG',
						'class_name' => 'wp-block-cover__image-background',
					)
				) &&
				null === $processor->get_attribute( 'sizes' )
			) {
				$processor->set_attribute( 'sizes', $sizes );
				$content = $processor->get_updated_html();
			}
		}

		return $content;
	}

	if ( 'image' !== $attributes['backgroundType'] || false === $attributes['useFeaturedImage'] ) {
		return $content;
	}

	$cover_focal_point = $attributes['focalPoint'] ?? null;
	$focal_point_x     = null;
	$focal_point_y     = null;
	if ( is_array( $cover_focal_point ) ) {
		$focal_point_x = isset( $cover_focal_point['x'] ) && is_numeric( $cover_focal_point['x'] ) ? $cover_focal_point['x'] : null;
		$focal_point_y = isset( $cover_focal_point['y'] ) && is_numeric( $cover_focal_point['y'] ) ? $cover_focal_point['y'] : null;
	}
	$object_position = null !== $focal_point_x && null !== $focal_point_y
		? round( $focal_point_x * 100 ) . '% ' . round( $focal_point_y * 100 ) . '%'
		: null;

	if ( ! ( $attributes['hasParallax'] || $attributes['isRepeated'] ) ) {
		$attr = array(
			'class' => 'wp-block-cover__image-background',
		);

		if ( $object_position ) {
			$attr['style'] = 'object-position:' . $object_position . ';';
		}

		$size_slug    = isset( $attributes['sizeSlug'] ) && is_string( $attributes['sizeSlug'] ) ? $attributes['sizeSlug'] : 'post-thumbnail';
		$thumbnail_id = get_post_thumbnail_id();
		$image_src    = $thumbnail_id ? wp_get_attachment_image_src( $thumbnail_id, $size_slug ) : false;
		$sizes        = $image_src ? block_core_cover_get_background_image_sizes( $attributes, $image_src[1], $image_src[2] ) : null;
		if ( $sizes ) {
			$attr['sizes'] = $sizes;
		}

		$image = get_the_post_thumbnail( null, $size_slug, $attr );
		if ( $sizes ) {
			$image = block_core_cover_remove_background_image_auto_sizes( $image );
		}
	} else {
		if ( in_the_loop() ) {
			update_post_thumbnail_cache();
		}
		$current_featured_image = get_the_post_thumbnail_url( null, $attributes['sizeSlug'] ?? 'full' );
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
 * Returns a `sizes` value for a Cover background image that accounts for the
 * height of the block.
 *
 * The background image uses `object-fit: cover`, so it is scaled up until it
 * fills both the width and the height of the block. The default `sizes` value
 * only describes the width, so for an image that is wider than the block, the
 * browser picks a file too small to fill the height and stretches it.
 *
 * @since 7.3.0
 *
 * @param array     $attributes   The block attributes.
 * @param int|float $image_width  Width of the image file in pixels.
 * @param int|float $image_height Height of the image file in pixels.
 * @return string|null The `sizes` value, or null to keep the default one.
 */
function block_core_cover_get_background_image_sizes( $attributes, $image_width, $image_height ) {
	if ( ! is_numeric( $image_width ) || ! is_numeric( $image_height ) || $image_width <= 0 || $image_height <= 0 ) {
		return null;
	}

	$image_ratio = $image_width / $image_height;
	$dimensions  = isset( $attributes['style'] ) && is_array( $attributes['style'] ) &&
		isset( $attributes['style']['dimensions'] ) && is_array( $attributes['style']['dimensions'] )
		? $attributes['style']['dimensions']
		: array();

	// With an aspect ratio, the height follows the width, so the width needed
	// to fill the block is a fixed multiple of the viewport width.
	$aspect_ratio = $dimensions['aspectRatio'] ?? null;
	if ( is_string( $aspect_ratio ) && preg_match( '/^\s*(\d*\.?\d+)\s*(?:\/\s*(\d*\.?\d+)\s*)?$/', $aspect_ratio, $matches ) ) {
		$denominator = isset( $matches[2] ) ? (float) $matches[2] : 1.0;
		$block_ratio = $denominator > 0 ? (float) $matches[1] / $denominator : 0;
		if ( $block_ratio > 0 ) {
			$scale = $image_ratio / $block_ratio;
			// Filling the width already fills the height.
			if ( $scale <= 1 ) {
				return null;
			}
			return round( 100 * $scale, 2 ) . 'vw';
		}
	}

	$min_height = $dimensions['minHeight'] ?? null;
	if ( null === $min_height && isset( $attributes['minHeight'] ) && is_numeric( $attributes['minHeight'] ) ) {
		// Content saved before the minimum height moved to the dimensions block support.
		$unit       = isset( $attributes['minHeightUnit'] ) && is_string( $attributes['minHeightUnit'] ) ? $attributes['minHeightUnit'] : 'px';
		$min_height = $attributes['minHeight'] . $unit;
	}
	if ( null === $min_height ) {
		// The minimum height set in the block stylesheet.
		$min_height = '430px';
	}

	// Lengths such as `var()` or `clamp()` are left alone, since `sizes` can't use them all.
	if ( ! is_string( $min_height ) || ! preg_match( '/^(\d*\.?\d+)(px|em|rem|vh|vw|svh|lvh|dvh|vmin|vmax)$/', trim( $min_height ), $matches ) ) {
		return null;
	}

	$width_to_fill = round( (float) $matches[1] * $image_ratio, 2 );
	if ( $width_to_fill <= 0 ) {
		return null;
	}

	return 'max(100vw, ' . $width_to_fill . $matches[2] . ')';
}

/**
 * Removes the `auto` keyword that WordPress adds to the `sizes` attribute of
 * lazy-loaded images from a Cover background image.
 *
 * `auto` makes the browser use the width of the image element, which ignores
 * the height that the image has to fill. The keyword is only removed from
 * values set by block_core_cover_get_background_image_sizes().
 *
 * @since 7.3.0
 *
 * @param string $image The image tag markup.
 * @return string The filtered image tag markup.
 */
function block_core_cover_remove_background_image_auto_sizes( $image ) {
	if ( ! is_string( $image ) || ! str_contains( $image, 'wp-block-cover__image-background' ) ) {
		return $image;
	}

	$processor = new WP_HTML_Tag_Processor( $image );
	if (
		! $processor->next_tag(
			array(
				'tag_name'   => 'IMG',
				'class_name' => 'wp-block-cover__image-background',
			)
		)
	) {
		return $image;
	}

	$sizes = $processor->get_attribute( 'sizes' );
	if ( ! is_string( $sizes ) || ! preg_match( '/^\s*auto\s*,\s*(max\(100vw, [^)]+\)|\d*\.?\d+vw)\s*$/i', $sizes, $matches ) ) {
		return $image;
	}

	$processor->set_attribute( 'sizes', $matches[1] );
	return $processor->get_updated_html();
}
add_filter( 'wp_content_img_tag', 'block_core_cover_remove_background_image_auto_sizes' );

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
