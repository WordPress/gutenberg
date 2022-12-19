<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.1.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

/**
 * Updates the list of default template types, containing their
 * localized titles and descriptions.
 *
 * We will only need to update `get_default_block_template_types` function.
 *
 * @param array $default_template_types The default template types.
 *
 * @return array The default template types.
 */
function gutenberg_get_default_block_template_types( $default_template_types ) {
	if ( isset( $default_template_types['single'] ) ) {
		$default_template_types['single'] = array(
			'title'       => _x( 'Single', 'Template name', 'gutenberg' ),
			'description' => __( 'The default template for displaying any single post or attachment.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['category'] ) ) {
		$default_template_types['category'] = array(
			'title'       => _x( 'Category', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays latest posts from a single post category.', 'gutenberg' ),
		);
	}
	return $default_template_types;
}
add_filter( 'default_template_types', 'gutenberg_get_default_block_template_types', 10 );


/**
 * Retrieves a list of unified template objects based on a query.
 *
 * @param array $query {
 *     Optional. Arguments to retrieve templates.
 *
 *     @type array  $slug__in  List of slugs to include.
 *     @type int    $wp_id     Post ID of customized template.
 *     @type string $area      A 'wp_template_part_area' taxonomy value to filter by (for wp_template_part template type only).
 *     @type string $post_type Post type to get the templates for.
 * }
 * @param array $template_type wp_template or wp_template_part.
 *
 * @return array Templates.
 */
function gutenberg_get_block_templates( $query = array(), $template_type = 'wp_template' ) {
	/**
	 * Filters the block templates array before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress queries.
	 *
	 * @since 10.8
	 *
	 * @param Gutenberg_Block_Template[]|null $block_templates Return an array of block templates to short-circuit the default query,
	 *                                                  or null to allow WP to run it's normal queries.
	 * @param array $query {
	 *     Optional. Arguments to retrieve templates.
	 *
	 *     @type array  $slug__in List of slugs to include.
	 *     @type int    $wp_id Post ID of customized template.
	 *     @type string $post_type Post type to get the templates for.
	 * }
	 * @param array $template_type wp_template or wp_template_part.
	 */
	$templates = apply_filters( 'pre_get_block_templates', null, $query, $template_type );
	if ( ! is_null( $templates ) ) {
		return $templates;
	}

	$post_type     = isset( $query['post_type'] ) ? $query['post_type'] : '';
	$wp_query_args = array(
		'post_status'    => array( 'auto-draft', 'draft', 'publish' ),
		'post_type'      => $template_type,
		'posts_per_page' => -1,
		'no_found_rows'  => true,
		'tax_query'      => array(
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

	if ( isset( $query['slug__in'] ) ) {
		$wp_query_args['post_name__in'] = $query['slug__in'];
	}

	// This is only needed for the regular templates/template parts CPT listing and editor.
	if ( isset( $query['wp_id'] ) ) {
		$wp_query_args['p'] = $query['wp_id'];
	} else {
		$wp_query_args['post_status'] = 'publish';
	}

	$template_query = new WP_Query( $wp_query_args );
	$query_result   = array();
	foreach ( $template_query->posts as $post ) {
		$template = gutenberg_build_block_template_result_from_post( $post );
		if ( is_wp_error( $template ) ) {
			continue;
		}

		if ( $post_type && ! $template->is_custom ) {
			continue;
		}

		if ( $post_type &&
			isset( $template->post_types ) &&
			! in_array( $post_type, $template->post_types, true )
		) {
			continue;
		}

		$query_result[] = $template;
	}
	if ( ! isset( $query['wp_id'] ) ) {
		$template_files = _get_block_templates_files( $template_type );
		foreach ( $template_files as $template_file ) {
			$template = _build_block_template_result_from_file( $template_file, $template_type );

			if ( $post_type && ! $template->is_custom ) {
				continue;
			}

			if ( $post_type &&
				isset( $template->post_types ) &&
				! in_array( $post_type, $template->post_types, true )
			) {
				continue;
			}

			$is_not_custom   = false === array_search(
				wp_get_theme()->get_stylesheet() . '//' . $template_file['slug'],
				array_column( $query_result, 'id' ),
				true
			);
			$fits_slug_query =
				! isset( $query['slug__in'] ) || in_array( $template_file['slug'], $query['slug__in'], true );
			$fits_area_query =
				! isset( $query['area'] ) || $template_file['area'] === $query['area'];
			$should_include  = $is_not_custom && $fits_slug_query && $fits_area_query;
			if ( $should_include ) {
				$query_result[] = $template;
			}
		}
	}
	/**
	 * Filters the array of queried block templates array after they've been fetched.
	 *
	 * @since 10.8
	 *
	 * @param Gutenberg_Block_Template[] $query_result Array of found block templates.
	 * @param array $query {
	 *     Optional. Arguments to retrieve templates.
	 *
	 *     @type array  $slug__in List of slugs to include.
	 *     @type int    $wp_id Post ID of customized template.
	 * }
	 * @param array $template_type wp_template or wp_template_part.
	 */
	return apply_filters( 'get_block_templates', $query_result, $query, $template_type );
}

/**
 * Retrieves a single unified template object using its id.
 *
 * @param string $id Template unique identifier (example: theme_slug//template_slug).
 * @param array  $template_type wp_template or wp_template_part.
 *
 * @return Gutenberg_Block_Template|null Template.
 */
function gutenberg_get_block_template( $id, $template_type = 'wp_template' ) {
	/**
	 * Filters the block template object before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress queries.
	 *
	 * @since 10.8
	 *
	 * @param Gutenberg_Block_Template|null $block_template Return block template object to short-circuit the default query,
	 *                                               or null to allow WP to run it's normal queries.
	 * @param string $id Template unique identifier (example: theme_slug//template_slug).
	 * @param array  $template_type wp_template or wp_template_part.
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
		$template = gutenberg_build_block_template_result_from_post( $posts[0] );

		if ( ! is_wp_error( $template ) ) {
			return $template;
		}
	}

	$block_template = get_block_file_template( $id, $template_type );

	/**
	 * Filters the queried block template object after it's been fetched.
	 *
	 * @since 10.8
	 *
	 * @param Gutenberg_Block_Template|null $block_template The found block template, or null if there isn't one.
	 * @param string $id Template unique identifier (example: theme_slug//template_slug).
	 * @param array  $template_type wp_template or wp_template_part.
	 */
	return apply_filters( 'get_block_template', $block_template, $id, $template_type );
}

/**
 * Builds the title and description of a post-specific template based on the underlying referenced post.
 * Mutates the underlying template object.
 *
 * @since 6.1.0
 * @access private
 * @internal
 *
 * @param string            $post_type Post type e.g.: page, post, product.
 * @param string            $slug      Slug of the post e.g.: a-story-about-shoes.
 * @param WP_Block_Template $template  Template to mutate adding the description and title computed.
 * @return boolean Returns true if the referenced post was found and false otherwise.
 */
function _gutenberg_build_title_and_description_for_single_post_type_block_template( $post_type, $slug, WP_Block_Template $template ) {
	$post_type_object = get_post_type_object( $post_type );

	$default_args = array(
		'post_type'              => $post_type,
		'post_status'            => 'publish',
		'posts_per_page'         => 1,
		'update_post_meta_cache' => false,
		'update_post_term_cache' => false,
		'ignore_sticky_posts'    => true,
		'no_found_rows'          => true,
	);

	$args = array(
		'name' => $slug,
	);
	$args = wp_parse_args( $args, $default_args );

	$posts_query = new WP_Query( $args );

	if ( empty( $posts_query->posts ) ) {
		$template->title = sprintf(
			/* translators: Custom template title in the Site Editor referencing a post that was not found. 1: Post type singular name, 2: Post type slug. */
			__( 'Not found: %1$s (%2$s)', 'gutenberg' ),
			$post_type_object->labels->singular_name,
			$slug
		);

		return false;
	}

	$post_title = $posts_query->posts[0]->post_title;

	$template->title = sprintf(
		/* translators: Custom template title in the Site Editor. 1: Post type singular name, 2: Post title. */
		__( '%1$s: %2$s', 'gutenberg' ),
		$post_type_object->labels->singular_name,
		$post_title
	);

	$template->description = sprintf(
		/* translators: Custom template description in the Site Editor. %s: Post title. */
		__( 'Template for %s', 'gutenberg' ),
		$post_title
	);

	$args = array(
		'title' => $post_title,
	);
	$args = wp_parse_args( $args, $default_args );

	$posts_with_same_title_query = new WP_Query( $args );

	if ( count( $posts_with_same_title_query->posts ) > 1 ) {
		$template->title = sprintf(
			/* translators: Custom template title in the Site Editor. 1: Template title, 2: Post type slug. */
			__( '%1$s (%2$s)', 'gutenberg' ),
			$template->title,
			$slug
		);
	}

	return true;
}

/**
 * Builds the title and description of a taxonomy-specific template based on the underlying entity referenced.
 * Mutates the underlying template object.
 *
 * @access private
 * @internal
 *
 * @param string            $taxonomy Identifier of the taxonomy, e.g.: category.
 * @param string            $slug     Slug of the term, e.g.: shoes.
 * @param WP_Block_Template $template Template to mutate adding the description and title computed.
 *
 * @return boolean True if the term referenced was found and false otherwise.
 */
function _gutenberg_build_title_and_description_for_taxonomy_block_template( $taxonomy, $slug, WP_Block_Template $template ) {
	$taxonomy_object = get_taxonomy( $taxonomy );

	$default_args = array(
		'taxonomy'               => $taxonomy,
		'hide_empty'             => false,
		'update_term_meta_cache' => false,
	);

	$term_query = new WP_Term_Query();

	$args = array(
		'number' => 1,
		'slug'   => $slug,
	);
	$args = wp_parse_args( $args, $default_args );

	$terms_query = $term_query->query( $args );

	if ( empty( $terms_query ) ) {
		$template->title = sprintf(
			/* translators: Custom template title in the Site Editor, referencing a taxonomy term that was not found. 1: Taxonomy singular name, 2: Term slug. */
			__( 'Not found: %1$s (%2$s)', 'gutenberg' ),
			$taxonomy_object->labels->singular_name,
			$slug
		);
		return false;
	}

	$term_title = $terms_query[0]->name;

	$template->title = sprintf(
		/* translators: Custom template title in the Site Editor. 1: Taxonomy singular name, 2: Term title. */
		__( '%1$s: %2$s', 'gutenberg' ),
		$taxonomy_object->labels->singular_name,
		$term_title
	);

	$template->description = sprintf(
		/* translators: Custom template description in the Site Editor. %s: Term title. */
		__( 'Template for %s', 'gutenberg' ),
		$term_title
	);

	$term_query = new WP_Term_Query();

	$args = array(
		'number' => 2,
		'name'   => $term_title,
	);
	$args = wp_parse_args( $args, $default_args );

	$terms_with_same_title_query = $term_query->query( $args );

	if ( count( $terms_with_same_title_query ) > 1 ) {
		$template->title = sprintf(
			/* translators: Custom template title in the Site Editor. 1: Template title, 2: Term slug. */
			__( '%1$s (%2$s)', 'gutenberg' ),
			$template->title,
			$slug
		);
	}

	return true;
}

/**
 * Build a unified template object based a post Object.
 *
 * @param WP_Post $post Template post.
 *
 * @return Gutenberg_Block_Template|WP_Error Template.
 */
function gutenberg_build_block_template_result_from_post( $post ) {
	$default_template_types = get_default_block_template_types();
	$terms                  = get_the_terms( $post, 'wp_theme' );

	if ( is_wp_error( $terms ) ) {
		return $terms;
	}

	if ( ! $terms ) {
		return new WP_Error( 'template_missing_theme', __( 'No theme is defined for this template.', 'gutenberg' ) );
	}

	$origin           = get_post_meta( $post->ID, 'origin', true );
	$is_wp_suggestion = get_post_meta( $post->ID, 'is_wp_suggestion', true );

	$theme          = $terms[0]->name;
	$template_file  = _get_block_template_file( $post->post_type, $post->post_name );
	$has_theme_file = get_stylesheet() === $theme && null !== $template_file;

	$template                 = new WP_Block_Template();
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

	// We keep this check for existent templates that are part of the template hierarchy.
	if ( 'wp_template' === $post->post_type && isset( $default_template_types[ $template->slug ] ) ) {
		$template->is_custom = false;
	}

	if ( 'wp_template' === $post->post_type && $has_theme_file && isset( $template_file['postTypes'] ) ) {
		$template->post_types = $template_file['postTypes'];
	}

	if ( 'wp_template_part' === $post->post_type ) {
		$type_terms = get_the_terms( $post, 'wp_template_part_area' );
		if ( ! is_wp_error( $type_terms ) && false !== $type_terms ) {
			$template->area = $type_terms[0]->name;
		}
	}
	// If it is a block template without description and without title or with title equal to the slug.
	if ( 'wp_template' === $post->post_type && empty( $template->description ) && ( empty( $template->title ) || $template->title === $template->slug ) ) {
		$matches = array();
		// If it is a block template for a single author, page, post, tag, category, custom post type or custom taxonomy.
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
							// translators: Represents the title of a user's custom template in the Site Editor referencing a deleted author, where %s is the author's nicename, e.g. "Deleted author: jane-doe".
							__( 'Deleted author: %s', 'gutenberg' ),
							$nice_name
						);
					} else {
						$author_name = $users[0];

						$template->title = sprintf(
							// translators: Represents the title of a user's custom template in the Site Editor, where %s is the author's name, e.g. "Author: Jane Doe".
							__( 'Author: %s', 'gutenberg' ),
							$author_name
						);
						$template->description = sprintf(
							// translators: Represents the description of a user's custom template in the Site Editor, e.g. "Template for Author: Jane Doe".
							__( 'Template for %1$s', 'gutenberg' ),
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
								// translators: Represents the title of a user's custom template in the Site Editor, where %1$s is the template title of an author template and %2$s is the nicename of the author, e.g. "Author: Jane Doe (jane-doe)".
								__( '%1$s (%2$s)', 'gutenberg' ),
								$template->title,
								$nice_name
							);
						}
					}
					break;
				case 'page':
					_gutenberg_build_title_and_description_for_single_post_type_block_template( 'page', $slug_remaining, $template );
					break;
				case 'single':
					$post_types = get_post_types();
					foreach ( $post_types as $post_type ) {
						$post_type_length = strlen( $post_type ) + 1;
						// If $slug_remaining starts with $post_type followed by a hyphen.
						if ( 0 === strncmp( $slug_remaining, $post_type . '-', $post_type_length ) ) {
							$slug  = substr( $slug_remaining, $post_type_length, strlen( $slug_remaining ) );
							$found = _gutenberg_build_title_and_description_for_single_post_type_block_template( $post_type, $slug, $template );
							if ( $found ) {
								break;
							}
						}
					}
					break;
				case 'tag':
					_gutenberg_build_title_and_description_for_taxonomy_block_template( 'post_tag', $slug_remaining, $template );
					break;
				case 'category':
					_gutenberg_build_title_and_description_for_taxonomy_block_template( 'category', $slug_remaining, $template );
					break;
				case 'taxonomy':
					$taxonomies = get_taxonomies();
					foreach ( $taxonomies as $taxonomy ) {
						$taxonomy_length = strlen( $taxonomy ) + 1;
						// If $slug_remaining starts with $taxonomy followed by a hyphen.
						if ( 0 === strncmp( $slug_remaining, $taxonomy . '-', $taxonomy_length ) ) {
							$slug  = substr( $slug_remaining, $taxonomy_length, strlen( $slug_remaining ) );
							$found = _gutenberg_build_title_and_description_for_taxonomy_block_template( $taxonomy, $slug, $template );
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

if ( ! function_exists( 'get_template_hierarchy' ) ) {
	/**
	 * Helper function to get the Template Hierarchy for a given slug.
	 * We need to Handle special cases here like `front-page`, `singular` and `archive` templates.
	 *
	 * Noting that we always add `index` as the last fallback template.
	 *
	 * @param string  $slug            The template slug to be created.
	 * @param boolean $is_custom       Indicates if a template is custom or part of the template hierarchy.
	 * @param string  $template_prefix The template prefix for the created template. This is used to extract the main template type ex. in `taxonomy-books` we extract the `taxonomy`.
	 *
	 * @return array<string> The template hierarchy.
	 */
	function get_template_hierarchy( $slug, $is_custom = false, $template_prefix = '' ) {
		if ( 'index' === $slug ) {
			return array( 'index' );
		}
		if ( $is_custom ) {
			return array( 'page', 'singular', 'index' );
		}
		if ( 'front-page' === $slug ) {
			return array( 'front-page', 'home', 'index' );
		}
		$template_hierarchy = array( $slug );
		// Most default templates don't have `$template_prefix` assigned.
		if ( $template_prefix ) {
			list($type) = explode( '-', $template_prefix );
			// We need these checks because we always add the `$slug` above.
			if ( ! in_array( $template_prefix, array( $slug, $type ), true ) ) {
				$template_hierarchy[] = $template_prefix;
			}
			if ( $slug !== $type ) {
				$template_hierarchy[] = $type;
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
		return $template_hierarchy;
	}
}
