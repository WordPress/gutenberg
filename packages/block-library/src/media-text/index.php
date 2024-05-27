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
		return $content;
	}

	if ( in_the_loop() ) {
		update_post_thumbnail_cache();
	}

	$current_featured_image = get_the_post_thumbnail_url();
	if ( ! $current_featured_image ) {
		return $content;
	}

	$has_media_on_right = isset( $attributes['mediaPosition'] ) && 'right' === $attributes['mediaPosition'];
	$image_tag = '<figure class="wp-block-media-text__media"><img class="wp-block-media-text__featured_image">';

	// When the media is on the right, the img tag is inserted inside the last figure tag.
	if ( $has_media_on_right ) {
		// Check if there is a media figure tag in the content: There should be at least one figure tag unless something broke the block.
		if ( preg_match( '/<figure\s+class="wp-block-media-text__media">/', $content ) ) {
			// Find the last figure tag and replace it with the combined figure and img tag.
			$last_figure = strripos( $content, '<figure class="wp-block-media-text__media">' );
			if ( $last_figure !== false ) {
				$content = substr_replace( $content, $image_tag, $last_figure, strlen('<figure class="wp-block-media-text__media">') );
			}
		}
	} else {
		// When the media is on the left, the img tag is inserted inside the first figure tag.
		$content = preg_replace( '/<figure\s+class="wp-block-media-text__media">/', $image_tag, $content );
	}

	$processor = new WP_HTML_Tag_Processor( $content );
	if ( isset( $attributes['imageFill'] ) && $attributes['imageFill'] ) {
		$position = '50% 50%';
		if ( isset( $attributes['focalPoint'] ) ) {
			$position = round( $attributes['focalPoint']['x'] * 100 ) . '% ' . round( $attributes['focalPoint']['y'] * 100 ) . '%';
		}
		$processor->next_tag( 'figure' );
		$processor->set_attribute( 'style', 'background-image:url(' . esc_url( $current_featured_image ) . ');background-position:' . $position . ';' );
	}
	// Locate the img tag with the class wp-block-media-text__featured_image and update its attributes.
	$processor->next_tag( array( 'class_name' => 'wp-block-media-text__featured_image' ) );
	$media_size_slug = 'full';
	if ( isset( $attributes['mediaSizeSlug'] ) ) {
		$media_size_slug = $attributes['mediaSizeSlug'];
	}
	$processor->set_attribute( 'src', esc_url( $current_featured_image ) );
	$processor->set_attribute( 'class', 'wp-image-' . get_post_thumbnail_id() . ' size-' . $media_size_slug );
	$processor->set_attribute( 'alt', trim( strip_tags( get_post_meta( get_post_thumbnail_id(), '_wp_attachment_image_alt', true ) ) ) );

	$content = $processor->get_updated_html();

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
