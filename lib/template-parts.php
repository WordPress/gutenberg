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
			'excerpt',
			'editor',
			'revisions',
		),
	);

	register_post_type( 'wp_template_part', $args );
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

// Customize the `wp_template` admin list.
add_filter( 'manage_wp_template_part_posts_columns', 'gutenberg_templates_lists_custom_columns' );
add_action( 'manage_wp_template_part_posts_custom_column', 'gutenberg_render_templates_lists_custom_column', 10, 2 );
add_filter( 'views_edit-wp_template_part', 'gutenberg_filter_templates_edit_views' );

/**
 * Filter for adding and a `theme` parameter to `wp_template_part` queries.
 *
 * @param array $query_params The query parameters.
 * @return array Filtered $query_params.
 */
function filter_rest_wp_template_part_collection_params( $query_params ) {
	$query_params += array(
		'theme' => array(
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
	if ( $request['theme'] ) {
		$tax_query   = isset( $args['tax_query'] ) ? $args['tax_query'] : array();
		$tax_query[] = array(
			'taxonomy' => 'wp_theme',
			'field'    => 'slug',
			'terms'    => $request['theme'],
		);

		$args['tax_query'] = $tax_query;
	}

	return $args;
}
add_filter( 'rest_wp_template_part_query', 'filter_rest_wp_template_part_query', 99, 2 );
