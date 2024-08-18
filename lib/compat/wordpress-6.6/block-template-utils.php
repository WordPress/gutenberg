<?php
/**
 * Utilities used to fetch and create templates and template parts.
 *
 * @package gutenberg
 */

/**
 * Gets the template hierarchy for the given template slug to be created.
 *
 * Note: Always add `index` as the last fallback template.
 *
 *
 * @param string $slug            The template slug to be created.
 * @param bool   $is_custom       Optional. Indicates if a template is custom or
 *                                part of the template hierarchy. Default false.
 * @param string $template_prefix Optional. The template prefix for the created template.
 *                                Used to extract the main template type, e.g.
 *                                in `taxonomy-books` the `taxonomy` is extracted.
 *                                Default empty string.
 * @return string[] The template hierarchy.
 */
function gutenberg_get_template_hierarchy( $slug, $is_custom = false, $template_prefix = '' ) {
	if ( 'index' === $slug ) {
		/** This filter is documented in wp-includes/template.php */
		return apply_filters( 'index_template_hierarchy', array( 'index' ) );
	}
	if ( $is_custom ) {
		/** This filter is documented in wp-includes/template.php */
		return apply_filters( 'page_template_hierarchy', array( 'page', 'singular', 'index' ) );
	}
	if ( 'front-page' === $slug ) {
		/** This filter is documented in wp-includes/template.php */
		return apply_filters( 'frontpage_template_hierarchy', array( 'front-page', 'home', 'index' ) );
	}

	$matches = array();

	$template_hierarchy = array( $slug );
	// Most default templates don't have `$template_prefix` assigned.
	if ( ! empty( $template_prefix ) ) {
		list( $type ) = explode( '-', $template_prefix );
		// We need these checks because we always add the `$slug` above.
		if ( ! in_array( $template_prefix, array( $slug, $type ), true ) ) {
			$template_hierarchy[] = $template_prefix;
		}
		if ( $slug !== $type ) {
			$template_hierarchy[] = $type;
		}
	} elseif ( preg_match( '/^(author|category|archive|tag|page)-.+$/', $slug, $matches ) ) {
		$template_hierarchy[] = $matches[1];
	} elseif ( preg_match( '/^(taxonomy|single)-(.+)$/', $slug, $matches ) ) {
		$type           = $matches[1];
		$slug_remaining = $matches[2];

		$items = 'single' === $type ? get_post_types() : get_taxonomies();
		foreach ( $items as $item ) {
			if ( ! str_starts_with( $slug_remaining, $item ) ) {
					continue;
			}

			// If $slug_remaining is equal to $post_type or $taxonomy we have
			// the single-$post_type template or the taxonomy-$taxonomy template.
			if ( $slug_remaining === $item ) {
				$template_hierarchy[] = $type;
				break;
			}

			// If $slug_remaining is single-$post_type-$slug template.
			if ( strlen( $slug_remaining ) > strlen( $item ) + 1 ) {
				$template_hierarchy[] = "$type-$item";
				$template_hierarchy[] = $type;
				break;
			}
		}
	}
	// Handle `archive` template.
	if (
		str_starts_with( $slug, 'author' ) ||
		str_starts_with( $slug, 'taxonomy' ) ||
		str_starts_with( $slug, 'category' ) ||
		str_starts_with( $slug, 'tag' ) ||
		'date' === $slug
	) {
		$template_hierarchy[] = 'archive';
	}
	// Handle `single` template.
	if ( 'attachment' === $slug ) {
		$template_hierarchy[] = 'single';
	}
	// Handle `singular` template.
	if (
		str_starts_with( $slug, 'single' ) ||
		str_starts_with( $slug, 'page' ) ||
		'attachment' === $slug
	) {
		$template_hierarchy[] = 'singular';
	}
	$template_hierarchy[] = 'index';

	$template_type = '';
	if ( ! empty( $template_prefix ) ) {
		list( $template_type ) = explode( '-', $template_prefix );
	} else {
		list( $template_type ) = explode( '-', $slug );
	}
	$valid_template_types = array( '404', 'archive', 'attachment', 'author', 'category', 'date', 'embed', 'frontpage', 'home', 'index', 'page', 'paged', 'privacypolicy', 'search', 'single', 'singular', 'tag', 'taxonomy' );
	if ( in_array( $template_type, $valid_template_types, true ) ) {
		/** This filter is documented in wp-includes/template.php */
		return apply_filters( "{$template_type}_template_hierarchy", $template_hierarchy );
	}
	return $template_hierarchy;
}

