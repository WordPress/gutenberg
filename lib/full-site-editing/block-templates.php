<?php
/**
 * Utilities used to fetch and create templates and template parts.
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Finds all nested template part file paths in a theme's directory.
 *
 * @access private
 *
 * @param string $base_directory The theme's file path.
 * @return array $path_list A list of paths to all template part files.
 */
function _gutenberg_get_template_paths( $base_directory ) {
	$path_list = array();
	if ( file_exists( $base_directory ) ) {
		$nested_files      = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $base_directory ) );
		$nested_html_files = new RegexIterator( $nested_files, '/^.+\.html$/i', RecursiveRegexIterator::GET_MATCH );
		foreach ( $nested_html_files as $path => $file ) {
			$path_list[] = $path;
		}
	}
	return $path_list;
}

/**
 * Retrieves the template file from the theme for a given slug.
 *
 * @access private
 * @internal
 *
 * @param string $template_type wp_template or wp_template_part.
 * @param string $slug template slug.
 *
 * @return array|null Template.
 */
function _gutenberg_get_template_file( $template_type, $slug ) {
	$template_base_paths = array(
		'wp_template'      => 'block-templates',
		'wp_template_part' => 'block-template-parts',
	);
	$themes              = array(
		get_stylesheet() => get_stylesheet_directory(),
		get_template()   => get_template_directory(),
	);
	foreach ( $themes as $theme_slug => $theme_dir ) {
		$file_path = $theme_dir . '/' . $template_base_paths[ $template_type ] . '/' . $slug . '.html';
		if ( file_exists( $file_path ) ) {
			$new_template_item = array(
				'slug'  => $slug,
				'path'  => $file_path,
				'theme' => $theme_slug,
				'type'  => $template_type,
			);

			if ( 'wp_template_part' === $template_type ) {
				return _gutenberg_add_template_part_area_info( $new_template_item );
			}
			return $new_template_item;
		}
	}

	return null;
}

/**
 * Retrieves the template files from  the theme.
 *
 * @access private
 * @internal
 *
 * @param string $template_type wp_template or wp_template_part.
 *
 * @return array Template.
 */
function _gutenberg_get_template_files( $template_type ) {
	$template_base_paths = array(
		'wp_template'      => 'block-templates',
		'wp_template_part' => 'block-template-parts',
	);
	$themes              = array(
		get_stylesheet() => get_stylesheet_directory(),
		get_template()   => get_template_directory(),
	);

	$template_files = array();
	foreach ( $themes as $theme_slug => $theme_dir ) {
		$theme_template_files = _gutenberg_get_template_paths( $theme_dir . '/' . $template_base_paths[ $template_type ] );
		foreach ( $theme_template_files as $template_file ) {
			$template_base_path = $template_base_paths[ $template_type ];
			$template_slug      = substr(
				$template_file,
				// Starting position of slug.
				strpos( $template_file, $template_base_path . DIRECTORY_SEPARATOR ) + 1 + strlen( $template_base_path ),
				// Subtract ending '.html'.
				-5
			);
			$new_template_item = array(
				'slug'  => $template_slug,
				'path'  => $template_file,
				'theme' => $theme_slug,
				'type'  => $template_type,
			);

			if ( 'wp_template_part' === $template_type ) {
				$template_files[] = _gutenberg_add_template_part_area_info( $new_template_item );
			} else {
				$template_files[] = $new_template_item;
			}
		}
	}

	return $template_files;
}

/**
 * Attempts to add the template part's area information to the input template.
 *
 * @param array $template_info Template to add information to (requires 'type' and 'slug' fields).
 *
 * @return array Template.
 */
function _gutenberg_add_template_part_area_info( $template_info ) {
	if ( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_template_parts();
	}

	if ( isset( $theme_data[ $template_info['slug'] ]['area'] ) ) {
		$template_info['area'] = gutenberg_filter_template_part_area( $theme_data[ $template_info['slug'] ]['area'] );
	} else {
		$template_info['area'] = WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
	}

	return $template_info;
}

/**
 * Returns an array containing the references of
 * the passed blocks and their inner blocks.
 *
 * @param array $blocks array of blocks.
 *
 * @return array block references to the passed blocks and their inner blocks.
 */
