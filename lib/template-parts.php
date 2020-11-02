<?php
/**
 * Block template part functions.
 *
 * @package gutenberg
 */

/**
 * Registers block editor 'wp_template_part' post type.
 */
function gutenberg_register_template_part_post_type() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	$labels = array(
		'name'                  => __( 'Template Parts', 'gutenberg' ),
		'singular_name'         => __( 'Template Part', 'gutenberg' ),
		'menu_name'             => _x( 'Template Parts', 'Admin Menu text', 'gutenberg' ),
		'add_new'               => _x( 'Add New', 'Template Part', 'gutenberg' ),
		'add_new_item'          => __( 'Add New Template Part', 'gutenberg' ),
		'new_item'              => __( 'New Template Part', 'gutenberg' ),
		'edit_item'             => __( 'Edit Template Part', 'gutenberg' ),
		'view_item'             => __( 'View Template Part', 'gutenberg' ),
		'all_items'             => __( 'All Template Parts', 'gutenberg' ),
		'search_items'          => __( 'Search Template Parts', 'gutenberg' ),
		'parent_item_colon'     => __( 'Parent Template Part:', 'gutenberg' ),
		'not_found'             => __( 'No template parts found.', 'gutenberg' ),
		'not_found_in_trash'    => __( 'No template parts found in Trash.', 'gutenberg' ),
		'archives'              => __( 'Template part archives', 'gutenberg' ),
		'insert_into_item'      => __( 'Insert into template part', 'gutenberg' ),
		'uploaded_to_this_item' => __( 'Uploaded to this template part', 'gutenberg' ),
		'filter_items_list'     => __( 'Filter template parts list', 'gutenberg' ),
		'items_list_navigation' => __( 'Template parts list navigation', 'gutenberg' ),
		'items_list'            => __( 'Template parts list', 'gutenberg' ),
	);

	$args = array(
		'labels'            => $labels,
		'description'       => __( 'Template parts to include in your templates.', 'gutenberg' ),
		'public'            => false,
		'has_archive'       => false,
		'show_ui'           => true,
		'show_in_menu'      => 'themes.php',
		'show_in_admin_bar' => false,
		'show_in_rest'      => true,
		'rest_base'         => 'template-parts',
		'map_meta_cap'      => true,
		'supports'          => array(
			'title',
			'slug',
			'editor',
			'revisions',
			'custom-fields',
		),
	);

	$meta_args = array(
		'object_subtype' => 'wp_template_part',
		'type'           => 'string',
		'description'    => 'The theme that provided the template part, if any.',
		'single'         => true,
		'show_in_rest'   => true,
	);

	register_post_type( 'wp_template_part', $args );
	register_meta( 'post', 'theme', $meta_args );
}
add_action( 'init', 'gutenberg_register_template_part_post_type' );

/**
 * Filters `wp_template_part` posts slug resolution to bypass deduplication logic as
 * template part slugs should be unique.
 *
 * @param string $slug          The resolved slug (post_name).
 * @param int    $post_ID       Post ID.
 * @param string $post_status   No uniqueness checks are made if the post is still draft or pending.
 * @param string $post_type     Post type.
 * @param int    $post_parent   Post parent ID.
 * @param int    $original_slug The desired slug (post_name).
 * @return string The original, desired slug.
 */
function gutenberg_filter_wp_template_part_wp_unique_post_slug( $slug, $post_ID, $post_status, $post_type, $post_parent, $original_slug ) {
	if ( 'wp_template_part' === $post_type ) {
		return $original_slug;
	}
	return $slug;
}
add_filter( 'wp_unique_post_slug', 'gutenberg_filter_wp_template_part_wp_unique_post_slug', 10, 6 );

/**
 * Fixes the label of the 'wp_template_part' admin menu entry.
 */
function gutenberg_fix_template_part_admin_menu_entry() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	global $submenu;
	if ( ! isset( $submenu['themes.php'] ) ) {
		return;
	}
	$post_type = get_post_type_object( 'wp_template_part' );
	if ( ! $post_type ) {
		return;
	}
	foreach ( $submenu['themes.php'] as $key => $submenu_entry ) {
		if ( $post_type->labels->all_items === $submenu['themes.php'][ $key ][0] ) {
			$submenu['themes.php'][ $key ][0] = $post_type->labels->menu_name; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
			break;
		}
	}
}
add_action( 'admin_menu', 'gutenberg_fix_template_part_admin_menu_entry' );

/**
 * Filters the 'wp_template_part' post type columns in the admin list table.
 *
 * @param array $columns Columns to display.
 * @return array Filtered $columns.
 */
function gutenberg_filter_template_part_list_table_columns( array $columns ) {
	$columns['slug'] = __( 'Slug', 'gutenberg' );
	if ( isset( $columns['date'] ) ) {
		unset( $columns['date'] );
	}
	return $columns;
}
add_filter( 'manage_wp_template_part_posts_columns', 'gutenberg_filter_template_part_list_table_columns' );

/**
 * Renders column content for the 'wp_template_part' post type list table.
 *
 * @param string $column_name Column name to render.
 * @param int    $post_id     Post ID.
 */
function gutenberg_render_template_part_list_table_column( $column_name, $post_id ) {
	if ( 'slug' !== $column_name ) {
		return;
	}
	$post = get_post( $post_id );
	echo esc_html( $post->post_name );
}
add_action( 'manage_wp_template_part_posts_custom_column', 'gutenberg_render_template_part_list_table_column', 10, 2 );


