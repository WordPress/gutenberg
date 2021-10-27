<?php
/**
 * Server-side rendering of the `core/image` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/image` block on the server.
 *
 * @param  array $attributes The block attributes.
 * @param  array $content    The block content.
 * @return string            Returns the block content with the data-id attribute added.
 */
function render_block_core_image( $attributes, $content ) {
	if ( isset( $attributes['id'] ) ) {
		// Add the data-id="$id" attribute to the img element
		// to provide backwards compatibility for the Gallery Block,
		// which now wraps Image Blocks within innerBlocks.
		$data_id_attribute = 'data-id="' . esc_attr( $attributes['id'] ) . '"';
		if ( ! strpos( $content, $data_id_attribute ) ) {
			$content = str_replace( '<img', '<img ' . $data_id_attribute . ' ', $content );
		}
	}
	return $content;
}


/**
 * Register image block.
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
