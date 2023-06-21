<?php
/**
 * Server-side rendering of the `core/media-text` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/media-text` block on server.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The block rendered content.
 * @param WP_Block $block    The block being rendered.
 *
 * @return string Returns the Media & Text block markup, if useFeaturedImage is true.
 */
function render_block_core_media_text( $attributes, $content, $block ) {
	if ( false === $attributes['useFeaturedImage'] ) {
		return $content;
	}

	// Get the inner blocks from the Media & Text block's content part.
	$text_content = '<div class="wp-block-media-text__content">';
	foreach ( $block->inner_blocks as $inner_block ) {
		$text_content .= $inner_block->render();
	}
	$text_content .= '</div>';

	$fill               = $attributes['imageFill'] ? $attributes['imageFill'] : false;
	$focal_point        = isset( $attributes['focalPoint'] ) ? $attributes['focalPoint'] : array(
		'x' => 0.5,
		'y' => 0.5,
	);
	$media_position     = $attributes['mediaPosition'] ? $attributes['mediaPosition'] : 'left';
	$media_width        = $attributes['mediaWidth'] ? $attributes['mediaWidth'] : 50;
	$stacked_on_mobile  = $attributes['isStackedOnMobile'] ? $attributes['isStackedOnMobile'] : false;
	$vertical_alignment = isset( $attributes['verticalAlignment'] ) ? $attributes['verticalAlignment'] : 'center';
	$media_link         = $attributes['mediaLink'] ? $attributes['mediaLink'] : '';
	$link_destination   = $attributes['linkDestination'] ? $attributes['linkDestination'] : '';
	$media_size_slug    = isset( $attributes['mediaSizeSlug'] ) ? $attributes['mediaSizeSlug'] : 'full'; // See DEFAULT_MEDIA_SIZE_SLUG in constants.js.
	$figure             = '<figure class="wp-block-media-text__media">' . get_the_post_thumbnail( null, $media_size_slug ) . '</figure>';
	$classes            = '';
	$style              = 'grid-template-columns:' . $attributes['mediaWidth'] . '% 1fr;';
	if ( 50 !== $media_width ) {
		$style = 'grid-template-columns:' . $attributes['mediaWidth'] . '% auto;';
	}
	if ( $vertical_alignment ) {
		$classes .= ' is-vertically-aligned-' . $vertical_alignment;
	}

	if ( $fill ) {
		$classes            .= ' is-image-fill';
		$background_position = round( $focal_point['x'] * 100 ) . '% ' . round( $focal_point['y'] * 100 ) . '%';
		$figure              = '<figure class="wp-block-media-text__media" style="background-image:url(' . esc_url( get_the_post_thumbnail_url() ) . ');background-position:' . $background_position . '"></figure>';
		if ( $media_link && 'media' === $link_destination ) {
			$figure = '<figure class="wp-block-media-text__media" style="background-image:url(' . esc_url( get_the_post_thumbnail_url() ) . ');background-position:' . $background_position . '"><a href="' . esc_url( get_the_post_thumbnail_url() ) . '">' . get_the_post_thumbnail( null, $media_size_slug ) . '</a></figure>';
		}
		if ( $media_link && 'attachment' === $link_destination ) {
			$figure = '<figure class="wp-block-media-text__media" style="background-image:url(' . esc_url( get_the_post_thumbnail_url() ) . ');background-position:' . $background_position . '"><a href="' . esc_url( $media_link ) . '">' . get_the_post_thumbnail( null, $media_size_slug ) . '</a></figure>';
		}
	} elseif ( $media_link && 'media' === $link_destination ) {
		$figure = '<figure class="wp-block-media-text__media"><a href="' . esc_url( get_the_post_thumbnail_url() ) . '">' . get_the_post_thumbnail( null, $media_size_slug ) . '</a></figure>';
	} elseif ( $media_link && 'attachment' === $link_destination ) {
		$figure = '<figure class="wp-block-media-text__media"><a href="' . esc_url( $media_link ) . '">' . get_the_post_thumbnail( null, $media_size_slug ) . '</a></figure>';
	}

	if ( $stacked_on_mobile ) {
		$classes .= ' is-stacked-on-mobile';
	}
	if ( 'right' === $media_position ) {
		$classes .= ' has-media-on-the-right';
		$style    = 'grid-template-columns:1fr ' . $attributes['mediaWidth'] . '%;';
		if ( 50 !== $media_width ) {
			$style = 'grid-template-columns:auto ' . $attributes['mediaWidth'] . '%;';
		}
	}
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => $classes,
			'style' => $style,
		)
	);
	$block_content      = $figure . $text_content;

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$block_content
	);
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
