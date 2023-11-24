<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.3.0 becomes the lowest
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
	if ( isset( $default_template_types['index'] ) ) {
		$default_template_types['index'] = array(
			'title'       => _x( 'Index', 'Template name', 'gutenberg' ),
			'description' => __(
				'Used as a fallback template for all pages when a more specific template is not defined.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['home'] ) ) {
		$default_template_types['home'] = array(
			'title'       => _x( 'Blog Home', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays the latest posts as either the site homepage or as the "Posts page" as defined under reading settings. If it exists, the Front Page template overrides this template when posts are shown on the homepage.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['front-page'] ) ) {
		$default_template_types['front-page'] = array(
			'title'       => _x( 'Front Page', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays your site's homepage, whether it is set to display latest posts or a static page. The Front Page template takes precedence over all templates.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['singular'] ) ) {
		$default_template_types['singular'] = array(
			'title'       => _x( 'Single Entries', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays any single entry, such as a post or a page. This template will serve as a fallback when a more specific template (e.g. Single Post, Page, or Attachment) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['single'] ) ) {
		$default_template_types['single'] = array(
			'title'       => _x( 'Single Posts', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays single posts on your website unless a custom template has been applied to that post or a dedicated template exists.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['page'] ) ) {
		$default_template_types['page'] = array(
			'title'       => _x( 'Pages', 'Template name', 'gutenberg' ),
			'description' => __( 'Display all static pages unless a custom template has been applied or a dedicated template exists.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['archive'] ) ) {
		$default_template_types['archive'] = array(
			'title'       => _x( 'All Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays any archive, including posts by a single author, category, tag, taxonomy, custom post type, and date. This template will serve as a fallback when more specific templates (e.g. Category or Tag) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['author'] ) ) {
		$default_template_types['author'] = array(
			'title'       => _x( 'Author Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays a single author's post archive. This template will serve as a fallback when a more a specific template (e.g. Author: Admin) cannot be found.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['category'] ) ) {
		$default_template_types['category'] = array(
			'title'       => _x( 'Category Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a post category archive. This template will serve as a fallback when more specific template (e.g. Category: Recipes) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['taxonomy'] ) ) {
		$default_template_types['taxonomy'] = array(
			'title'       => _x( 'Taxonomy', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a custom taxonomy archive. Like categories and tags, taxonomies have terms which you use to classify things. For example: a taxonomy named "Art" can have multiple terms, such as "Modern" and "18th Century." This template will serve as a fallback when a more specific template (e.g. Taxonomy: Art) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['date'] ) ) {
		$default_template_types['date'] = array(
			'title'       => _x( 'Date Archives', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays a post archive when a specific date is visited (e.g. example.com/2023/).', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['tag'] ) ) {
		$default_template_types['tag'] = array(
			'title'       => _x( 'Tag Archives', 'Template name', 'gutenberg' ),
			'description' => __(
				'Displays a post tag archive. This template will serve as a fallback when more specific template (e.g. Tag: Pizza) cannot be found.',
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['attachment'] ) ) {
		$default_template_types['attachment'] = array(
			'title'       => _x( 'Attachment Pages', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor views the dedicated page that exists for any media attachment.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['search'] ) ) {
		$default_template_types['search'] = array(
			'title'       => _x( 'Search Results', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor performs a search on your website.', 'gutenberg' ),
		);
	}
	if ( isset( $default_template_types['privacy-policy'] ) ) {
		$default_template_types['privacy-policy'] = array(
			'title'       => _x( 'Privacy Policy', 'Template name', 'gutenberg' ),
			'description' => __(
				"Displays your site's Privacy Policy page.",
				'gutenberg'
			),
		);
	}
	if ( isset( $default_template_types['404'] ) ) {
		$default_template_types['404'] = array(
			'title'       => _x( 'Page: 404', 'Template name', 'gutenberg' ),
			'description' => __( 'Displays when a visitor views a non-existent page, such as a dead link or a mistyped URL.', 'gutenberg' ),
		);
	}

	return $default_template_types;
}
add_filter( 'default_template_types', 'gutenberg_get_default_block_template_types', 10 );

function gutenberg_get_block_templates($query_result, $query, $template_type){

	if ( ! isset( $query['wp_id'] ) ) {
		/*
		 * If the query has found some use templates, those have priority
		 * over the theme-provided ones, so we skip querying and building them.
		 */
		$query['slug__not_in'] = wp_list_pluck( $query_result, 'slug' );
		$template_files        = gutenberg_get_block_templates_files( $template_type, $query );
		foreach ( $template_files as $template_file ) {
			$query_result[] = _build_block_template_result_from_file( $template_file, $template_type );
		}
	}

	return $query_result;

}

/**
 * Retrieves the template files from the theme.
 *
 * @since 5.9.0
 * @since 6.3.0 Added the `$query` parameter.
 * @access private
 *
 * @param string $template_type 'wp_template' or 'wp_template_part'.
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
function gutenberg_get_block_templates_files( $template_type, $query = array() ) {
	if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
		return null;
	}

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
				/*$candidate = _add_block_template_part_area_info( $new_template_item );
				if ( ! isset( $area ) || ( isset( $area ) && $area === $candidate['area'] ) ) {
					$template_files[ $template_slug ] = $candidate;
				}*/
				$default_headers = array(
					'title' => 'Title',
					'area'  => 'Area',
				);
				$metadata = get_file_data( $template_file, $default_headers );
				if ( ! empty( $metadata['title'] ) ) {
					$candidate[ 'title' ] = translate_with_gettext_context( $metadata['title'], 'Template part title', $theme_slug );
				}
				if ( ! empty( $metadata['area'] ) ) {
					$candidate['area'] = $metadata['area'];
				}
				$template_files[ $template_slug ] = $candidate;
			}

			if ( 'wp_template' === $template_type ) {
				$candidate = _add_block_template_info( $new_template_item );
				if (
					! $post_type ||
					( $post_type && isset( $candidate['postTypes'] ) && in_array( $post_type, $candidate['postTypes'], true ) )
				) {
					$template_files[ $template_slug ] = $candidate;
				}
			}
		}
	}

	return array_values( $template_files );

}

add_filter( 'get_block_templates', 'gutenberg_get_block_templates', 10, 3 );