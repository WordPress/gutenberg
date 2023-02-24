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

	// Check if the image block has an alternative text.
	$find_alt_attribute = new WP_HTML_Tag_Processor( $content );
	$find_alt_attribute->next_tag( array( 'tag_name' => 'img' ) );
	$alt = $find_alt_attribute->get_attribute( 'alt' ) ? $find_alt_attribute->get_attribute( 'alt' ) : '';

	// If an image block has no alternative text but has a caption,
	// and aria-describedby is not set, add aria-describedby to the image or image link.
	if ( empty( $alt ) &&
		str_contains( $content, 'wp-element-caption' ) &&
		! str_contains( $content, 'aria-describedby' )
	) {
		$unique_id         = wp_unique_id( 'wp-image-caption-' );
		$processed_content = new WP_HTML_Tag_Processor( $content );
		if ( str_contains( $content, 'href' ) ) {
			$processed_content->next_tag( array( 'tag_name' => 'a' ) );
			$processed_content->set_attribute( 'aria-describedby', $unique_id );
		} else {
			$processed_content->next_tag( array( 'tag_name' => 'img' ) );
			$processed_content->set_attribute( 'aria-describedby', $unique_id );
		}
		$processed_content->next_tag(
			array(
				'tag_name'   => 'figcaption',
				'class_name' => 'wp-element-caption',
			)
		);
		$processed_content->set_attribute( 'id', $unique_id );
		$content = $processed_content->get_updated_html();
	}

	if ( isset( $attributes['data-id'] ) ) {
		// Add the data-id="$id" attribute to the img element
		// to provide backwards compatibility for the Gallery Block,
		// which now wraps Image Blocks within innerBlocks.
		// The data-id attribute is added in a core/gallery `render_block_data` hook.
		$processor = new WP_HTML_Tag_Processor( $content );
		$processor->next_tag( 'img' );
		$processor->set_attribute( 'data-id', $attributes['data-id'] );
		$content = $processor->get_updated_html();
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
