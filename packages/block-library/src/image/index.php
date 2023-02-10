<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/image` block on the server,
 * adding a data-id attribute to the element if core/gallery has added on pre-render.
 *
 * @param  array  $attributes The block attributes.
 * @param  string $content    The block content.
 * @return string Returns the block content with the data-id attribute and aria-describedby added.
 */
function render_block_core_image( $attributes, $content ) {

	// If an image block has no alternative text but has a caption,
	// and aria-describedby is not set, add aria-describedby to the image or image link.
	if ( empty( $attributes['alt'] ) &&
		str_contains( $content, 'wp-element-caption' ) &&
		! str_contains( $content, 'aria-describedby' )
	) {
		$unique_id = wp_unique_id( 'wp-image-caption-' );
		$content   = str_replace( '<figcaption', '<figcaption id="' . $unique_id . '"', $content );
		if ( str_contains( $content, 'href' ) ) {
			$content = str_replace( '<a', '<a aria-describedby="' . $unique_id . '"', $content );
		} else {
			$content = str_replace( '<img', '<img aria-describedby="' . $unique_id . '"', $content );
		}
	}

	if ( isset( $attributes['data-id'] ) ) {
		// Add the data-id="$id" attribute to the img element
		// to provide backwards compatibility for the Gallery Block,
		// which now wraps Image Blocks within innerBlocks.
		// The data-id attribute is added in a core/gallery `render_block_data` hook.
		$data_id_attribute = 'data-id="' . esc_attr( $attributes['data-id'] ) . '"';
		if ( ! str_contains( $content, $data_id_attribute ) ) {
			$content = str_replace( '<img', '<img ' . $data_id_attribute . ' ', $content );
		}
	}
	return $content;
}


/**
 * Registers the `core/image` block on server.
 */
function register_block_core_image() {
	register_block_type_from_metadata(
		__DIR__ . '/image',
		array(
			'render_callback' => 'render_block_core_image',
		)
	);
}
add_action( 'init', 'register_block_core_image' );
