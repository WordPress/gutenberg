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

/*
	Override Core get_block_templates using pre_get_block_templates filter.
*/
function gutenberg_get_block_templates( $query_result = null, $query = array(), $template_type = 'wp_template_part' ) {
	$post_type     = isset( $query['post_type'] ) ? $query['post_type'] : '';
	$wp_query_args = array(
		'post_status'         => array( 'auto-draft', 'draft', 'publish' ),
		'post_type'           => $post_type,
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

	if ( count($query_result) === 0  ) {
		print_r( 'query_result is empty' );
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
	print_r( 'total count: ' . count( $query_result ) );

	return $query_result;
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
	// return apply_filters( 'get_block_templates', $query_result, $query, $template_type );
}
// add_filter( 'get_block_templates', 'gutenberg_get_block_templates', 10, 2 );