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
	// Exclude breadcrumbs from special contexts like search, 404, etc.
	// until they are explicitly supported.
	if ( is_search() || is_404() || is_home() || is_front_page() ) {
		return '';
	}

	$breadcrumb_items = array();

	if ( $attributes['showHomeLink'] ) {
		$breadcrumb_items[] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( home_url() ),
			esc_html__( 'Home' )
		);
	}

	// Handle archive pages (taxonomy, post type, date, author archives).
	if ( is_archive() ) {
		$archive_breadcrumbs = block_core_breadcrumbs_get_archive_breadcrumbs();
		if ( ! empty( $archive_breadcrumbs ) ) {
			$breadcrumb_items = array_merge( $breadcrumb_items, $archive_breadcrumbs );
		}
	} else {
		// Handle single post/page breadcrumbs.
		if ( ! isset( $block->context['postId'] ) || ! isset( $block->context['postType'] ) ) {
			return '';
		}

		$post_id   = $block->context['postId'];
		$post_type = $block->context['postType'];

		$post = get_post( $post_id );
		if ( ! $post ) {
			return '';
		}

		// Determine breadcrumb type for accurate rendering (matching JavaScript logic).
		$show_terms = false;
		if ( ! is_post_type_hierarchical( $post_type ) ) {
			$show_terms = true;
		} elseif ( empty( get_object_taxonomies( $post_type, 'objects' ) ) ) {
			// Hierarchical post type without taxonomies can only use ancestors.
			$show_terms = false;
		} else {
			// For hierarchical post types with taxonomies, use the attribute.
			$show_terms = $attributes['prefersTaxonomy'];
		}

		if ( ! $show_terms ) {
			$breadcrumb_items = array_merge( $breadcrumb_items, block_core_breadcrumbs_get_hierarchical_post_type_breadcrumbs( $post_id ) );
		} else {
			$breadcrumb_items = array_merge( $breadcrumb_items, block_core_breadcrumbs_get_terms_breadcrumbs( $post_id, $post_type ) );
		}
		// Add current post title (not linked).
		$breadcrumb_items[] = sprintf( '<span aria-current="page">%s</span>', get_the_title( $post ) );
	}

	if ( empty( $breadcrumb_items ) ) {
		return '';
	}

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
 * Generates breadcrumb items for hierarchical term ancestors.
 *
 * For hierarchical taxonomies, retrieves and formats ancestor terms as breadcrumb links.
 *
 * @since 6.9.0
 *
 * @param int    $term_id  The term ID.
 * @param string $taxonomy The taxonomy name.
 *
 * @return array Array of breadcrumb HTML items for ancestors.
 */
function block_core_breadcrumbs_get_term_ancestors_items( $term_id, $taxonomy ) {
	$breadcrumb_items = array();

	// Check if taxonomy is hierarchical and add ancestor term links.
	if ( is_taxonomy_hierarchical( $taxonomy ) ) {
		$term_ancestors = get_ancestors( $term_id, $taxonomy, 'taxonomy' );
		$term_ancestors = array_reverse( $term_ancestors );
		foreach ( $term_ancestors as $ancestor_id ) {
			$ancestor_term = get_term( $ancestor_id, $taxonomy );
			if ( $ancestor_term && ! is_wp_error( $ancestor_term ) ) {
				$breadcrumb_items[] = sprintf(
					'<a href="%s">%s</a>',
					esc_url( get_term_link( $ancestor_term ) ),
					esc_html( $ancestor_term->name )
				);
			}
		}
	}

	return $breadcrumb_items;
}

/**
 * Generates breadcrumb items for archive pages.
 *
 * Handles taxonomy archives, post type archives, date archives, and author archives.
 * For hierarchical taxonomies, includes ancestor terms in the breadcrumb trail.
 *
 * @since 6.9.0
 *
 * @return array Array of breadcrumb HTML items.
 */
function block_core_breadcrumbs_get_archive_breadcrumbs() {
	$breadcrumb_items = array();

	// Date archive (check first since it doesn't have a queried object).
	if ( is_date() ) {
		$year  = get_query_var( 'year' );
		$month = get_query_var( 'monthnum' );
		$day   = get_query_var( 'day' );

		// Fallback to 'm' query var for plain permalinks.
		// Plain permalinks use ?m=YYYYMMDD format instead of separate query vars.
		if ( ! $year ) {
			$m = get_query_var( 'm' );
			if ( $m ) {
				$year  = substr( $m, 0, 4 );
				$month = substr( $m, 4, 2 );
				$day   = (int) substr( $m, 6, 2 );
			}
		}

		if ( $year ) {
			if ( $month ) {
				// Year is linked if we have month.
				$breadcrumb_items[] = sprintf(
					'<a href="%s">%s</a>',
					esc_url( get_year_link( $year ) ),
					esc_html( $year )
				);

				if ( $day ) {
					// Month is linked if we have day.
					$breadcrumb_items[] = sprintf(
						'<a href="%s">%s</a>',
						esc_url( get_month_link( $year, $month ) ),
						esc_html( date_i18n( 'F', mktime( 0, 0, 0, $month, 1, $year ) ) )
					);
					// Current day.
					$breadcrumb_items[] = sprintf(
						'<span aria-current="page">%s</span>',
						esc_html( $day )
					);
				} else {
					// Current month.
					$breadcrumb_items[] = sprintf(
						'<span aria-current="page">%s</span>',
						esc_html( date_i18n( 'F', mktime( 0, 0, 0, $month, 1, $year ) ) )
					);
				}
			} else {
				// Current year only.
				$breadcrumb_items[] = sprintf(
					'<span aria-current="page">%s</span>',
					esc_html( $year )
				);
			}
		}

		return $breadcrumb_items;
	}

	// For other archive types, we need a queried object.
	$queried_object = get_queried_object();

	if ( ! $queried_object ) {
		return array();
	}

	// Taxonomy archive (category, tag, custom taxonomy).
	if ( $queried_object instanceof WP_Term ) {
		$term     = $queried_object;
		$taxonomy = $term->taxonomy;

		// Add hierarchical term ancestors if applicable.
		$breadcrumb_items = array_merge(
			$breadcrumb_items,
			block_core_breadcrumbs_get_term_ancestors_items( $term->term_id, $taxonomy )
		);

		// Add current term.
		$breadcrumb_items[] = sprintf(
			'<span aria-current="page">%s</span>',
			esc_html( $term->name )
		);
	} elseif ( is_post_type_archive() ) {
		// Post type archive.
		$post_type = get_query_var( 'post_type' );
		if ( is_array( $post_type ) ) {
			$post_type = reset( $post_type );
		}
		$post_type_object = get_post_type_object( $post_type );
		if ( $post_type_object ) {
			$breadcrumb_items[] = sprintf(
				'<span aria-current="page">%s</span>',
				esc_html( $post_type_object->labels->name )
			);
		}
	} elseif ( is_author() ) {
		// Author archive.
		$author             = $queried_object;
		$breadcrumb_items[] = sprintf(
			'<span aria-current="page">%s</span>',
			esc_html( $author->display_name )
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
		// Add hierarchical term ancestors if applicable.
		$breadcrumb_items   = array_merge(
			$breadcrumb_items,
			block_core_breadcrumbs_get_term_ancestors_items( $term->term_id, $taxonomy_name )
		);
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
