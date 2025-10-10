<?php
/**
 * Server-side rendering of the `core/breadcrumbs` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/breadcrumbs` block on the server.
 *
 * @since 6.9.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the post breadcrumb for hierarchical post types.
 */
function render_block_core_breadcrumbs( $attributes, $content, $block ) {
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

	$separator        = isset( $attributes['separator'] ) ? $attributes['separator'] : '/';
	$show_home_link   = isset( $attributes['showHomeLink'] ) ? $attributes['showHomeLink'] : true;
	$breadcrumb_items = array();

	if ( $show_home_link ) {
		$breadcrumb_items[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( home_url() ),
			esc_html__( 'Home' )
		);
	}

	$ancestors = get_post_ancestors( $post_id );
	$ancestors = array_reverse( $ancestors );

	foreach ( $ancestors as $ancestor_id ) {
		$breadcrumb_items[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( get_permalink( $ancestor_id ) ),
			get_the_title( $ancestor_id )
		);
	}

	// Add current post title (not linked).
	$breadcrumb_items[] = sprintf( '<span>%s</span>', get_the_title( $post ) );
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'style'      => '--separator: "' . addcslashes( $separator, '\\"' ) . '";',
			'aria-label' => __( 'Breadcrumbs' ),
		)
	);

	$breadcrumb_html = sprintf(
		'<nav %s><ol>%s</ol></nav>',
		$wrapper_attributes,
		implode(
			'',
			array_map(
				static function ( $item ) {
					return '<li>' . $item . '</li>';
				},
				$breadcrumb_items
			)
		)
	);

	return $breadcrumb_html;
}

/**
 * Registers the `core/breadcrumbs` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_breadcrumbs() {
	register_block_type_from_metadata(
		__DIR__ . '/breadcrumbs',
		array(
			'render_callback' => 'render_block_core_breadcrumbs',
		)
	);
}
add_action( 'init', 'register_block_core_breadcrumbs' );
