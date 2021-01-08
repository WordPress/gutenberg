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
 * @param array  $template_type wp_template or wp_template_part.
 * @param string $slug template slug.
 *
 * @return array Template.
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
			return array(
				'slug'  => $slug,
				'path'  => $file_path,
				'theme' => $theme_slug,
				'type'  => $template_type,
			);
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
 * @param array $template_type wp_template or wp_template_part.
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
			$template_files[] = array(
				'slug'  => $template_slug,
				'path'  => $template_file,
				'theme' => $theme_slug,
				'type'  => $template_type,
			);
		}
	}

	return $template_files;
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

	$theme               = wp_get_theme()->get_stylesheet();
	$template            = new WP_Block_Template();
	$template->id        = $theme . '//' . $template_file['slug'];
	$template->theme     = $theme;
	$template->content   = file_get_contents( $template_file['path'] );
	$template->slug      = $template_file['slug'];
	$template->is_custom = false;
	$template->type      = $template_type;
	$template->title     = $template_file['slug'];
	$template->status    = 'publish';

	if ( 'wp_template' === $template_type && isset( $default_template_types[ $template_file['slug'] ] ) ) {
		$template->description = $default_template_types[ $template_file['slug'] ]['description'];
		$template->title       = $default_template_types[ $template_file['slug'] ]['title'];
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

	$theme = $terms[0]->name;

	$template              = new WP_Block_Template();
	$template->wp_id       = $post->ID;
	$template->id          = $theme . '//' . $post->post_name;
	$template->theme       = $theme;
	$template->content     = $post->post_content;
	$template->slug        = $post->post_name;
	$template->is_custom   = true;
	$template->type        = $post->post_type;
	$template->description = $post->post_excerpt;
	$template->title       = $post->post_title;
	$template->status      = $post->post_status;

	return $template;
}

/**
 * Retrieves a list of unified template objects based on a query.
 *
 * @param array $query {
 *     Optional. Arguments to retrieve templates.
 *
 *     @type array  $slug__in List of slugs to include.
 *     @type int    $wp_id Post ID of customized template.
 * }
 * @param array $template_type wp_template or wp_template_part.
 *
 * @return array Templates.
 */
function gutenberg_get_block_templates( $query = array(), $template_type = 'wp_template' ) {
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
	foreach ( $template_query->get_posts() as $post ) {
		$template = _gutenberg_build_template_result_from_post( $post );

		if ( ! is_wp_error( $template ) ) {
			$query_result[] = $template;
		}
	}

	if ( ! isset( $query['wp_id'] ) ) {
		$template_files = _gutenberg_get_template_files( $template_type );
		foreach ( $template_files as $template_file ) {
			$is_custom      = array_search(
				wp_get_theme()->get_stylesheet() . '//' . $template_file['slug'],
				array_column( $query_result, 'id' ),
				true
			);
			$should_include = false === $is_custom && (
				! isset( $query['slug__in'] ) || in_array( $template_file['slug'], $query['slug__in'], true )
			);
			if ( $should_include ) {
				$query_result[] = _gutenberg_build_template_result_from_file( $template_file, $template_type );
			}
		}
	}

	return $query_result;
}

/**
 * Retrieves a single unified template object using its id.
 *
 * @param string $id Template unique identifier (example: theme|slug).
 * @param array  $template_type wp_template or wp_template_part.
 *
 * @return WP_Block_Template|null Template.
 */
function gutenberg_get_block_template( $id, $template_type = 'wp_template' ) {
	$parts = explode( '//', $id, 2 );
	if ( count( $parts ) < 2 ) {
		return null;
	}
	list( $theme, $slug ) = $parts;
	$wp_query_args        = array(
		'name'           => $slug,
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
	$posts                = $template_query->get_posts();

	if ( count( $posts ) > 0 ) {
		$template = _gutenberg_build_template_result_from_post( $posts[0] );

		if ( ! is_wp_error( $template ) ) {
			return $template;
		}
	}

	if ( wp_get_theme()->get_stylesheet() === $theme ) {
		$template_file = _gutenberg_get_template_file( $template_type, $slug );
		if ( null !== $template_file ) {
			return _gutenberg_build_template_result_from_file( $template_file, $template_type );
		}
	}

	return null;
}

/**
 * Generates a unique slug for templates or template parts.
 *
 * @param string $slug          The resolved slug (post_name).
 * @param int    $post_ID       Post ID.
 * @param string $post_status   No uniqueness checks are made if the post is still draft or pending.
 * @param string $post_type     Post type.
 * @return string The original, desired slug.
 */
function gutenberg_filter_wp_template_unique_post_slug( $slug, $post_ID, $post_status, $post_type ) {
	if ( 'wp_template' !== $post_type || 'wp_template_part' !== $post_type ) {
		return $slug;
	}

	// Template slugs must be unique within the same theme.
	$theme = get_the_terms( $post_ID, 'wp_theme' )[0]->slug;

	$check_query_args = array(
		'post_name'      => $slug,
		'post_type'      => $post_type,
		'posts_per_page' => 1,
		'post__not_in'   => $post_ID,
		'tax_query'      => array(
			'taxonomy' => 'wp_theme',
			'field'    => 'name',
			'terms'    => $theme,
		),
		'no_found_rows'  => true,
	);
	$check_query      = new WP_Query( $check_query_args );
	$posts            = $check_query->get_posts();

	if ( count( $posts ) > 0 ) {
		$suffix = 2;
		do {
			$query_args              = $check_query_args;
			$alt_post_name           = _truncate_post_slug( $slug, 200 - ( strlen( $suffix ) + 1 ) ) . "-$suffix";
			$query_args['post_name'] = $alt_post_name;
			$query                   = new WP_Query( $check_query_args );
			$suffix++;
		} while ( count( $query->get_posts() ) > 0 );
		$slug = $alt_post_name;
	}

	return $slug;
}
add_filter( 'wp_unique_post_slug', 'gutenberg_filter_wp_template_unique_post_slug', 10, 4 );
