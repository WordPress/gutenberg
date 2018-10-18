<?php
/**
 * core/image block.
 */

// TODO: TBD
function _gutenberg_prime_post_caches( $content ) {
	// Need to find all image blocks and get the attachment IDs from them BEFORE the parser is run
	// (so we can prime the cache for getting the image attachment meta)...
	if ( preg_match_all( '/^<!-- wp:image {.*"id":(\d+),.*} -->$/m', $content, $matches ) ) {
		$attachment_ids = $matches[1];

		/*
		 * Warm the object cache with post and meta information for all found
		 * images to avoid making individual database calls.
		 */
		_prime_post_caches( $attachment_ids, false, true );
	}

	return $content;
}

// Run before blocks are parsed.
add_filter( 'the_content', '_gutenberg_prime_post_caches', 5 );

/**
 * Get the expected block width from the global $block_width array.
 *
 * The global $block_width array is expectd to be set by the theme for each block container.
 * It should contain three values: default, wide and full, in pixels.
 * - The `default` value should be the expected block width (similarly to $content_width).
 * - The `wide` value is optional and is used when the block alignment is set to `wide`.
 * - Similarly the `full` value is optional and used then the alignment is set to `full`.
 * If `wide` and `full` are not set, the `default` value is used instead.
 *
 * Example:
 *     $GLOBALS['block_width'] = array(
 *         'default' => 640,
 *         'wide'    => 800,
 *         'full'    => 1024,
 *     );
 *
 * In addition the $block_width array should be set contextually for each block container.
 * For example: in the main content column the `default` width will be something like 640(px),
 * but for a sidebar it would be something like 250.
 *
 * @since 4.0.0
 *
 * @return array Normalized array of expected block width with three elements: `default`, `wide`, and `full`.
 */
function gutenberg_get_block_width() {
	global $content_width, $block_width;

	// Get the width from the $block_width global array
	// or fall back to using $content_width.
	if ( empty( $block_width ) || ! is_array( $block_width ) || empty( $block_width['default'] ) ) {
		if ( empty( $content_width ) ) {
			$default_width = 1024; // Fall back to the "large" image file width.
		} else {
			$default_width = $content_width;
		}

		$width = array(
			'default' => $default_width,
			'wide' => $default_width,
			'full' => $default_width,
		);
	} else {
		$width = $block_width;

		if ( empty( $width['wide'] ) ) {
			$width['wide'] = $width['default'];
		}

		if ( empty( $width['full'] ) ) {
			$width['full'] = $width['default'];
		}
	}

	return $width;
}

/**
 * Attempt to find the image file meta by dirname/filename.ext from the img src.
 *
 *
 */
function _gutenberg_find_image_size_by_src( $image_meta, $image_src ) {

	$found = apply_filters( 'gutenberg_find_image_size_by_src', null, $image_meta, $image_src );

	if ( $found !== null ) {
		return $found;
	}

	if ( strpos( $image_src, $image_meta['file'] ) !== false ) {
		return array(
			'width' => $image_meta['width'],
			'height' => $image_meta['height'],
		);
	}

	// Retrieve the uploads sub-directory from the full size image.
	$dirname = _wp_get_attachment_relative_path( $image_meta['file'] );

	if ( $dirname ) {
		$dirname = trailingslashit( $dirname );
	}

	// Attempt to find the image file in $image_meta['sizes']'.
	foreach ( $image_meta['sizes'] as $size_data ) {
		if ( strpos( $image_src, $dirname . $size_data['file'] ) !== false ) {
			return array(
				'width' => $size_data['width'],
				'height' => $size_data['height'],
			);
		}
	}

	return false;
}

/**
 * Calculates the image width and height based on $block_witdh and the `scale` block attribute.
 *
 * @since 4.0.0
 *
 * @param array $block_attributes The block attributes.
 * @param array $image_meta The image attachment meta data.
 * @return array|bool An array of the image width and height, in that order, or false if the actual size was not found.
 */
