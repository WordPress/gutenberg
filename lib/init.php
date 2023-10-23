<?php
/**
 * Init hooks.
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_menu_page(
		'Gutenberg',
		'Gutenberg',
		'edit_posts',
		'gutenberg',
		'',
		'dashicons-edit'
	);

	add_submenu_page(
		'gutenberg',
		__( 'Demo', 'gutenberg' ),
		__( 'Demo', 'gutenberg' ),
		'edit_posts',
		'gutenberg'
	);

	if ( current_user_can( 'edit_posts' ) ) {
		add_submenu_page(
			'gutenberg',
			__( 'Support', 'gutenberg' ),
			__( 'Support', 'gutenberg' ),
			'edit_posts',
			__( 'https://wordpress.org/support/plugin/gutenberg/', 'gutenberg' )
		);
		add_submenu_page(
			'gutenberg',
			__( 'Documentation', 'gutenberg' ),
			__( 'Documentation', 'gutenberg' ),
			'edit_posts',
			'https://developer.wordpress.org/block-editor/'
		);
	}

	add_submenu_page(
		'gutenberg',
		__( 'Experiments Settings', 'gutenberg' ),
		__( 'Experiments', 'gutenberg' ),
		'edit_posts',
		'gutenberg-experiments',
		'the_gutenberg_experiments'
	);
}
add_action( 'admin_menu', 'gutenberg_menu', 9 );

// Register a custom post type.
function wp_navigation_overlay_post_type() {
	$navigation_post_edit_link = 'site-editor.php?' . build_query(
		array(
			'postId'   => '%s',
			'postType' => 'wp_nav_overlay',
			'canvas'   => 'edit',
		)
	);
	register_post_type(
		'wp_nav_overlay',
		array(
			'labels'                => array(
				'name'                  => _x( 'Navigation Overlay Overlays', 'post type general name' ),
				'singular_name'         => _x( 'Navigation Overlay', 'post type singular name' ),
				'add_new'               => __( 'Add New Navigation Overlay' ),
				'add_new_item'          => __( 'Add New Navigation Overlay' ),
				'new_item'              => __( 'New Navigation Overlay' ),
				'edit_item'             => __( 'Edit Navigation Overlay' ),
				'view_item'             => __( 'View Navigation Overlay' ),
				'all_items'             => __( 'Navigation Overlays' ),
				'search_items'          => __( 'Search Navigation Overlays' ),
				'parent_item_colon'     => __( 'Parent Navigation Overlay:' ),
				'not_found'             => __( 'No Navigation Overlay found.' ),
				'not_found_in_trash'    => __( 'No Navigation Overlay found in Trash.' ),
				'archives'              => __( 'Navigation Overlay archives' ),
				'insert_into_item'      => __( 'Insert into Navigation Overlay' ),
				'uploaded_to_this_item' => __( 'Uploaded to this Navigation Overlay' ),
				'filter_items_list'     => __( 'Filter Navigation Overlay list' ),
				'items_list_navigation' => __( 'Navigation Overlays list navigation' ),
				'items_list'            => __( 'Navigation Overlays list' ),
			),
			'description'           => __( 'Navigation menus that can be inserted into your site.' ),
			'public'                => false,
			'_builtin'              => true, /* internal use only. don't use this when registering your own post type. */
			'_edit_link'            => $navigation_post_edit_link, /* internal use only. don't use this when registering your own post type. */
			'has_archive'           => false,
			'show_ui'               => true,
			'show_in_menu'          => false,
			'show_in_admin_bar'     => false,
			'show_in_rest'          => true,
			'rewrite'               => false,
			'map_meta_cap'          => true,
			'capabilities'          => array(
				'edit_others_posts'      => 'edit_theme_options',
				'delete_posts'           => 'edit_theme_options',
				'publish_posts'          => 'edit_theme_options',
				'create_posts'           => 'edit_theme_options',
				'read_private_posts'     => 'edit_theme_options',
				'delete_private_posts'   => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
				'edit_private_posts'     => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
			),
			'rest_base'             => 'nav-overlay',
			'rest_controller_class' => 'WP_REST_Posts_Controller',
			'supports'              => array(
				'title',
				'editor',
				'revisions',
			),
		)
	);
}
add_action( 'init', 'wp_navigation_overlay_post_type', 0 );