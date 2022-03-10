<?php
/**
 * Server-side rendering of the `core/gallery` block.
 *
 * @package WordPress
 */

/**
 * Handles backwards compatibility for Gallery Blocks,
 * whose images feature a `data-id` attribute.
 *
 * Now that the Gallery Block contains inner Image Blocks,
 * we add a custom `data-id` attribute before rendering the gallery
 * so that the Image Block can pick it up in its render_callback.
 *
 * @param array $parsed_block The block being rendered.
 * @return array The migrated block object.
 */
function block_core_gallery_data_id_backcompatibility( $parsed_block ) {
	if ( 'core/gallery' === $parsed_block['blockName'] ) {
		foreach ( $parsed_block['innerBlocks'] as $key => $inner_block ) {
			if ( 'core/image' === $inner_block['blockName'] ) {
				if ( ! isset( $parsed_block['innerBlocks'][ $key ]['attrs']['data-id'] ) && isset( $inner_block['attrs']['id'] ) ) {
					$parsed_block['innerBlocks'][ $key ]['attrs']['data-id'] = esc_attr( $inner_block['attrs']['id'] );
				}
			}
		}
	}

	return $parsed_block;
}

add_filter( 'render_block_data', 'block_core_gallery_data_id_backcompatibility' );

function block_core_gallery_render( $attributes, $content ) {
	$gap_value = _wp_array_get( $attributes, array( 'style', 'spacing', 'blockGap' ) );
	// Skip if gap value contains unsupported characters.
	// Regex for CSS value borrowed from `safecss_filter_attr`, and used here
	// because we only want to match against the value, not the CSS attribute.
	$gap_value = preg_match( '%[\\\(&=}]|/\*%', $gap_value ) ? null : $gap_value;
	$id        = uniqid();
	$class     = 'wp-block-gallery-' . $id;
	$content   = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="' . $class . ' ',
		$content,
		1
	);
	$style     = '.' . $class . '{ --wp--style--unstable-gallery-gap: ' . $gap_value . '}';
	// Ideally styles should be loaded in the head, but blocks may be parsed
	// after that, so loading in the footer for now.
	// See https://core.trac.wordpress.org/ticket/53494.
	add_action(
		'wp_footer',
		function () use ( $style ) {
			echo '<style> ' . $style . '</style>';
		}
	);
	return $content;
}
/**
 * Registers the `core/gallery` block on server.
 */
function register_block_core_gallery() {
	register_block_type_from_metadata(
		__DIR__ . '/gallery'
	);
}

add_action( 'init', 'register_block_core_gallery' );
