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
 * @return string Returns the block content with the data-id attribute added.
 */
function render_block_core_image( $attributes, $content ) {

	$processor = new WP_HTML_Tag_Processor( $content );
	$processor->next_tag( 'img' );

	if ( $processor->get_attribute( 'src' ) === null ) {
		return '';
	}

	if ( isset( $attributes['data-id'] ) ) {
		// Add the data-id="$id" attribute to the img element
		// to provide backwards compatibility for the Gallery Block,
		// which now wraps Image Blocks within innerBlocks.
		// The data-id attribute is added in a core/gallery `render_block_data` hook.
		$processor->set_attribute( 'data-id', $attributes['data-id'] );
	}

	return $processor->get_updated_html();
}

/**
 * Prevent adding width and height attributes if they are already set in the styles.
 *
 * @param bool   $value   The filtered value, defaults to `true`.
 * @param string $image   The HTML `img` tag where the attribute should be added.
 * @param string $context Additional context about how the function was called or where the img tag is.
 * @return bool Whether the width and height attributes should be set.
 */
function filter_width_height_core_image( $value, $image, $context ) {
	$processor = new WP_HTML_Tag_Processor( $image );
	$processor->next_tag( 'img' );

	$style = $processor->get_attribute( 'style' );
	echo '<pre>';
	var_dump( $image, $context  );
	echo '</pre>';

	if ( $style === null ) {
		return $value;
	}

	$match = preg_match( '/\b(width|height|aspect-ratio)\s*:\s*[^;]+/', $style, $matches );
	echo '<pre>';
	var_dump( $style, $match, $matches );
	echo '</pre>';

	return ! $match;
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
add_filter( 'wp_img_tag_add_width_and_height_attr', 'filter_width_height_core_image', 10, 3 );