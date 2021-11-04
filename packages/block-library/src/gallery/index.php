<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package gutenberg
 */

/**
 * Handles backwards compatibility for Gallery Blocks,
 * whose images feature a `data-id` attribute.
 *
 * Now that the Gallery Block contains inner Image Blocks,
 * we add a custom `data-id` attribute before rendering the gallery
 * so that the Image Block can pick it up in its render_callback.
 *
 * @param  array $parsed_block A single parsed block object.
 *
 * @return array               The migrated block object.
 */
function render_block_core_gallery_data( $parsed_block ) {
	if ( 'core/gallery' === $parsed_block['blockName'] ) {
		foreach ( $parsed_block['innerBlocks'] as $key => $inner_block ) {
			if ( 'core/image' === $inner_block['blockName'] ) {
				if ( ! $parsed_block['innerBlocks'][ $key ]['attrs']['data-id'] ) {
					$parsed_block['innerBlocks'][ $key ]['attrs']['data-id'] = esc_attr( $inner_block['attrs']['id'] );
				}
			}
		}
	}

	return $parsed_block;
}

add_filter( 'render_block_data', 'render_block_core_gallery_data' );

/**
 * Registers the `core/gallery` block on server.
 * This render callback needs to be here
 * so that the gallery styles are loaded in block-based themes.
 */
function gutenberg_register_block_core_gallery() {
	register_block_type_from_metadata(
		__DIR__ . '/gallery',
		array(
			'render_callback' => function ( $attributes, $content ) {
				return $content;
			},
		)
	);
}

add_action( 'init', 'gutenberg_register_block_core_gallery', 20 );
