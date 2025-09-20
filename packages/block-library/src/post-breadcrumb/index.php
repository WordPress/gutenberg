<?php
/**
 * Server-side rendering of the `core/post-breadcrumb` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-breadcrumb` block on the server.
 *
 * @since 6.8.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the post breadcrumb for hierarchical post types.
 */
function render_block_core_post_breadcrumb( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) || ! isset( $block->context['postType'] ) ) {
		return '';
	}

	$post_id   = $block->context['postId'];
	$post_type = $block->context['postType'];

	// Only render for hierarchical post types.
	if ( ! is_post_type_hierarchical( $post_type ) ) {
		return '';
	}

	$post = get_post( $post_id );
	if ( ! $post ) {
		return '';
	}

	// Get the separator from attributes.
	$separator = isset( $attributes['separator'] ) ? $attributes['separator'] : '/';

	// Build breadcrumb items.
	$breadcrumb_items = array();

	// Add home link.
	$home_url   = home_url();
	$home_title = __( 'Home' );
	$breadcrumb_items[] = sprintf(
		'<a href="%s">%s</a>',
		esc_url( $home_url ),
		esc_html( $home_title )
	);

	// Get ancestors.
	$ancestors = get_post_ancestors( $post_id );
	$ancestors = array_reverse( $ancestors );

	// Add ancestor links.
	foreach ( $ancestors as $ancestor_id ) {
		$breadcrumb_items[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( get_permalink( $ancestor_id ) ),
			esc_html( get_the_title( $ancestor_id ) )
		);
	}

	// Add current post title (not linked).
	$breadcrumb_items[] = sprintf( '<span>%s</span>', esc_html( get_the_title( $post ) ) );

	// Build wrapper attributes.
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'style' => '--separator: "' . esc_attr( $separator ) . '";',
		)
	);

	// Generate the breadcrumb HTML.
	$breadcrumb_html = sprintf(
		'<nav %s><ol>%s</ol></nav>',
		$wrapper_attributes,
		implode( '', array_map( function( $item ) {
			return '<li>' . $item . '</li>';
		}, $breadcrumb_items ) )
	);

	return $breadcrumb_html;
}

/**
 * Registers the `core/post-breadcrumb` block on the server.
 *
 * @since 6.8.0
 */
function register_block_core_post_breadcrumb() {
	register_block_type_from_metadata(
		__DIR__ . '/post-breadcrumb',
		array(
			'render_callback' => 'render_block_core_post_breadcrumb',
		)
	);
}
add_action( 'init', 'register_block_core_post_breadcrumb' );
