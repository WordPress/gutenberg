<?php
/**
 * Server-side rendering of the `core/media-text` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/media-text` block on server.
 *
 * @since 6.6.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block rendered content.
 * @param WP_Block $block      Optional. The block instance. Default null.
 *
 * @return string Returns the Media & Text block markup, if useFeaturedImage is true.
 */
function render_block_core_media_text( $attributes, $content, $block = null ) {
	if ( false === $attributes['useFeaturedImage'] ) {
		return block_core_media_text_render_lightbox( $attributes, $content, $block );
	}

	if ( in_the_loop() ) {
		update_post_thumbnail_cache();
	}

	$current_featured_image = get_the_post_thumbnail_url();
	if ( ! $current_featured_image ) {
		return $content;
	}

	$has_media_on_right = 'right' === ( $attributes['mediaPosition'] ?? null );
	$image_fill         = (bool) ( $attributes['imageFill'] ?? false );
	$focal_point_attr   = $attributes['focalPoint'] ?? null;
	$focal_point_x      = null;
	$focal_point_y      = null;
	if ( is_array( $focal_point_attr ) ) {
		$focal_point_x = isset( $focal_point_attr['x'] ) && is_numeric( $focal_point_attr['x'] ) ? $focal_point_attr['x'] : null;
		$focal_point_y = isset( $focal_point_attr['y'] ) && is_numeric( $focal_point_attr['y'] ) ? $focal_point_attr['y'] : null;
	}
	$focal_point = null !== $focal_point_x && null !== $focal_point_y
		? round( $focal_point_x * 100 ) . '% ' . round( $focal_point_y * 100 ) . '%'
		: '50% 50%';
	$unique_id   = 'wp-block-media-text__media-' . wp_unique_id();

	$block_tag_processor = new WP_HTML_Tag_Processor( $content );
	$block_query         = array(
		'tag_name'   => 'div',
		'class_name' => 'wp-block-media-text',
	);

	while ( $block_tag_processor->next_tag( $block_query ) ) {
		if ( $image_fill ) {
			// The markup below does not work with the deprecated `is-image-fill` class.
			$block_tag_processor->remove_class( 'is-image-fill' );
			$block_tag_processor->add_class( 'is-image-fill-element' );
		}
	}

	$content = $block_tag_processor->get_updated_html();

	$media_tag_processor   = new WP_HTML_Tag_Processor( $content );
	$wrapping_figure_query = array(
		'tag_name'   => 'figure',
		'class_name' => 'wp-block-media-text__media',
	);

	if ( $has_media_on_right ) {
		// Loop through all the figure tags and set a bookmark on the last figure tag.
		while ( $media_tag_processor->next_tag( $wrapping_figure_query ) ) {
			$media_tag_processor->set_bookmark( 'last_figure' );
		}
		if ( $media_tag_processor->has_bookmark( 'last_figure' ) ) {
			$media_tag_processor->seek( 'last_figure' );
			// Insert a unique ID to identify the figure tag.
			$media_tag_processor->set_attribute( 'id', $unique_id );
		}
	} else {
		if ( $media_tag_processor->next_tag( $wrapping_figure_query ) ) {
			// Insert a unique ID to identify the figure tag.
			$media_tag_processor->set_attribute( 'id', $unique_id );
		}
	}

	$content = $media_tag_processor->get_updated_html();

	// Add the image tag inside the figure tag, and update the image attributes
	// in order to display the featured image.
	$media_size_slug = $attributes['mediaSizeSlug'] ?? 'full';
	$image_tag       = '<img class="wp-block-media-text__featured_image">';
	$content         = preg_replace(
		'/(<figure\s+id="' . preg_quote( $unique_id, '/' ) . '"\s+class="wp-block-media-text__media"\s*>)/',
		'$1' . $image_tag,
		$content
	);

	$image_tag_processor = new WP_HTML_Tag_Processor( $content );
	if ( $image_tag_processor->next_tag(
		array(
			'tag_name' => 'figure',
			'id'       => $unique_id,
		)
	) ) {
		// The ID is only used to ensure that the correct figure tag is selected,
		// and can now be removed.
		$image_tag_processor->remove_attribute( 'id' );
		if ( $image_tag_processor->next_tag(
			array(
				'tag_name'   => 'img',
				'class_name' => 'wp-block-media-text__featured_image',
			)
		) ) {
			$image_tag_processor->set_attribute( 'src', esc_url( $current_featured_image ) );
			$image_tag_processor->set_attribute( 'class', 'wp-image-' . get_post_thumbnail_id() . ' size-' . $media_size_slug );
			$image_tag_processor->set_attribute( 'alt', trim( strip_tags( get_post_meta( get_post_thumbnail_id(), '_wp_attachment_image_alt', true ) ) ) );
			if ( $image_fill ) {
				$image_tag_processor->set_attribute( 'style', 'object-position:' . $focal_point . ';' );
			}

			$content = $image_tag_processor->get_updated_html();
		}
	}

	return $content;
}

/**
 * Adds the Image block's lightbox to the Media & Text image.
 *
 * @since 7.2.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block rendered content.
 * @param WP_Block $block      Optional. The block instance. Default null.
 *
 * @return string The block markup, with the lightbox added to the image when enabled.
 */
function block_core_media_text_render_lightbox( $attributes, $content, $block = null ) {
	if (
		! $block instanceof WP_Block ||
		'image' !== ( $attributes['mediaType'] ?? null ) ||
		'none' !== ( $attributes['linkDestination'] ?? 'none' ) ||
		true !== ( $attributes['lightbox']['enabled'] ?? null )
	) {
		return $content;
	}

	// Pass only the media figure, which is the last one when the media is on the right.
	if ( ! preg_match_all( '/<figure class="wp-block-media-text__media">.*?<\/figure>/s', $content, $figures, PREG_OFFSET_CAPTURE ) ) {
		return $content;
	}
	$has_media_on_right      = 'right' === ( $attributes['mediaPosition'] ?? null );
	list( $figure, $offset ) = $has_media_on_right ? end( $figures[0] ) : $figures[0][0];

	// Enlarges the full size attachment.
	$lightbox_block = array( 'attrs' => array( 'id' => $attributes['mediaId'] ?? null ) );

	// No Image block may have loaded these.
	wp_enqueue_script_module( '@wordpress/block-library/image/view' );
	wp_enqueue_style( 'wp-block-image' );

	$lightbox_figure = block_core_image_render_lightbox( $figure, $lightbox_block, $block );

	return substr_replace( $content, $lightbox_figure, $offset, strlen( $figure ) );
}

/**
 * Registers the `core/media-text` block renderer on server.
 *
 * @since 6.6.0
 */
function register_block_core_media_text() {
	register_block_type_from_metadata(
		__DIR__ . '/media-text',
		array(
			'render_callback' => 'render_block_core_media_text',
		)
	);
}
add_action( 'init', 'register_block_core_media_text' );