function gutenberg_get_image_width_height( $block_attributes, $image_meta ) {
	$block_witdh = gutenberg_get_block_width();

	if ( empty( $block_attributes['fileWidth'] ) || empty( $block_attributes['fileHeight'] ) ) {
		// Attempt to find the actual image width/height from $image_meta.
		$actual_size = _gutenberg_find_image_size_by_src( $image_meta, $block_attributes['url'] );

		if ( ! $actual_size ) {
			return false;
		}

		$image_file_width = (int) $actual_size['width'];
		$image_file_height = (int) $actual_size['height'];
	} else {
		$image_file_width = (int) $block_attributes['fileWidth'];
		$image_file_height = (int) $block_attributes['fileHeight'];
	}

	if ( $image_file_width < $image_meta['width'] &&
		! empty( $image_meta['sizes']['large'] ) &&
		$image_file_width === (int) $image_meta['sizes']['large']['width'] &&
		wp_image_matches_ratio( $image_file_width, $image_file_height, $image_meta['width'], $image_meta['height'] )
	) {
		// Do not constrain images with `wide` and `full` allignment to the "large" image size.
		// Sometimes need to use a larger image there...
		// TODO: To fix, add `xlarge` image size generated by default!
		$full_file_width = (int) $image_meta['width'];
	} else {
		$full_file_width = $image_file_width;
	}

	// TODO: do we want to upscale an image here..?
	if ( $block_attributes['align'] === 'full' ) {
		$image_width = min( (int) $block_witdh['full'], $full_file_width );
	} elseif ( $block_attributes['align'] === 'wide' ) {
		$image_width = min( (int) $block_witdh['wide'], $full_file_width );
	} else {
		$image_width = $block_witdh['default'];

		// Scale the image if it was resized in the editor.
		// The scale value is relative to the editor/theme width.
		if ( ! empty( $block_attributes['scale'] ) && $block_attributes['scale'] < 1 ) {
			$image_width = round( $image_width * $block_attributes['scale'] );
		}

		// Check if we have large enough image to display,
		// or we need to reduce the width to match.
		$image_width = min( (int) $image_width, $image_file_width );
	}

	// Recalculate.
	$image_size = wp_constrain_dimensions( $image_file_width, $image_file_height, $image_width );

	/**
	 * Filters the calculated image size for the image block.
	 *
	 * @since 4.0.0
	 *
	 * @param array $image_size The calculated image size width and height (in that order).
	 * @param array $block_attributes The block attributes.
	 * @param array $image_meta The image attachment meta data.
	 */
	$image_size = apply_filters( 'gutenberg_get_image_width_height', $image_size, $block_attributes, $image_meta );

	return $image_size;
}

function gutenberg_render_block_core_image( $block_attributes = array(), $html = '' ) {
	// Something's wrong. Perhaps an old post?
	if ( empty( $html ) || empty( $block_attributes ) || empty( $block_attributes['url'] ) ) {
		return $html;
	}

	$attachment_id = (int) $block_attributes['id'];
	$image_src = esc_url_raw( $block_attributes['url'] );
	$image_meta = wp_get_attachment_metadata( $attachment_id );
	$srcset = '';
	$sizes = '';

	// Something's wrong. Broken or very old image meta?
	if ( empty( $image_meta['height'] ) || empty( $image_meta['width'] ) ) {
		return $html;
	}

	if ( ! empty( $block_attributes['width'] ) && ! empty( $block_attributes['height'] ) ) {
		// The user has set specific width and height. Honor them.
		$image_dimensions = array(
			$block_attributes['width'],
			$block_attributes['height'],
		);
	} else {
		$image_dimensions = gutenberg_get_image_width_height( $block_attributes, $image_meta );
	}

	$image_attributes = array(
		'src' => $image_src,
		'alt' => empty( $block_attributes['alt'] ) ? '' : esc_attr( $block_attributes['alt'] ),
	);

	if ( $image_dimensions ) {
		$image_attributes['width'] = (int) $image_dimensions[0];
		$image_attributes['height'] = (int) $image_dimensions[1];

		$srcset = wp_calculate_image_srcset( $image_dimensions, $image_src, $image_meta, $attachment_id );

		if ( ! empty( $srcset ) ) {
			$sizes = wp_calculate_image_sizes( $image_dimensions, $image_src, $image_meta, $attachment_id );
		}

		if ( $srcset && $sizes ) {
			$image_attributes['srcset'] = $srcset;
			$image_attributes['sizes'] = $sizes;
		}
	}

	$attr = '';
	// Attributes are escaped above or generated.
	foreach ( $image_attributes as $name => $value ) {
		$attr .= sprintf( ' %s="%s"', $name, $value );
	}

	$image_tag = '<img' . $attr . '/ >';

	// TODO: filter?

	// Replace the img tag.
	$html = preg_replace( '/<img [^>]+>/', $image_tag, $html );

	return $html;
}

function register_block_core_image() {
	register_block_type(
		'core/image',
		array(
			'attributes' => array(
				'className' => array(
					'type' => 'string', // Any custom class name(s) the user has entered.
				),
				'url' => array(
					'type' => 'string', // The img src.
				),
				'alt' => array(
					'type' => 'string',
				),
				'id' => array(
					'type' => 'number',
				),
				'align' => array(
					'type' => 'string',
					'enum' => array( 'center', 'left', 'right', 'wide', 'full', '' ),
				),
				'scale' => array(
					'type' => 'number',
				),
				'width' => array(
					'type' => 'number',
				),
				'height' => array(
					'type' => 'number',
				),
				'fileWidth' => array(
					'type' => 'number',
				),
				'fileHeight' => array(
					'type' => 'number',
				),

				/* These are not stored in the block attributes, but can be enabled.
				'srcSet' => array(
					'type' => 'string',
				),
				'sizes' => array(
					'type' => 'string',
				),
				*/
			),
			'render_callback' => 'gutenberg_render_block_core_image',
		)
	);
}

add_action( 'init', 'register_block_core_image' );
