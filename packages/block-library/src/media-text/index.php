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
function render_block_core_media_text( $attributes, $content, $block ) {
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

	$image_tag         = '<figure class="wp-block-media-text__media"><img>';
	$alt               = trim( strip_tags( get_post_meta( get_post_thumbnail_id(), '_wp_attachment_image_alt', true ) ) );
	$featuredImageLink = isset( $attributes['featuredImageLink'] ) && $attributes['featuredImageLink'];

	if ( $featuredImageLink ) {
		$post_ID = $block->context['postId'];
		if ( get_the_title( $post_ID ) ) {
			$alt = trim( strip_tags( get_the_title( $post_ID ) ) );
		} else {
			$alt = sprintf(
				// translators: %d is the post ID.
				__( 'Untitled post %d' ),
				$post_ID
			);
		}

		$image_tag = sprintf(
			'<figure class="wp-block-media-text__media"><a href="%1$s"><img></a>',
			get_the_permalink( $post_ID ),
		);
	}

	$content = preg_replace( '/<figure\s+class="wp-block-media-text__media">/', $image_tag, $content );

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
	$processor->set_attribute( 'alt', $alt );

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
