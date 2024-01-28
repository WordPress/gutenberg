<?php
/**
 * Server-side rendering of the `core/media-text` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/media-text` block on server.
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

	$processor = new WP_HTML_Tag_Processor( $content );
	if ( isset( $attributes['imageFill'] ) && $attributes['imageFill'] ) {
		$position = '50% 50%';
		if ( isset( $attributes['focalPoint'] ) ) {
			$position = round( $attributes['focalPoint']['x'] * 100 ) . '% ' . round( $attributes['focalPoint']['y'] * 100 ) . '%';
		}
		$processor->next_tag( 'figure' );
		$processor->set_attribute( 'style', 'background-image:url(' . esc_url( $current_featured_image ) . ');background-position:' . $position . ';' );
	}
	$processor->next_tag( 'img' );
	$media_size_slug = 'full';
	if ( isset( $attributes['mediaSizeSlug'] ) ) {
		$media_size_slug = $attributes['mediaSizeSlug'];
	}
	$processor->set_attribute( 'src', esc_url( $current_featured_image ) );
	$processor->set_attribute( 'class', 'wp-image-' . get_post_thumbnail_id() . ' size-' . $media_size_slug );

	$content = $processor->get_updated_html();

	return $content;
}

/**
 * Registers the `core/media-text` block renderer on server.
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
