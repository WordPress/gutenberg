<?php
/**
 * Shared helper functions for Navigation Link and Navigation Submenu blocks.
 *
 * @package WordPress
 */

/**
 * Checks if a navigation item should render based on post status.
 *
 * @since 7.0.0
 *
 * @param array    $attributes The block attributes.
 * @param WP_Block $block      The parsed block.
 * @return bool True if the item should render, false otherwise.
 */
function block_core_shared_navigation_item_should_render( $attributes, $block ) {
	$navigation_link_has_id = isset( $attributes['id'] ) && is_numeric( $attributes['id'] );
	$is_post_type           = isset( $attributes['kind'] ) && 'post-type' === $attributes['kind'];
	$is_post_type           = $is_post_type || isset( $attributes['type'] ) && ( 'post' === $attributes['type'] || 'page' === $attributes['type'] );

	// Don't render the block's subtree if it is a draft or if the ID does not exist.
	if ( $is_post_type && $navigation_link_has_id ) {
		$post = get_post( $attributes['id'] );
		/**
		 * Filter allowed post_status for navigation link block to render.
		 *
		 * @since 6.8.0
		 *
		 * @param array    $post_status Array of allowed post statuses.
		 * @param array    $attributes  Block attributes.
		 * @param WP_Block $block       The parsed block.
		 */
		$allowed_post_status = (array) apply_filters(
			'render_block_core_navigation_link_allowed_post_status',
			array( 'publish' ),
			$attributes,
			$block
		);
		if ( ! $post || ! in_array( $post->post_status, $allowed_post_status, true ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the navigation markup in the front-end.
 *
 * @since 5.9.0
 *
 * @param  array $context Navigation block context.
 * @return array Font size CSS classes and inline styles.
 */
function block_core_shared_navigation_build_css_font_sizes( $context ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $context );
	$has_custom_font_size = isset( $context['style']['typography']['fontSize'] );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $context['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf(
			'font-size: %s;',
			wp_get_typography_font_size_value(
				array(
					'size' => $context['style']['typography']['fontSize'],
				)
			)
		);
	}

	return $font_sizes;
}