/**
 * Filter for adding a `resolved`, a `template`, and a `theme` parameter to `wp_template_part` queries.
 *
 * @param array $query_params The query parameters.
 * @return array Filtered $query_params.
 */
function filter_rest_wp_template_part_collection_params( $query_params ) {
	$query_params += array(
		'resolved' => array(
			'description' => __( 'Whether to filter for resolved template parts.', 'gutenberg' ),
			'type'        => 'boolean',
		),
		'template' => array(
			'description' => __( 'The template slug for the template that the template part is used by.', 'gutenberg' ),
			'type'        => 'string',
		),
		'theme'    => array(
			'description' => __( 'The theme slug for the theme that created the template part.', 'gutenberg' ),
			'type'        => 'string',
		),
	);
	return $query_params;
}
add_filter( 'rest_wp_template_part_collection_params', 'filter_rest_wp_template_part_collection_params', 99, 1 );

/**
 * Filter for supporting the `resolved`, `template`, and `theme` parameters in `wp_template_part` queries.
 *
 * @param array           $args    The query arguments.
 * @param WP_REST_Request $request The request object.
 * @return array Filtered $args.
 */
function filter_rest_wp_template_part_query( $args, $request ) {
	/**
	 * Unlike `filter_rest_wp_template_query`, we resolve queries also if there's only a `template` argument set.
	 * The difference is that in the case of templates, we can use the `slug` field that already exists (as part
	 * of the entities endpoint, wheras for template parts, we have to register the extra `template` argument),
	 * so we need the `resolved` flag to convey the different semantics (only return 'resolved' templates that match
	 * the `slug` vs return _all_ templates that match it (e.g. including all auto-drafts)).
	 *
	 * A template parts query with a `template` arg but not a `resolved` one is conceivable, but probably wouldn't be
	 * very useful: It'd be all template parts for all templates matching that `template` slug (including auto-drafts etc).
	 *
	 * @see filter_rest_wp_template_query
	 * @see filter_rest_wp_template_part_collection_params
	 * @see https://github.com/WordPress/gutenberg/pull/21878#discussion_r436961706
	 */
	if ( $request['resolved'] || $request['template'] ) {
		$template_part_ids = array( 0 ); // Return nothing by default (the 0 is needed for `post__in`).
		$template_types    = $request['template'] ? array( $request['template'] ) : get_template_types();

		foreach ( $template_types as $template_type ) {
			// Skip 'embed' for now because it is not a regular template type.
			if ( in_array( $template_type, array( 'embed' ), true ) ) {
				continue;
			}

			$current_template = gutenberg_find_template_post_and_parts( $template_type );
			if ( isset( $current_template ) ) {
				$template_part_ids = $template_part_ids + $current_template['template_part_ids'];
			}
		}
		$args['post__in']    = $template_part_ids;
		$args['post_status'] = array( 'publish', 'auto-draft' );
	}

	if ( $request['theme'] ) {
		$meta_query   = isset( $args['meta_query'] ) ? $args['meta_query'] : array();
		$meta_query[] = array(
			'key'   => 'theme',
			'value' => $request['theme'],
		);

		// Ensure auto-drafts of all theme supplied template parts are created.
		if ( wp_get_theme()->stylesheet === $request['theme'] ) {
			/**
			 * Finds all nested template part file paths in a theme's directory.
			 *
			 * @param string $base_directory The theme's file path.
			 * @return array $path_list A list of paths to all template part files.
			 */
			function get_template_part_paths( $base_directory ) {
				$path_list = array();
				if ( file_exists( $base_directory . '/block-template-parts' ) ) {
					$nested_files      = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $base_directory . '/block-template-parts' ) );
					$nested_html_files = new RegexIterator( $nested_files, '/^.+\.html$/i', RecursiveRegexIterator::GET_MATCH );
					foreach ( $nested_html_files as $path => $file ) {
						$path_list[] = $path;
					}
				}
				return $path_list;
			}

			// Get file paths for all theme supplied template parts.
			$template_part_files = get_template_part_paths( get_stylesheet_directory() );
			if ( is_child_theme() ) {
				$template_part_files = array_merge( $template_part_files, get_template_part_paths( get_template_directory() ) );
			}
			// Build and save each template part.
			foreach ( $template_part_files as $template_part_file ) {
				$content = file_get_contents( $template_part_file );
				// Infer slug from filepath.
				$slug = substr(
					$template_part_file,
					// Starting position of slug.
					strpos( $template_part_file, 'block-template-parts/' ) + 21,
					// Subtract ending '.html'.
					-5
				);
				// Wrap content with the template part block, parse, and create auto-draft.
				$template_part_string = '<!-- wp:template-part {"slug":"' . $slug . '","theme":"' . wp_get_theme()->get( 'TextDomain' ) . '"} -->' . $content . '<!-- /wp:template-part -->';
				$template_part_block  = parse_blocks( $template_part_string )[0];
				create_auto_draft_for_template_part_block( $template_part_block );
			}
		};

		$args['meta_query'] = $meta_query;
	}

	return $args;
}
add_filter( 'rest_wp_template_part_query', 'filter_rest_wp_template_part_query', 99, 2 );
