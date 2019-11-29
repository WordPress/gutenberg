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
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-full-site-editing' ) ) {
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
		'map_meta_cap'      => true,
		'supports'          => array(
			'title',
			'slug',
			'editor',
			'revisions',
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
 * Fixes the label of the 'wp_template_part' admin menu entry.
 */
function gutenberg_fix_template_part_admin_menu_entry() {
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
