<?php
/**
 * Server-side rendering of the `core/posts-navigation` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/posts-navigation` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the next or previous post link that is adjacent to the current post.
 */
function render_block_core_posts_navigation( $attributes, $content, $block ) {
	if ( ! is_singular() ) {
		return '';
	}

	// Get the nagigation type to show the proper link. Available options are `next|previous`.
	$navigation_type = isset( $attributes['type'] ) ? $attributes['type'] : 'next';
	// Allow only `next` and `previous` in `$navigation_type`.
	if ( ! in_array( $navigation_type, array( 'next', 'previous' ), true ) ) {
		return '';
	}
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => "posts-navigation-$navigation_type" ) );
	// Set default values.
	$format = '%link';
	$link   = 'next' === $navigation_type ? _x( 'Next', 'label for next post link', 'gutenberg' ) : _x( 'Previous', 'label for previous post link', 'gutenberg' );
	$label  = '';
	// If a custom label is provided, make this a link.
	// `$label` is used to prepend the provided label, if we want to show the page title as well.
	if ( isset( $attributes['label'] ) && ! empty( $attributes['label'] ) ) {
		$label = "{$attributes['label']}";
		$link  = $label;
	}

	// If we want to also show the page title, make the page title a link and prepend the label.
	if ( isset( $attributes['showTitle'] ) && $attributes['showTitle'] ) {
		if ( $label ) {
			$format = "$label %link";
		}
		$link = '%title';
	}

	// Add the wrapper attributes through `next_post_link` or `previous_post_link` hook.
	$filter_link_attributes = function( $link ) use ( $wrapper_attributes ) {
		return str_replace( 'href=', "$wrapper_attributes href=", $link );
	};
	// The dynamic portion of the hook name and the function name, `$navigation_type`,
	// refers to the type of adjacency, 'next' or 'previous'.
	$get_link_function = "get_{$navigation_type}_post_link";
	add_filter( "{$navigation_type}_post_link", $filter_link_attributes );
	$content = $get_link_function( $format, $link );
	remove_filter( "{$navigation_type}_post_link", $filter_link_attributes );
	return $content;
}

/**
 * Registers the `core/posts-navigation` block on the server.
 */
function register_block_core_posts_navigation() {
	register_block_type_from_metadata(
		__DIR__ . '/posts-navigation',
		array(
			'render_callback' => 'render_block_core_posts_navigation',
		)
	);
}
add_action( 'init', 'register_block_core_posts_navigation' );
