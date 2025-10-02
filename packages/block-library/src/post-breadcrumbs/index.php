<?php
/**
 * Server-side rendering of the `core/post-breadcrumbs` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-breadcrumbs` block on the server.
 *
 * @since 6.9.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the breadcrumbs trail.
 */
function render_block_core_post_breadcrumbs( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) || ! isset( $block->context['postType'] ) ) {
		return '';
	}

	$post_id   = $block->context['postId'];
	$post_type = $block->context['postType'];

	$post = get_post( $post_id );
	if ( ! $post ) {
		return '';
	}

	$type           = isset( $attributes['type'] ) ? $attributes['type'] : 'hierarchical';
	$separator      = isset( $attributes['separator'] ) ? $attributes['separator'] : '/';
	$show_home_link = isset( $attributes['showHomeLink'] ) ? $attributes['showHomeLink'] : true;

	$breadcrumb_items = array();

	if ( $show_home_link ) {
		$breadcrumb_items[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( home_url() ),
			esc_html( __( 'Home' ) )
		);
	}

	if ( 'terms' === $type ) {
		// Get public taxonomies for this post type.
		$taxonomies = wp_filter_object_list(
			get_object_taxonomies( $post_type, 'objects' ),
			array(
				'publicly_queryable' => true,
				'show_in_rest'       => true,
			)
		);

		if ( empty( $taxonomies ) ) {
			return '';
		}

		// In case of multiple taxonomies, use the first one.
		$taxonomy      = reset( $taxonomies );
		$taxonomy_name = $taxonomy->name;
		$terms         = get_the_terms( $post_id, $taxonomy_name );

		if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
			// Use the first term (if multiple are assigned).
			$term = reset( $terms );
			// Check if taxonomy is hierarchical also add ancestor term links
			if ( is_taxonomy_hierarchical( $taxonomy_name ) ) {
				$term_ancestors = get_ancestors( $term->term_id, $taxonomy_name, 'taxonomy' );
				$term_ancestors = array_reverse( $term_ancestors );
				foreach ( $term_ancestors as $ancestor_id ) {
					$ancestor_term = get_term( $ancestor_id, $taxonomy_name );
					if ( $ancestor_term && ! is_wp_error( $ancestor_term ) ) {
						$breadcrumb_items[] = sprintf(
							'<a href="%s">%s</a>',
							esc_url( get_term_link( $ancestor_term ) ),
							esc_html( $ancestor_term->name )
						);
					}
				}
			}
			$breadcrumb_items[] = sprintf(
				'<a href="%s">%s</a>',
				esc_url( get_term_link( $term ) ),
				esc_html( $term->name )
			);
		}
	} else {
		// Hierarchical type - use post hierarchy.
		// Only render for hierarchical post types.
		if ( ! is_post_type_hierarchical( $post_type ) ) {
			return '';
		}
		$ancestors = get_post_ancestors( $post_id );
		$ancestors = array_reverse( $ancestors );

		foreach ( $ancestors as $ancestor_id ) {
			$breadcrumb_items[] = sprintf(
				'<a href="%s">%s</a>',
				esc_url( get_permalink( $ancestor_id ) ),
				esc_html( get_the_title( $ancestor_id ) )
			);
		}
	}

	$breadcrumb_items[] = sprintf( '<span>%s</span>', esc_html( get_the_title( $post ) ) );
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'style'      => '--separator: "' . esc_attr( $separator ) . '";',
			'aria-label' => __( 'Breadcrumbs' ),
		)
	);

	$breadcrumb_html = sprintf(
		'<nav %s><ol>%s</ol></nav>',
		$wrapper_attributes,
		implode(
			'',
			array_map(
				function ( $item ) {
					return '<li>' . $item . '</li>';
				},
				$breadcrumb_items
			)
		)
	);

	return $breadcrumb_html;
}

/**
 * Registers the `core/post-breadcrumbs` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_post_breadcrumbs() {
	register_block_type_from_metadata(
		__DIR__ . '/post-breadcrumbs',
		array(
			'render_callback' => 'render_block_core_post_breadcrumbs',
		)
	);
}
add_action( 'init', 'register_block_core_post_breadcrumbs' );
