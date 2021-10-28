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

			if ( 'wp_template' === $template_type ) {
				return _gutenberg_add_template_info( $new_template_item );
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
			}

			if ( 'wp_template' === $template_type ) {
				$template_files[] = _gutenberg_add_template_info( $new_template_item );
			}
		}
	}

	return $template_files;
}

/**
 * Attempts to add custom template information to the template item.
 *
 * @param array $template_item Template to add information to (requires 'slug' field).
 * @return array Template
 */
function _gutenberg_add_template_info( $template_item ) {
	if ( ! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		return $template_item;
	}

	$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_custom_templates();
	if ( isset( $theme_data[ $template_item['slug'] ] ) ) {
		$template_item['title']     = $theme_data[ $template_item['slug'] ]['title'];
		$template_item['postTypes'] = $theme_data[ $template_item['slug'] ]['postTypes'];
	}

	return $template_item;
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
		$template_info['title'] = $theme_data[ $template_info['slug'] ]['title'];
		$template_info['area']  = gutenberg_filter_template_part_area( $theme_data[ $template_info['slug'] ]['area'] );
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
	$template->title          = ! empty( $template_file['title'] ) ? $template_file['title'] : $template_file['slug'];
	$template->status         = 'publish';
	$template->has_theme_file = true;
	$template->is_custom      = true;

	if ( 'wp_template' === $template_type && isset( $default_template_types[ $template_file['slug'] ] ) ) {
		$template->description = $default_template_types[ $template_file['slug'] ]['description'];
		$template->title       = $default_template_types[ $template_file['slug'] ]['title'];
		$template->is_custom   = false;
	}

	if ( 'wp_template' === $template_type && isset( $template_file['postTypes'] ) ) {
		$template->post_types = $template_file['postTypes'];
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
	if ( ! in_array( $post->post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
		return new WP_Error( 'template_wrong_post_type', __( 'An invalid post was provided for this template.', 'gutenberg' ) );
	}

	$default_template_types = gutenberg_get_default_template_types();
	$ids                    = get_theme_mod( $post->post_type, array() );
	$active                 = in_array( $post->ID, $ids, true );

	// Temporarily disable inactive access for 5.8 version.
	if ( ! $active ) {
		return new WP_Error( 'template_missing_theme', __( 'No theme is defined for this template.', 'gutenberg' ) );
	}

	$theme          = wp_get_theme()->get_stylesheet();
	$slug           = array_search( $post->ID, $ids, true );
	$has_theme_file = null !== _gutenberg_get_template_file( $post->post_type, $slug );

	$template                 = new WP_Block_Template();
	$template->wp_id          = $post->ID;
	$template->id             = $theme . '//' . $slug;
	$template->theme          = $theme;
	$template->content        = $post->post_content;
	$template->slug           = $slug;
	$template->source         = 'custom';
	$template->type           = $post->post_type;
	$template->description    = $post->post_excerpt;
	$template->title          = $post->post_title;
	$template->status         = $post->post_status;
	$template->has_theme_file = $has_theme_file;
	$template->is_custom      = true;

	if ( 'wp_template' === $post->post_type && isset( $default_template_types[ $template->slug ] ) ) {
		$template->is_custom = false;
	}

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
 * @param array  $query {
 *     Optional. Arguments to retrieve templates.
 *
 *     @type array  $slug__in  List of slugs to include.
 *     @type int    $wp_id     Post ID of customized template.
 *     @type string $area      A 'wp_template_part_area' taxonomy value to filter by (for wp_template_part template type only).
 *     @type string $post_type Post type to get the templates for.
 * }
 * @param string $template_type wp_template or wp_template_part.
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
	 * @param WP_Block_Template[]|null $block_templates Return an array of block templates to short-circuit the default query,
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

	$ids      = get_theme_mod( $template_type, array() );
	$post__in = 'post__in';

	$post_type     = isset( $query['post_type'] ) ? $query['post_type'] : '';
	$wp_query_args = array(
		'post_status'    => array( 'auto-draft', 'draft', 'publish' ),
		'post_type'      => $template_type,
		'posts_per_page' => -1,
		'no_found_rows'  => true,
		$post__in        => array_values( $ids ),
	);

	if ( 'wp_template_part' === $template_type && isset( $query['area'] ) ) {
		$wp_query_args['tax_query']             = array();
		$wp_query_args['tax_query'][]           = array(
			'taxonomy' => 'wp_template_part_area',
			'field'    => 'name',
			'terms'    => $query['area'],
		);
		$wp_query_args['tax_query']['relation'] = 'AND';
	}

	if ( isset( $query['slug__in'] ) ) {
		$wp_query_args['post__in'] = array();
		foreach ( $query['slug__in'] as $slug ) {
			if ( ! empty( $ids[ $slug ] ) ) {
				$wp_query_args['post__in'][] = $ids[ $slug ];
			}
		}
	}

	// This is only needed for the regular templates/template parts CPT listing and editor.
	if ( isset( $query['wp_id'] ) ) {
		$wp_query_args['p'] = $query['wp_id'];
	} else {
		$wp_query_args['post_status'] = 'publish';
	}

	$query_result = array();

	// See https://core.trac.wordpress.org/ticket/28099 for context.
	if ( ! isset( $wp_query_args['post__in'] ) || array() !== $wp_query_args['post__in'] ) {
		$template_query = new WP_Query( $wp_query_args );
		foreach ( $template_query->posts as $post ) {
			$template = _gutenberg_build_template_result_from_post( $post );

			if ( is_wp_error( $template ) ) {
				continue;
			}

			if ( $post_type && ! $template->is_custom ) {
				continue;
			}

			$query_result[] = $template;
		}
	}

	if ( ! isset( $query['wp_id'] ) ) {
		$template_files = _gutenberg_get_template_files( $template_type );
		foreach ( $template_files as $template_file ) {
			$template = _gutenberg_build_template_result_from_file( $template_file, $template_type );

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
 * @param string $id            Template unique identifier (example: theme_slug//template_slug).
 * @param string $template_type wp_template or wp_template_part.
 *
 * @return WP_Block_Template|null Template.
 */
function gutenberg_get_block_template( $id, $template_type = 'wp_template' ) {
	/**
	 * Filters the block templates array before the query takes place.
	 *
	 * Return a non-null value to bypass the WordPress queries.
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

	$active = wp_get_theme()->get_stylesheet() === $theme;

	// Temporarily disable inactive access for 5.8 version.
	if ( ! $active ) {
		return null;
	}

	$ids = get_theme_mod( $template_type, array() );

	if ( ! empty( $ids[ $slug ] ) ) {
		$post = get_post( $ids[ $slug ] );
	}

	if ( $post && $template_type === $post->post_type ) {
		$template = _gutenberg_build_template_result_from_post( $post );

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
	 * Return a non-null value to bypass the WordPress queries.
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
