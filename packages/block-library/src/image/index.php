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

	$attrs = array();

	/*
	 * Filter out styles on the wrapper to add back with wrapper_attributes.
	 */
	$preg_style_pattern = '/style="([^"]*)"/';
	preg_match(
		'/^<figure[^>]+?' . substr( $preg_style_pattern, 1, -1 ) . '[^>]*>/',
		$content,
		$style_matches
	);
	if ( isset( $style_matches[1] ) ) {
		$attrs['style'] = $style_matches[1];
		$content = preg_replace(
			$preg_style_pattern,
			'',
			$content,
			1
		);
	}

	$preg_class_pattern = '/class="([^"]*)"/';
	preg_match(
		/*
		 * The figure should always have the `wp-block-image` class which
		 * means it should always be the first match, so we don't have to
		 * do the extra checks for if the class is for the figure or not.
		 */
		$preg_class_pattern,
		$content,
		$class_matches
	);
	if ( isset( $class_matches[1] ) ) {
		/*
		 * get_block_wrapper_attributes includes the `wp-block-image` class,
		 * so it needs to be removed first to avoid duplication.
		 */
		$classes = explode( ' ', $class_matches[1] );
		$classes = array_diff( $classes, array( 'wp-block-image' ) ) ;
		$classes = implode( ' ', $classes );
		$attrs['class'] = $classes;

		$wrapper_attributes = get_block_wrapper_attributes( $attrs );

		$content = preg_replace(
			$preg_class_pattern,
			$wrapper_attributes,
			$content,
			1
		);
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