function _gutenberg_flatten_blocks( &$blocks ) {
	$all_blocks = array();
	$queue      = array();
	foreach ( $blocks as &$block ) {
		$queue[] = &$block;
	}

	while ( count( $queue ) > 0 ) {
		$block = &$queue[0];
		array_shift( $queue );
		$all_blocks[] = &$block;

		if ( ! empty( $block['innerBlocks'] ) ) {
			foreach ( $block['innerBlocks'] as &$inner_block ) {
				$queue[] = &$inner_block;
			}
		}
	}

	return $all_blocks;
}

/**
 * Parses wp_template content and injects the current theme's
 * stylesheet as a theme attribute into each wp_template_part
 *
 * @param string $template_content serialized wp_template content.
 *
 * @return string Updated wp_template content.
 */
function _gutenberg_inject_theme_attribute_in_content( $template_content ) {
	$has_updated_content = false;
	$new_content         = '';
	$template_blocks     = parse_blocks( $template_content );

	$blocks = _gutenberg_flatten_blocks( $template_blocks );
	foreach ( $blocks as &$block ) {
		if (
			'core/template-part' === $block['blockName'] &&
			! isset( $block['attrs']['theme'] )
		) {
			$block['attrs']['theme'] = wp_get_theme()->get_stylesheet();
			$has_updated_content     = true;
		}
	}

	if ( $has_updated_content ) {
		foreach ( $template_blocks as &$block ) {
			$new_content .= serialize_block( $block );
		}

		return $new_content;
	}

	return $template_content;
}

/**
 * Build a unified template object based on a theme file.
 *
 * @param array $template_file Theme file.
 * @param array $template_type wp_template or wp_template_part.
 *
 * @return WP_Block_Template Template.
 */
function _gutenberg_build_template_result_from_file( $template_file, $template_type ) {
	$default_template_types = gutenberg_get_default_template_types();
	$template_content       = file_get_contents( $template_file['path'] );
	$theme                  = wp_get_theme()->get_stylesheet();

	$template                 = new WP_Block_Template();
	$template->id             = $theme . '//' . $template_file['slug'];
	$template->theme          = $theme;
	$template->content        = _gutenberg_inject_theme_attribute_in_content( $template_content );
	$template->slug           = $template_file['slug'];
	$template->source         = 'theme';
	$template->type           = $template_type;
	$template->title          = $template_file['slug'];
	$template->status         = 'publish';
	$template->has_theme_file = true;

	if ( 'wp_template' === $template_type && isset( $default_template_types[ $template_file['slug'] ] ) ) {
		$template->description = $default_template_types[ $template_file['slug'] ]['description'];
		$template->title       = $default_template_types[ $template_file['slug'] ]['title'];
	}

	if ( 'wp_template_part' === $template_type && isset( $template_file['area'] ) ) {
		$template->area = $template_file['area'];
	}

	return $template;
}

/**
 * Build a unified template object based a post Object.
 *
 * @param WP_Post $post Template post.
 *
 * @return WP_Block_Template|WP_Error Template.
 */
function _gutenberg_build_template_result_from_post( $post ) {
	$terms = get_the_terms( $post, 'wp_theme' );

	if ( is_wp_error( $terms ) ) {
		return $terms;
	}

	if ( ! $terms ) {
		return new WP_Error( 'template_missing_theme', __( 'No theme is defined for this template.', 'gutenberg' ) );
	}

	$theme          = $terms[0]->name;
	$has_theme_file = wp_get_theme()->get_stylesheet() === $theme &&
		null !== _gutenberg_get_template_file( $post->post_type, $post->post_name );

	$template                 = new WP_Block_Template();
	$template->wp_id          = $post->ID;
	$template->id             = $theme . '//' . $post->post_name;
	$template->theme          = $theme;
	$template->content        = $post->post_content;
	$template->slug           = $post->post_name;
	$template->source         = 'custom';
	$template->type           = $post->post_type;
	$template->description    = $post->post_excerpt;
	$template->title          = $post->post_title;
	$template->status         = $post->post_status;
	$template->has_theme_file = $has_theme_file;

	if ( 'wp_template_part' === $post->post_type ) {
		$type_terms = get_the_terms( $post, 'wp_template_part_area' );
		if ( ! is_wp_error( $type_terms ) && false !== $type_terms ) {
			$template->area = $type_terms[0]->name;
		}
	}

	return $template;
}

