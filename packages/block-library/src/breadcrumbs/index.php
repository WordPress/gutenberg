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
	// Exclude breadcrumbs from special contexts like archives, search, 404, etc.
	// until they are explicitly supported.
	if ( is_archive() || is_search() || is_404() || is_home() || is_front_page() ) {
		return '';
	}
	if ( ! isset( $block->context['postId'] ) || ! isset( $block->context['postType'] ) ) {
		return '';
	}

	$post_id   = $block->context['postId'];
	$post_type = $block->context['postType'];

	$post = get_post( $post_id );
	if ( ! $post ) {
		return '';
	}

	$type             = $attributes['type'];
	$breadcrumb_items = array();
	if ( $attributes['showHomeLink'] ) {
		$breadcrumb_items[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( home_url() ),
			esc_html__( 'Home' )
		);
	}
	$supported_types = array( 'postWithAncestors', 'postWithTerms' );
	// If `type` is not set to a specific breadcrumb type, determine it based on the block's default heuristics.
	$breadcrumbs_type = in_array( $type, $supported_types, true ) ? $type : block_core_breadcrumbs_get_breadcrumbs_type( $post_type );
	if ( 'postWithAncestors' === $breadcrumbs_type ) {
		$breadcrumb_items = array_merge( $breadcrumb_items, block_core_breadcrumbs_get_hierarchical_post_type_breadcrumbs( $post_id ) );
	} else {
		$breadcrumb_items = array_merge( $breadcrumb_items, block_core_breadcrumbs_get_terms_breadcrumbs( $post_id, $post_type ) );
	}
	// Add current post title (not linked).
	$breadcrumb_items[] = sprintf( '<span aria-current="page">%s</span>', get_the_title( $post ) );
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'style'      => '--separator: "' . addcslashes( $attributes['separator'], '\\"' ) . '";',
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
 * Determines the breadcrumb type based on the block's default heuristics.
 *
 * @since 6.9.0
 *
 * @param string $post_type The post type name.
 *
 * @return string The breadcrumb type.
 */
function block_core_breadcrumbs_get_breadcrumbs_type( $post_type ) {
	return is_post_type_hierarchical( $post_type ) ? 'postWithAncestors' : 'postWithTerms';
}

/**
 * Generates breadcrumb items from hierarchical post type ancestors.
 *
 * @since 6.9.0
 *
 * @param int    $post_id   The post ID.
 *
 * @return array Array of breadcrumb HTML items.
 */
function block_core_breadcrumbs_get_hierarchical_post_type_breadcrumbs( $post_id ) {
	$breadcrumb_items = array();
	$ancestors        = get_post_ancestors( $post_id );
	$ancestors        = array_reverse( $ancestors );

	foreach ( $ancestors as $ancestor_id ) {
		$breadcrumb_items[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( get_permalink( $ancestor_id ) ),
			get_the_title( $ancestor_id )
		);
	}
	return $breadcrumb_items;
}


/**
 * Generates breadcrumb items from taxonomy terms.
 *
 * Finds the first publicly queryable taxonomy with terms assigned to the post
 * and generates breadcrumb links, including hierarchical term ancestors if applicable.
 *
 * @since 6.9.0
 *
 * @param int    $post_id   The post ID.
 * @param string $post_type The post type name.
 *
 * @return array Array of breadcrumb HTML items.
 */
function block_core_breadcrumbs_get_terms_breadcrumbs( $post_id, $post_type ) {
	$breadcrumb_items = array();
	// Get public taxonomies for this post type.
	$taxonomies = wp_filter_object_list(
		get_object_taxonomies( $post_type, 'objects' ),
		array(
			'publicly_queryable' => true,
			'show_in_rest'       => true,
		)
	);

	if ( empty( $taxonomies ) ) {
		return array();
	}

	// Find the first taxonomy that has terms assigned to this post.
	$taxonomy_name = null;
	$terms         = array();
	foreach ( $taxonomies as $taxonomy ) {
		$post_terms = get_the_terms( $post_id, $taxonomy->name );
		if ( ! empty( $post_terms ) && ! is_wp_error( $post_terms ) ) {
			$taxonomy_name = $taxonomy->name;
			$terms         = $post_terms;
			break;
		}
	}

	if ( ! empty( $terms ) ) {
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
	return $breadcrumb_items;
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
