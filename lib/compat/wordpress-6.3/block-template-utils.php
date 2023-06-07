<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.3.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

/**
 * Builds a unified template object based a post Object.
 *
 * @since 5.9.0
 * @since 6.3.0 Adding template `modified` property.
 * @access private
 *
 * @param WP_Post $post Template post.
 * @return WP_Block_Template|WP_Error Template or error object.
 */
function _gutenberg_build_block_template_result_from_post( $post ) {
	$default_template_types = get_default_block_template_types();
	$terms                  = get_the_terms( $post, 'wp_theme' );

	if ( is_wp_error( $terms ) ) {
		return $terms;
	}

	if ( ! $terms ) {
		return new WP_Error( 'template_missing_theme', __( 'No theme is defined for this template.' ) );
	}

	$theme          = $terms[0]->name;
	$template_file  = _get_block_template_file( $post->post_type, $post->post_name );
	$has_theme_file = get_stylesheet() === $theme && null !== $template_file;

	$origin           = get_post_meta( $post->ID, 'origin', true );
	$is_wp_suggestion = get_post_meta( $post->ID, 'is_wp_suggestion', true );

	$template                 = new Gutenberg_Block_Template();
	$template->wp_id          = $post->ID;
	$template->id             = $theme . '//' . $post->post_name;
	$template->theme          = $theme;
	$template->content        = $post->post_content;
	$template->slug           = $post->post_name;
	$template->source         = 'custom';
	$template->origin         = ! empty( $origin ) ? $origin : null;
	$template->type           = $post->post_type;
	$template->description    = $post->post_excerpt;
	$template->title          = $post->post_title;
	$template->status         = $post->post_status;
	$template->has_theme_file = $has_theme_file;
	$template->is_custom      = empty( $is_wp_suggestion );
	$template->author         = $post->post_author;
	$template->modified       = ! empty( $post->post_modified ) ? $post->post_modified : null;

	if ( 'wp_template' === $post->post_type && $has_theme_file && isset( $template_file['postTypes'] ) ) {
		$template->post_types = $template_file['postTypes'];
	}

	if ( 'wp_template' === $post->post_type && isset( $default_template_types[ $template->slug ] ) ) {
		$template->is_custom = false;
	}

	if ( 'wp_template_part' === $post->post_type ) {
		$type_terms = get_the_terms( $post, 'wp_template_part_area' );
		if ( ! is_wp_error( $type_terms ) && false !== $type_terms ) {
			$template->area = $type_terms[0]->name;
		}
	}

	// Check for a block template without a description and title or with a title equal to the slug.
	if ( 'wp_template' === $post->post_type && empty( $template->description ) && ( empty( $template->title ) || $template->title === $template->slug ) ) {
		$matches = array();

		// Check for a block template for a single author, page, post, tag, category, custom post type, or custom taxonomy.
		if ( preg_match( '/(author|page|single|tag|category|taxonomy)-(.+)/', $template->slug, $matches ) ) {
			$type           = $matches[1];
			$slug_remaining = $matches[2];

			switch ( $type ) {
				case 'author':
					$nice_name = $slug_remaining;
					$users     = get_users(
						array(
							'capability'     => 'edit_posts',
							'search'         => $nice_name,
							'search_columns' => array( 'user_nicename' ),
							'fields'         => 'display_name',
						)
					);

					if ( empty( $users ) ) {
						$template->title = sprintf(
						/* translators: Custom template title in the Site Editor, referencing a deleted author. %s: Author nicename. */
							__( 'Deleted author: %s' ),
							$nice_name
						);
					} else {
						$author_name = $users[0];

						$template->title = sprintf(
						/* translators: Custom template title in the Site Editor. %s: Author name. */
							__( 'Author: %s' ),
							$author_name
						);

						$template->description = sprintf(
						/* translators: Custom template description in the Site Editor. %s: Author name. */
							__( 'Template for %s' ),
							$author_name
						);

						$users_with_same_name = get_users(
							array(
								'capability'     => 'edit_posts',
								'search'         => $author_name,
								'search_columns' => array( 'display_name' ),
								'fields'         => 'display_name',
							)
						);

						if ( count( $users_with_same_name ) > 1 ) {
							$template->title = sprintf(
							/* translators: Custom template title in the Site Editor. 1: Template title of an author template, 2: Author nicename. */
								__( '%1$s (%2$s)' ),
								$template->title,
								$nice_name
							);
						}
					}
					break;
				case 'page':
					_wp_build_title_and_description_for_single_post_type_block_template( 'page', $slug_remaining, $template );
					break;
				case 'single':
					$post_types = get_post_types();

					foreach ( $post_types as $post_type ) {
						$post_type_length = strlen( $post_type ) + 1;

						// If $slug_remaining starts with $post_type followed by a hyphen.
						if ( 0 === strncmp( $slug_remaining, $post_type . '-', $post_type_length ) ) {
							$slug  = substr( $slug_remaining, $post_type_length, strlen( $slug_remaining ) );
							$found = _wp_build_title_and_description_for_single_post_type_block_template( $post_type, $slug, $template );

							if ( $found ) {
								break;
							}
						}
					}
					break;
				case 'tag':
					_wp_build_title_and_description_for_taxonomy_block_template( 'post_tag', $slug_remaining, $template );
					break;
				case 'category':
					_wp_build_title_and_description_for_taxonomy_block_template( 'category', $slug_remaining, $template );
					break;
				case 'taxonomy':
					$taxonomies = get_taxonomies();

					foreach ( $taxonomies as $taxonomy ) {
						$taxonomy_length = strlen( $taxonomy ) + 1;

						// If $slug_remaining starts with $taxonomy followed by a hyphen.
						if ( 0 === strncmp( $slug_remaining, $taxonomy . '-', $taxonomy_length ) ) {
							$slug  = substr( $slug_remaining, $taxonomy_length, strlen( $slug_remaining ) );
							$found = _wp_build_title_and_description_for_taxonomy_block_template( $taxonomy, $slug, $template );

							if ( $found ) {
								break;
							}
						}
					}
					break;
			}
		}
	}

	return $template;
}

