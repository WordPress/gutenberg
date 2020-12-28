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
 * Build a unified template object based a theme file.
 *
 * @param array $template_file Theme file.
 * @param array $template_type wp_template or wp_template_part.
 *
 * @return stdClass Template.
 */
function _gutenberg_build_template_result_from_file( $template_file, $template_type ) {
	$default_template_types = gutenberg_get_default_template_types();

	$theme                 = wp_get_theme()->get_stylesheet();
	$template              = new stdClass();
	$template->id          = $theme . '|' . $template_file['slug'];
	$template->theme       = $theme;
	$template->content     = file_get_contents( $template_file['path'] );
	$template->slug        = $template_file['slug'];
	$template->is_custom   = false;
	$template->type        = $template_type;
	$template->description = '';
	$template->title       = $template_file['slug'];

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
 * @return stdClass Template.
 */
function _gutenberg_build_template_result_from_post( $post ) {
	// Is this the best way to get the theme of a template post?
	$theme = get_the_terms( $post, 'wp_theme' )[0]->slug;

	$template              = new stdClass();
	$template->wp_id       = $post->ID;
	$template->id          = $theme . '|' . $post->post_name;
	$template->theme       = $theme;
	$template->content     = $post->post_content;
	$template->slug        = $post->post_name;
	$template->is_custom   = true;
	$template->type        = $post->post_type;
	$template->description = $post->post_exerpt;
	$template->title       = $post->post_title;

	return $template;
}

/**
 * Retrieves a list of unified template objects based on a query.
 *
 * @param array $query Query.
 * @param array $template_type wp_template or wp_template_part.
 *
 * @return array Templates.
 */
function gutenberg_get_block_templates( $query = array(), $template_type = 'wp_template' ) {
	$wp_query_args = array(
		'post_type'      => $template_type,
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'no_found_rows'  => true,
	);

	if ( isset( $query['theme'] ) ) {
		$wp_query_args['tax_query'] = array(
			array(
				'taxonomy' => 'wp_theme',
				'field'    => 'slug',
				'terms'    => $query['theme'],
			),
		);
	}

	if ( isset( $query['slug__in'] ) ) {
		$wp_query_args['post_name__in'] = $query['slug__in'];
	}

	$template_query = new WP_Query( $wp_query_args );
	$query_result   = array();
	foreach ( $template_query->get_posts() as $post ) {
		$query_result[] = _gutenberg_build_template_result_from_post( $post );
	}

	if ( isset( $query['theme'] ) && wp_get_theme()->get_stylesheet() === $query['theme'] ) {
		$template_files = _gutenberg_get_template_files( $template_type );
		foreach ( $template_files as $template_file ) {
			$is_custom      = array_search(
				wp_get_theme()->get_stylesheet() . '/' . $template_file['slug'],
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
 * @param array $id Template id.
 * @param array $template_type wp_template or wp_template_part.
 *
 * @return stdClass|null Template.
 */
function gutenberg_get_block_template( $id, $template_type = 'wp_template' ) {
	list( $theme, $slug ) = explode( '|', $id );
	$wp_query_args        = array(
		'post_name'      => $slug,
		'post_type'      => $template_type,
		'post_status'    => 'publish',
		'posts_per_page' => 1,
		'no_found_rows'  => true,
		array(
			'taxonomy' => 'wp_theme',
			'field'    => 'slug',
			'terms'    => $theme,
		),
	);
	$template_query       = new WP_Query( $wp_query_args );
	$posts                = $template_query->get_posts();
	if ( count( $posts ) > 0 ) {
		return _gutenberg_build_template_result_from_post( $posts[0] );
	}

	if ( wp_get_theme()->get_stylesheet() === $theme ) {
		$template_files = _gutenberg_get_template_files( $template_type );
		foreach ( $template_files as $template_file ) {
			if ( $template_file['slug'] === $slug ) {
				return _gutenberg_build_template_result_from_file( $template_file, $template_type );
			}
		}
	}

	return null;
}