/**
 * Retrieves the template files from the theme.
 *
 * @since 5.9.0
 * @since 6.3.0 Added the `$query` parameter.
 * @access private
 *
 * @param string $template_type Template type. Either 'wp_template' or 'wp_template_part'.
 * @param array  $query {
 *     Arguments to retrieve templates. Optional, empty by default.
 *
 *     @type string[] $slug__in     List of slugs to include.
 *     @type string[] $slug__not_in List of slugs to skip.
 *     @type string   $area         A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
 *     @type string   $post_type    Post type to get the templates for.
 * }
 *
 * @return array Template
 */
function _gutenberg_get_block_templates_files( $template_type, $query = array() ) {
	if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
		return null;
	}

	// @core-merge: This code will go into Core's '_get_block_templates_files' function.
	$default_template_types = array();
	if ( 'wp_template' === $template_type ) {
		$default_template_types = get_default_block_template_types();
	}
	// @core-merge: End of the code that will go into Core.

	// Prepare metadata from $query.
	$slugs_to_include = isset( $query['slug__in'] ) ? $query['slug__in'] : array();
	$slugs_to_skip    = isset( $query['slug__not_in'] ) ? $query['slug__not_in'] : array();
	$area             = isset( $query['area'] ) ? $query['area'] : null;
	$post_type        = isset( $query['post_type'] ) ? $query['post_type'] : '';

	$stylesheet = get_stylesheet();
	$template   = get_template();
	$themes     = array(
		$stylesheet => get_stylesheet_directory(),
	);
	// Add the parent theme if it's not the same as the current theme.
	if ( $stylesheet !== $template ) {
		$themes[ $template ] = get_template_directory();
	}
	$template_files = array();
	foreach ( $themes as $theme_slug => $theme_dir ) {
		$template_base_paths  = get_block_theme_folders( $theme_slug );
		$theme_template_files = _get_block_templates_paths( $theme_dir . '/' . $template_base_paths[ $template_type ] );
		foreach ( $theme_template_files as $template_file ) {
			$template_base_path = $template_base_paths[ $template_type ];
			$template_slug      = substr(
				$template_file,
				// Starting position of slug.
				strpos( $template_file, $template_base_path . DIRECTORY_SEPARATOR ) + 1 + strlen( $template_base_path ),
				// Subtract ending '.html'.
				-5
			);

			// Skip this item if its slug doesn't match any of the slugs to include.
			if ( ! empty( $slugs_to_include ) && ! in_array( $template_slug, $slugs_to_include, true ) ) {
				continue;
			}

			// Skip this item if its slug matches any of the slugs to skip.
			if ( ! empty( $slugs_to_skip ) && in_array( $template_slug, $slugs_to_skip, true ) ) {
				continue;
			}

			/*
			 * The child theme items (stylesheet) are processed before the parent theme's (template).
			 * If a child theme defines a template, prevent the parent template from being added to the list as well.
			 */
			if ( isset( $template_files[ $template_slug ] ) ) {
				continue;
			}

			$new_template_item = array(
				'slug'  => $template_slug,
				'path'  => $template_file,
				'theme' => $theme_slug,
				'type'  => $template_type,
			);

			if ( 'wp_template_part' === $template_type ) {
				$candidate = _add_block_template_part_area_info( $new_template_item );
				if ( ! isset( $area ) || ( isset( $area ) && $area === $candidate['area'] ) ) {
					$template_files[ $template_slug ] = $candidate;
				}
			}

			if ( 'wp_template' === $template_type ) {
				$candidate = _add_block_template_info( $new_template_item );
				$is_custom = ! isset( $default_template_types[ $candidate['slug'] ] );

				if (
					! $post_type ||
					( $post_type && isset( $candidate['postTypes'] ) && in_array( $post_type, $candidate['postTypes'], true ) )
				) {
					$template_files[ $template_slug ] = $candidate;
				}

				// @core-merge: This code will go into Core's '_get_block_templates_files' function.
				// The custom templates with no associated post-types are available for all post-types.
				if ( $post_type && ! isset( $candidate['postTypes'] ) && $is_custom ) {
					$template_files[ $template_slug ] = $candidate;
				}
				// @core-merge: End of the code that will go into Core.
			}
		}
	}

	return array_values( $template_files );
}