/**
 * Retrieves a list of unified template objects based on a query.
 *
 * @since 5.8.0
 * @since 6.3.0 Adding template `modified` property in _build_block_template_result_from_post.
 *
 * @param array  $query {
 *     Optional. Arguments to retrieve templates.
 *
 *     @type string[] $slug__in  List of slugs to include.
 *     @type int      $wp_id     Post ID of customized template.
 *     @type string   $area      A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
 *     @type string   $post_type Post type to get the templates for.
 * }
 * @param string $template_type 'wp_template' or 'wp_template_part'.
 * @return WP_Block_Template[] Array of block templates.
 */
function gutenberg_get_block_templates( $query = array(), $template_type = 'wp_template' ) {
	/**
	 * Filters the block templates array before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress queries.
	 *
	 * @param WP_Block_Template[]|null $block_templates Return an array of block templates to short-circuit the default query,
	 *                                                  or null to allow WP to run its normal queries.
	 * @param array $query {
	 *     Arguments to retrieve templates. All arguments are optional.
	 *
	 * @type string[] $slug__in List of slugs to include.
	 * @type int $wp_id Post ID of customized template.
	 * @type string $area A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
	 * @type string $post_type Post type to get the templates for.
	 * }
	 * @param string $template_type 'wp_template' or 'wp_template_part'.
	 * @since 5.9.0
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
		$template = _gutenberg_build_block_template_result_from_post( $post );

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
		$template_files        = _get_block_templates_files( $template_type, $query );
		foreach ( $template_files as $template_file ) {
			$query_result[] = _build_block_template_result_from_file( $template_file, $template_type );
		}
	}

	/**
	 * Filters the array of queried block templates array after they've been fetched.
	 *
	 * @param WP_Block_Template[] $query_result Array of found block templates.
	 * @param array $query {
	 *     Arguments to retrieve templates. All arguments are optional.
	 *
	 * @type string[] $slug__in List of slugs to include.
	 * @type int $wp_id Post ID of customized template.
	 * @type string $area A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
	 * @type string $post_type Post type to get the templates for.
	 * }
	 * @param string $template_type wp_template or wp_template_part.
	 * @since 5.9.0
	 */
	return apply_filters( 'get_block_templates', $query_result, $query, $template_type );
}

/**
 * Retrieves a single unified template object using its id.
 *
 * @since 5.8.0
 * @since 6.3.0 Adding template `modified` property in _build_block_template_result_from_post.
 *
 * @param string $id            Template unique identifier (example: 'theme_slug//template_slug').
 * @param string $template_type Optional. Template type: 'wp_template' or 'wp_template_part'.
 *                              Default 'wp_template'.
 * @return WP_Block_Template|null Template.
 */
function gutenberg_get_block_template( $id, $template_type = 'wp_template' ) {
	/**
	 * Filters the block template object before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress queries.
	 *
	 * @since 5.9.0
	 *
	 * @param WP_Block_Template|null $block_template Return block template object to short-circuit the default query,
	 *                                               or null to allow WP to run its normal queries.
	 * @param string                 $id             Template unique identifier (example: 'theme_slug//template_slug').
	 * @param string                 $template_type  Template type: 'wp_template' or 'wp_template_part'.
	 */
	$block_template = apply_filters( 'pre_get_block_template', null, $id, $template_type );
	if ( ! is_null( $block_template ) ) {
		return $block_template;
	}

	$parts = explode( '//', $id, 2 );
	if ( count( $parts ) < 2 ) {
		return null;
	}
	list( $theme, $slug ) = $parts;
	$wp_query_args        = array(
		'post_name__in'  => array( $slug ),
		'post_type'      => $template_type,
		'post_status'    => array( 'auto-draft', 'draft', 'publish', 'trash' ),
		'posts_per_page' => 1,
		'no_found_rows'  => true,
		'tax_query'      => array(
			array(
				'taxonomy' => 'wp_theme',
				'field'    => 'name',
				'terms'    => $theme,
			),
		),
	);
	$template_query       = new WP_Query( $wp_query_args );
	$posts                = $template_query->posts;

	if ( count( $posts ) > 0 ) {
		$template = _gutenberg_build_block_template_result_from_post( $posts[0] );

		if ( ! is_wp_error( $template ) ) {
			return $template;
		}
	}

	$block_template = get_block_file_template( $id, $template_type );

	/**
	 * Filters the queried block template object after it's been fetched.
	 *
	 * @since 5.9.0
	 *
	 * @param WP_Block_Template|null $block_template The found block template, or null if there isn't one.
	 * @param string                 $id             Template unique identifier (example: 'theme_slug//template_slug').
	 * @param array                  $template_type  Template type: 'wp_template' or 'wp_template_part'.
	 */
	return apply_filters( 'get_block_template', $block_template, $id, $template_type );
}
