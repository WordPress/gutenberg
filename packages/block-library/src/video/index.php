<?php
/**
 * Server-side rendering of the `core/video` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/video` block on the server to supply the width and height attributes from the attachment metadata.
 *
 * @since 6.9.0
 *
 * @phpstan-param  array{ "id"?: positive-int } $attributes
 *
 * @param array   $attributes The block attributes.
 * @param string  $content    The block content.
 * @return string The block content with the dimensions added.
 */
function render_block_core_video( array $attributes, string $content ): string {
	// if the content lacks any video tag, abort.
	if ( ! str_contains( $content, '<video' ) ) {
		return $content;
	}

	// If the 'id' attribute is not populated for a video attachment, abort.
	if (
		! isset( $attributes['id'] ) ||
		! is_int( $attributes['id'] ) ||
		$attributes['id'] <= 0
	) {
		return $content;
	}

	// If the 'id' attribute wasn't for an attachment, abort.
	if ( get_post_type( $attributes['id'] ) !== 'attachment' ) {
		return $content;
	}

	// Get the width and height metadata for the video, and abort if absent or invalid.
	$metadata = wp_get_attachment_metadata( $attributes['id'] );
	if (
		! isset( $metadata['width'], $metadata['height'] ) ||
		! ( is_int( $metadata['width'] ) && is_int( $metadata['height'] ) ) ||
		! ( $metadata['width'] > 0 && $metadata['height'] > 0 )
	) {
		return $content;
	}

	// Locate the VIDEO tag to add the dimensions.
	$p = new WP_HTML_Tag_Processor( $content );
	if ( ! $p->next_tag( array( 'tag_name' => 'VIDEO' ) ) ) {
		return $content;
	}

	/*
	 * For videos with 90° or 270° rotation metadata (common for portrait videos recorded by
	 * mobile devices that physically encode frames as landscape with a container-level rotation
	 * flag), the stored width and height are the pre-rotation dimensions of the video file, not
	 * the displayed dimensions. Swap them to get the correct displayed dimensions.
	 *
	 * The rotation is stored by the `gutenberg_add_video_rotation_to_metadata` filter below,
	 * which reads it from the raw getID3 data at upload time.
	 */
	$width  = $metadata['width'];
	$height = $metadata['height'];
	if ( isset( $metadata['rotate'] ) && in_array( abs( (int) $metadata['rotate'] ), array( 90, 270 ), true ) ) {
		$width  = $metadata['height'];
		$height = $metadata['width'];
	}

	$p->set_attribute( 'width', (string) $width );
	$p->set_attribute( 'height', (string) $height );

	/*
	 * The aspect-ratio style is needed due to an issue with the CSS spec: <https://github.com/w3c/csswg-drafts/issues/7524>.
	 * Note that a style rule using attr() like the following cannot currently be used:
	 *
	 *     .wp-block-video video[width][height] {
	 *         aspect-ratio: attr(width type(<number>)) / attr(height type(<number>));
	 *     }
	 *
	 * This is because this attr() is yet only implemented in Chromium: <https://caniuse.com/css3-attr>.
	 *
	 * Note: the `auto` keyword cannot be prepended here (i.e. `aspect-ratio: auto W / H`) because
	 * for `<video>` the default object size (300×150) is always treated as the natural aspect ratio
	 * before the video data loads. The `auto` keyword would therefore resolve to 300/150 instead
	 * of the W/H fallback, reintroducing the CLS that this style was added to prevent.
	 * See: <https://github.com/w3c/csswg-drafts/issues/7524>.
	 */
	$style = $p->get_attribute( 'style' );
	if ( ! is_string( $style ) ) {
		$style = '';
	}
	$aspect_ratio_style = sprintf( 'aspect-ratio: %d / %d;', $width, $height );
	$p->set_attribute( 'style', $aspect_ratio_style . $style );

	return $p->get_updated_html();
}

/**
 * Adds rotation information to video attachment metadata during upload.
 *
 * The core `wp_read_video_metadata()` function does not include the video rotation,
 * but getID3 computes it from the container metadata (e.g. the QuickTime tkhd atom's
 * transform matrix). This filter persists the rotation in the stored attachment metadata
 * so the Video block render function can correct the aspect ratio for portrait videos
 * that are physically encoded in landscape orientation with a rotation flag.
 *
 * @since 6.9.0
 *
 * @param array       $metadata    Filtered video metadata.
 * @param string      $file        Path to the video file.
 * @param string|null $file_format File format of the video, as analyzed by getID3.
 * @param array       $data        Raw metadata from getID3.
 * @return array Updated video metadata.
 */
function gutenberg_add_video_rotation_to_metadata( array $metadata, string $file, ?string $file_format, array $data ): array {
	if ( ! isset( $metadata['rotate'] ) && ! empty( $data['video']['rotate'] ) ) {
		$metadata['rotate'] = (int) $data['video']['rotate'];
	}
	return $metadata;
}
add_filter( 'wp_read_video_metadata', 'gutenberg_add_video_rotation_to_metadata', 10, 4 );

/**
 * Registers the `core/video` block on server.
 *
 * @since 6.9.0
 */
function register_block_core_video(): void {
	register_block_type_from_metadata(
		__DIR__ . '/video',
		array(
			'render_callback' => 'render_block_core_video',
		)
	);
}
add_action( 'init', 'register_block_core_video' );

