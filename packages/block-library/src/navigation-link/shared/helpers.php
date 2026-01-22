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
 * Returns the submenu SVG chevron icon.
 *
 * @since 5.9.0
 *
 * @return string
 */
function block_core_shared_navigation_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';
}
