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
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the Media & Text block markup, if useFeaturedImage is true.
 */
function render_block_core_media_text( $attributes, $content ) {
	if ( false === $attributes['useFeaturedImage'] ) {
		$media_bindings = $attributes['metadata']['bindings'] ?? array();
		if ( empty( $media_bindings['mediaUrl'] ) ) {
			return $content;
		}

		/*
		 * The `mediaUrl` and `mediaAlt` attributes are bound to a block bindings
		 * source. `WP_Block::replace_html()` cannot match the block's descendant
		 * selectors (e.g. `figure img`), so update the media element markup here
		 * with the resolved values.
		 */
		$media_url = $attributes['mediaUrl'] ?? null;
		if ( '' === $media_url ) {
			return $content;
		}

		$media_type         = $attributes['mediaType'] ?? 'image';
		$is_video           = 'video' === $media_type;
		$media_alt          = $attributes['mediaAlt'] ?? '';
		$has_media_on_right = 'right' === ( $attributes['mediaPosition'] ?? null );
		$figure_query       = array(
			'tag_name'   => 'figure',
			'class_name' => 'wp-block-media-text__media',
		);

		/*
		 * Locate this block's media figure, accounting for `media-position: right`
		 * where the media column follows the content column. Returns a processor
		 * positioned on the figure, or null if no media figure is found.
		 */
		$find_media_figure = static function ( $block_content ) use ( $has_media_on_right, $figure_query ) {
			$processor = new WP_HTML_Tag_Processor( $block_content );
			$found     = false;
			while ( $processor->next_tag( $figure_query ) ) {
				$found = true;
				$processor->set_bookmark( 'media_figure' );
				if ( ! $has_media_on_right ) {
					break;
				}
			}
			if ( ! $found || ! $processor->seek( 'media_figure' ) ) {
				return null;
			}
			return $processor;
		};

		$media_processor = $find_media_figure( $content );
		if ( null === $media_processor ) {
			return $content;
		}

		if ( $media_processor->next_tag( array( 'tag_name' => $is_video ? 'video' : 'img' ) ) ) {
			// Update an existing media element in the saved markup.
			$media_processor->set_attribute( 'src', $media_url );
			if ( ! $is_video && isset( $media_bindings['mediaAlt'] ) ) {
				$media_processor->set_attribute( 'alt', $media_alt );
			}

			return $media_processor->get_updated_html();
		}

		// The media figure is empty (e.g. the pattern was saved without an image),
		// so build the media element from the bound attributes and insert it.
		$media_processor->seek( 'media_figure' );
		$unique_id = 'wp-block-media-text__media-' . wp_unique_id();
		$media_processor->set_attribute( 'id', $unique_id );

		$media_tag = $is_video
			? '<video controls src="' . esc_url( $media_url ) . '"></video>'
			: '<img src="' . esc_url( $media_url ) . '"' . ( isset( $media_bindings['mediaAlt'] ) ? ' alt="' . esc_attr( $media_alt ) . '"' : '' ) . ' />';

		$content = $media_processor->get_updated_html();
		// Insert the media element right after the figure opening tag, then remove
		// the temporary id used to target it.
		$content = preg_replace(
			'/(<figure\s+id="' . preg_quote( $unique_id, '/' ) . '"\s+class="wp-block-media-text__media"\s*>)/',
			'$1' . $media_tag,
			$content
		);

		$cleanup_processor = new WP_HTML_Tag_Processor( $content );
		if ( $cleanup_processor->next_tag(
			array(
				'tag_name' => 'figure',
				'id'       => $unique_id,
			)
		) ) {
			$cleanup_processor->remove_attribute( 'id' );
		}

		return $cleanup_processor->get_updated_html();
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