/**
 * Retrieves a list of unified template objects based on a query.
 *
 * @param array $query {
 *     Optional. Arguments to retrieve templates.
 *
 *     @type array  $slug__in List of slugs to include.
 *     @type int    $wp_id    Post ID of customized template.
 *     @type string $area     A 'wp_template_part_area' taxonomy value to filter by (for wp_template_part template type only).
 * }
 * @param array $template_type wp_template or wp_template_part.
 *
 * @return array Templates.
 */
function gutenberg_get_block_templates( $query = array(), $template_type = 'wp_template' ) {
	/**
	 * Filters the block templates array before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress quries.
	 *
	 * @since 10.8
	 *
	 * @param WP_Block_Template[]|null $block_templates Return an array of block templates to short-circuit the default query,
	 *                                                  or null to allow WP to run it's normal queries.
	 * @param array $query {
	 *     Optional. Arguments to retrieve templates.
	 *
	 *     @type array  $slug__in List of slugs to include.
	 *     @type int    $wp_id Post ID of customized template.
	 * }
	 * @param array $template_type wp_template or wp_template_part.
	 */
	$templates = apply_filters( 'pre_get_block_templates', null, $query, $template_type );
	if ( ! is_null( $templates ) ) {
		return $templates;
	}

	$wp_query_args = array(
		'post_status'    => array( 'auto-draft', 'draft', 'publish' ),
		'post_type'      => $template_type,
		'posts_per_page' => -1,
		'no_found_rows'  => true,
		'tax_query'      => array(
			array(
				'taxonomy' => 'wp_theme',
				'field'    => 'name',
				'terms'    => wp_get_theme()->get_stylesheet(),
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
		$template = _gutenberg_build_template_result_from_post( $post );

		if ( ! is_wp_error( $template ) ) {
			$query_result[] = $template;
		}
	}

	if ( ! isset( $query['wp_id'] ) ) {
		$template_files = _gutenberg_get_template_files( $template_type );
		foreach ( $template_files as $template_file ) {
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
				$query_result[] = _gutenberg_build_template_result_from_file( $template_file, $template_type );
			}
		}
	}

	/**
	 * Filters the array of queried block templates array after they've been fetched.
	 *
	 * @since 10.8
	 *
	 * @param WP_Block_Template[] $query_result Array of found block templates.
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
 * @return WP_Block_Template|null Template.
 */
function gutenberg_get_block_template( $id, $template_type = 'wp_template' ) {
	/**
	 * Filters the block templates array before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress quries.
	 *
	 * @since 10.8
	 *
	 * @param WP_Block_Template|null $block_template Return block template object to short-circuit the default query,
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
		$template = _gutenberg_build_template_result_from_post( $posts[0] );

		if ( ! is_wp_error( $template ) ) {
			return $template;
		}
	}

	$block_template = gutenberg_get_block_file_template( $id, $template_type );

	/**
	 * Filters the array of queried block templates array after they've been fetched.
	 *
	 * @since 10.8
	 *
	 * @param WP_Block_Template $block_template The found block template.
	 * @param string $id Template unique identifier (example: theme_slug//template_slug).
	 * @param array  $template_type wp_template or wp_template_part.
	 */
	return apply_filters( 'get_block_template', $block_template, $id, $template_type );
}

/**
 * Retrieves a single unified template object using its id.
 * Retrieves the file template.
 *
 * @param string $id Template unique identifier (example: theme_slug//template_slug).
 * @param array  $template_type wp_template or wp_template_part.
 *
 * @return WP_Block_Template|null File template.
 */
function gutenberg_get_block_file_template( $id, $template_type = 'wp_template' ) {
	/**
	 * Filters the block templates array before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress quries.
	 *
	 * @since 10.8
	 *
	 * @param WP_Block_Template|null $block_template Return block template object to short-circuit the default query,
	 *                                               or null to allow WP to run it's normal queries.
	 * @param string $id Template unique identifier (example: theme_slug//template_slug).
	 * @param array  $template_type wp_template or wp_template_part.
	 */
	$block_template = apply_filters( 'pre_get_block_file_template', null, $id, $template_type );
	if ( ! is_null( $block_template ) ) {
		return $block_template;
	}

	$parts = explode( '//', $id, 2 );
	if ( count( $parts ) < 2 ) {
		/** This filter is documented at the end of this function */
		return apply_filters( 'get_block_file_template', null, $id, $template_type );
	}
	list( $theme, $slug ) = $parts;

	if ( wp_get_theme()->get_stylesheet() !== $theme ) {
		/** This filter is documented at the end of this function */
		return apply_filters( 'get_block_file_template', null, $id, $template_type );
	}

	$template_file = _gutenberg_get_template_file( $template_type, $slug );
	if ( null === $template_file ) {
		/** This filter is documented at the end of this function */
		return apply_filters( 'get_block_file_template', null, $id, $template_type );
	}

	$block_template = _gutenberg_build_template_result_from_file( $template_file, $template_type );

	/**
	 * Filters the array of queried block templates array after they've been fetched.
	 *
	 * @since 10.8
	 *
	 * @param null|WP_Block_Template $block_template The found block template.
	 * @param string $id Template unique identifier (example: theme_slug//template_slug).
	 * @param array  $template_type wp_template or wp_template_part.
	 */
	return apply_filters( 'get_block_file_template', $block_template, $id, $template_type );
}

/**
 * Generates a unique slug for templates or template parts.
 *
 * @param string $override_slug The filtered value of the slug (starts as `null` from apply_filter).
 * @param string $slug          The original/un-filtered slug (post_name).
 * @param int    $post_ID       Post ID.
 * @param string $post_status   No uniqueness checks are made if the post is still draft or pending.
 * @param string $post_type     Post type.
 * @return string The original, desired slug.
 */
function gutenberg_filter_wp_template_unique_post_slug( $override_slug, $slug, $post_ID, $post_status, $post_type ) {
	if ( 'wp_template' !== $post_type && 'wp_template_part' !== $post_type ) {
		return $override_slug;
	}

	if ( ! $override_slug ) {
		$override_slug = $slug;
	}

	// Template slugs must be unique within the same theme.
	// TODO - Figure out how to update this to work for a multi-theme
	// environment.  Unfortunately using `get_the_terms` for the 'wp-theme'
	// term does not work in the case of new entities since is too early in
	// the process to have been saved to the entity.  So for now we use the
	// currently activated theme for creation.
	$theme = wp_get_theme()->get_stylesheet();
	$terms = get_the_terms( $post_ID, 'wp_theme' );
	if ( $terms && ! is_wp_error( $terms ) ) {
		$theme = $terms[0]->name;
	}

	$check_query_args = array(
		'post_name__in'  => array( $override_slug ),
		'post_type'      => $post_type,
		'posts_per_page' => 1,
		'no_found_rows'  => true,
		'post__not_in'   => array( $post_ID ),
		'tax_query'      => array(
			array(
				'taxonomy' => 'wp_theme',
				'field'    => 'name',
				'terms'    => $theme,
			),
		),
	);
	$check_query      = new WP_Query( $check_query_args );
	$posts            = $check_query->posts;

	if ( count( $posts ) > 0 ) {
		$suffix = 2;
		do {
			$query_args                  = $check_query_args;
			$alt_post_name               = _truncate_post_slug( $override_slug, 200 - ( strlen( $suffix ) + 1 ) ) . "-$suffix";
			$query_args['post_name__in'] = array( $alt_post_name );
			$query                       = new WP_Query( $query_args );
			$suffix++;
		} while ( count( $query->posts ) > 0 );
		$override_slug = $alt_post_name;
	}

	return $override_slug;
}
add_filter( 'pre_wp_unique_post_slug', 'gutenberg_filter_wp_template_unique_post_slug', 10, 5 );
