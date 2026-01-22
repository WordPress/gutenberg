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
 * Builds CSS classes and inline styles for font sizes in navigation items.
 *
 * @since 7.0.0
 *
 * @param array $context Block context containing fontSize and style settings.
 * @return array Array containing 'css_classes' and 'inline_styles' keys.
 */
function block_core_shared_navigation_build_css_font_sizes( $context ) {
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

/**
 * Returns the submenu SVG chevron icon.
 *
 * @since 7.0.0
 *
 * @return string SVG icon markup.
 */
function block_core_shared_navigation_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';
}

/**
 * Determines if a navigation item is active based on current page context.
 *
 * @since 7.0.0
 *
 * @param array $attributes Block attributes containing 'kind', 'id', and 'url'.
 * @return bool True if the navigation item is active, false otherwise.
 */
function block_core_shared_navigation_determine_active_state( $attributes ) {
	$kind      = empty( $attributes['kind'] ) ? 'post_type' : str_replace( '-', '_', $attributes['kind'] );
	$is_active = ! empty( $attributes['id'] ) && get_queried_object_id() === (int) $attributes['id'] && ! empty( get_queried_object()->$kind );

	if ( is_post_type_archive() && ! empty( $attributes['url'] ) ) {
		$queried_archive_link = get_post_type_archive_link( get_queried_object()->name );
		if ( $attributes['url'] === $queried_archive_link ) {
			$is_active = true;
		}
	}

	return $is_active;
}

/**
 * Decodes a url if it's encoded, returning the same url if not.
 *
 * @since 7.0.0
 *
 * @param string $url The url to decode.
 *
 * @return string $url Returns the decoded url.
 */
function block_core_shared_navigation_maybe_urldecode( $url ) {
	$is_url_encoded = false;
	$query          = parse_url( $url, PHP_URL_QUERY );
	$query_params   = wp_parse_args( $query );

	foreach ( $query_params as $query_param ) {
		$can_query_param_be_encoded = is_string( $query_param ) && ! empty( $query_param );
		if ( ! $can_query_param_be_encoded ) {
			continue;
		}
		if ( rawurldecode( $query_param ) !== $query_param ) {
			$is_url_encoded = true;
			break;
		}
	}

	if ( $is_url_encoded ) {
		return rawurldecode( $url );
	}

	return $url;
}
