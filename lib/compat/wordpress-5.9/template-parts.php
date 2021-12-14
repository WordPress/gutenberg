<?php
/**
 * Block template part functions.
 *
 * This is a temporary compatibility fix for WordPress 5.8.x, which is missing
 * some features for template parts that are present in 5.9.
 *
 * Once 5.9 is the minimum supported WordPress version for the Gutenberg
 * plugin, this shim can be removed.
 *
 * @package gutenberg
 */

// Only run any of the code in this file if the version is less than 5.9.
// wp_list_users was introduced in 5.9.
if ( ! function_exists( 'wp_list_users' ) ) {
	/**
	 * Registers block editor 'wp_template_part' post type.
	 */
	function gutenberg_register_template_part_post_type() {
		$labels = array(
			'name'                  => __( 'Template Parts', 'gutenberg' ),
			'singular_name'         => __( 'Template Part', 'gutenberg' ),
			'menu_name'             => _x( 'Template Parts', 'Admin Menu text', 'gutenberg' ),
			'add_new'               => _x( 'Add New', 'Template Part', 'gutenberg' ),
			'add_new_item'          => __( 'Add New Template Part', 'gutenberg' ),
			'new_item'              => __( 'New Template Part', 'gutenberg' ),
			'edit_item'             => __( 'Edit Template Part', 'gutenberg' ),
			'view_item'             => __( 'View Template Part', 'gutenberg' ),
			'view_items'            => __( 'View Template Parts', 'gutenberg' ),
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
			'labels'                => $labels,
			'description'           => __( 'Template parts to include in your templates.', 'gutenberg' ),
			'public'                => false,
			'has_archive'           => false,
			'show_ui'               => true,
			'show_in_menu'          => false,
			'show_in_admin_bar'     => false,
			'show_in_rest'          => true,
			'rest_base'             => 'template-parts',
			'rest_controller_class' => 'Gutenberg_REST_Templates_Controller',
			'map_meta_cap'          => true,
			'supports'              => array(
				'title',
				'slug',
				'excerpt',
				'editor',
				'revisions',
				'author',
			),
		);

		register_post_type( 'wp_template_part', $args );
	}
	add_action( 'init', 'gutenberg_register_template_part_post_type' );

	/**
	 * Registers the 'wp_template_part_area' taxonomy.
	 */
	function gutenberg_register_wp_template_part_area_taxonomy() {
		register_taxonomy(
			'wp_template_part_area',
			array( 'wp_template_part' ),
			array(
				'public'            => false,
				'hierarchical'      => false,
				'labels'            => array(
					'name'          => __( 'Template Part Areas', 'gutenberg' ),
					'singular_name' => __( 'Template Part Area', 'gutenberg' ),
				),
				'query_var'         => false,
				'rewrite'           => false,
				'show_ui'           => false,
				'_builtin'          => true,
				'show_in_nav_menus' => false,
				'show_in_rest'      => false,
			)
		);
	}
	add_action( 'init', 'gutenberg_register_wp_template_part_area_taxonomy' );

	/**
	 * Sets a custom slug when creating auto-draft template parts.
	 * This is only needed for auto-drafts created by the regular WP editor.
	 * If this page is to be removed, this won't be necessary.
	 *
	 * @param int $post_id Post ID.
	 */
	function gutenberg_set_unique_slug_on_create_template_part( $post_id ) {
		// This is the core function with the same functionality.
		if ( function_exists( 'wp_set_unique_slug_on_create_template_part' ) ) {
			return;
		}

		$post = get_post( $post_id );
		if ( 'auto-draft' !== $post->post_status ) {
			return;
		}

		if ( ! $post->post_name ) {
			wp_update_post(
				array(
					'ID'        => $post_id,
					'post_name' => 'custom_slug_' . uniqid(),
				)
			);
		}

		$terms = get_the_terms( $post_id, 'wp_theme' );
		if ( ! $terms || ! count( $terms ) ) {
			wp_set_post_terms( $post_id, wp_get_theme()->get_stylesheet(), 'wp_theme' );
		}
	}

	add_action( 'save_post_wp_template_part', 'gutenberg_set_unique_slug_on_create_template_part' );
}