/**
 * Retrieves a list of unified template objects based on a query.
 *
 * @since 5.8.0
 *
 * @param array  $query {
 *     Optional. Arguments to retrieve templates.
 *
 *     @type string[] $slug__in  List of slugs to include.
 *     @type int      $wp_id     Post ID of customized template.
 *     @type string   $area      A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
 *     @type string   $post_type Post type to get the templates for.
 * }
 * @param string $template_type Template type. Either 'wp_template' or 'wp_template_part'.
 * @return WP_Block_Template[] Array of block templates.
 */
function gutenberg_get_block_templates( $query = array(), $template_type = 'wp_template' ) {
	/**
	 * Filters the block templates array before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress queries.
	 *
	 * @since 5.9.0
	 *
	 * @param WP_Block_Template[]|null $block_templates Return an array of block templates to short-circuit the default query,
	 *                                                  or null to allow WP to run its normal queries.
	 * @param array  $query {
	 *     Arguments to retrieve templates. All arguments are optional.
	 *
	 *     @type string[] $slug__in  List of slugs to include.
	 *     @type int      $wp_id     Post ID of customized template.
	 *     @type string   $area      A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
	 *     @type string   $post_type Post type to get the templates for.
	 * }
	 * @param string $template_type Template type. Either 'wp_template' or 'wp_template_part'.
	 */
	$templates = apply_filters( 'pre_get_block_templates', null, $query, $template_type );
	if ( ! is_null( $templates ) ) {
		return $templates;
	}

	$post_type     = isset( $query['post_type'] ) ? $query['post_type'] : '';
	$wp_query_args = array(
		'post_status'         => array( 'auto-draft', 'draft', 'publish' ),
		'post_type'           => $template_type,
		'posts_per_page'      => -1,
		'no_found_rows'       => true,
		'lazy_load_term_meta' => false,
		'tax_query'           => array(
			array(
				'taxonomy' => 'wp_theme',
				'field'    => 'name',
				'terms'    => get_stylesheet(),
			),
		),
	);

	if ( 'wp_template_part' === $template_type && isset( $query['area'] ) ) {
		$wp_query_args['tax_query'][]           = array(
			'taxonomy' => 'wp_template_part_area',
			'field'    => 'name',
			'terms'    => $query['area'],
		);
		$wp_query_args['tax_query']['relation'] = 'AND';
	}

	if ( ! empty( $query['slug__in'] ) ) {
		$wp_query_args['post_name__in']  = $query['slug__in'];
		$wp_query_args['posts_per_page'] = count( array_unique( $query['slug__in'] ) );
	}

	// This is only needed for the regular templates/template parts post type listing and editor.
	if ( isset( $query['wp_id'] ) ) {
		$wp_query_args['p'] = $query['wp_id'];
	} else {
		$wp_query_args['post_status'] = 'publish';
	}

	$template_query = new WP_Query( $wp_query_args );
	$query_result   = array();
	foreach ( $template_query->posts as $post ) {
		$template = _build_block_template_result_from_post( $post );

		if ( is_wp_error( $template ) ) {
			continue;
		}

		if ( $post_type && ! $template->is_custom ) {
			continue;
		}

		if (
			$post_type &&
			isset( $template->post_types ) &&
			! in_array( $post_type, $template->post_types, true )
		) {
			continue;
		}

		$query_result[] = $template;
	}

	if ( ! isset( $query['wp_id'] ) ) {
		/*
		 * If the query has found some use templates, those have priority
		 * over the theme-provided ones, so we skip querying and building them.
		 */
		$query['slug__not_in'] = wp_list_pluck( $query_result, 'slug' );
		$template_files        = _gutenberg_get_block_templates_files( $template_type, $query );
		foreach ( $template_files as $template_file ) {
			$query_result[] = _build_block_template_result_from_file( $template_file, $template_type );
		}
	}

	/**
	 * Filters the array of queried block templates array after they've been fetched.
	 *
	 * @since 5.9.0
	 *
	 * @param WP_Block_Template[] $query_result Array of found block templates.
	 * @param array               $query {
	 *     Arguments to retrieve templates. All arguments are optional.
	 *
	 *     @type string[] $slug__in  List of slugs to include.
	 *     @type int      $wp_id     Post ID of customized template.
	 *     @type string   $area      A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
	 *     @type string   $post_type Post type to get the templates for.
	 * }
	 * @param string              $template_type wp_template or wp_template_part.
	 */
	return apply_filters( 'get_block_templates', $query_result, $query, $template_type );
}
