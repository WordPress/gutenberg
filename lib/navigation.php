<?php
/**
 * Functions used in making nav menus interopable with block editors.
 *
 * @package gutenberg
 */

/**
 * Registers block editor 'wp_navigation' post type.
 */
function gutenberg_register_navigation_post_type() {
	$labels = array(
		'name'                  => __( 'Navigation Menus', 'gutenberg' ),
		'singular_name'         => __( 'Navigation Menu', 'gutenberg' ),
		'menu_name'             => _x( 'Navigation Menus', 'Admin Menu text', 'gutenberg' ),
		'add_new'               => _x( 'Add New', 'Navigation Menu', 'gutenberg' ),
		'add_new_item'          => __( 'Add New Navigation Menu', 'gutenberg' ),
		'new_item'              => __( 'New Navigation Menu', 'gutenberg' ),
		'edit_item'             => __( 'Edit Navigation Menu', 'gutenberg' ),
		'view_item'             => __( 'View Navigation Menu', 'gutenberg' ),
		'all_items'             => __( 'All Navigation Menus', 'gutenberg' ),
		'search_items'          => __( 'Search Navigation Menus', 'gutenberg' ),
		'parent_item_colon'     => __( 'Parent Navigation Menu:', 'gutenberg' ),
		'not_found'             => __( 'No Navigation Menu found.', 'gutenberg' ),
		'not_found_in_trash'    => __( 'No Navigation Menu found in Trash.', 'gutenberg' ),
		'archives'              => __( 'Navigation Menu archives', 'gutenberg' ),
		'insert_into_item'      => __( 'Insert into Navigation Menu', 'gutenberg' ),
		'uploaded_to_this_item' => __( 'Uploaded to this Navigation Menu', 'gutenberg' ),
		// Some of these are a bit weird, what are they for?
		'filter_items_list'     => __( 'Filter Navigation Menu list', 'gutenberg' ),
		'items_list_navigation' => __( 'Navigation Menus list navigation', 'gutenberg' ),
		'items_list'            => __( 'Navigation Menus list', 'gutenberg' ),
	);

	$args = array(
		'labels'                => $labels,
		'description'           => __( 'Navigation menus.', 'gutenberg' ),
		'public'                => false,
		'has_archive'           => false,
		// We should disable UI for non-block themes.
		'show_ui'               => wp_is_block_theme(),
		'show_in_menu'          => false,
		'show_in_admin_bar'     => false,
		'show_in_rest'          => true,
		'map_meta_cap'          => true,
		'rest_base'             => 'navigation',
		'rest_controller_class' => WP_REST_Posts_Controller::class,
		'supports'              => array(
			'title',
			'editor',
			'revisions',
		),
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
		),
	);

	register_post_type( 'wp_navigation', $args );
}
add_action( 'init', 'gutenberg_register_navigation_post_type' );

/**
 * Disable "Post Attributes" for wp_navigation post type.
 *
 * The attributes are also conditionally enabled when a site has custom templates.
 * Block Theme templates can be available for every post type.
 */
add_filter( 'theme_wp_navigation_templates', '__return_empty_array' );

/**
 * Disable block editor for wp_navigation type posts so they can be managed via the UI.
 *
 * @param bool   $value Whether the CPT supports block editor or not.
 * @param string $post_type Post type.
 *
 * @return bool
 */
function gutenberg_disable_block_editor_for_navigation_post_type( $value, $post_type ) {
	if ( 'wp_navigation' === $post_type ) {
		return false;
	}

	return $value;
}

add_filter( 'use_block_editor_for_post_type', 'gutenberg_disable_block_editor_for_navigation_post_type', 10, 2 );

/**
 * This callback disables the content editor for wp_navigation type posts.
 * Content editor cannot handle wp_navigation type posts correctly.
 * We cannot disable the "editor" feature in the wp_navigation's CPT definition
 * because it disables the ability to save navigation blocks via REST API.
 *
 * @param WP_Post $post An instance of WP_Post class.
 */
function gutenberg_disable_content_editor_for_navigation_post_type( $post ) {
	$post_type = get_post_type( $post );
	if ( 'wp_navigation' !== $post_type ) {
		return;
	}

	remove_post_type_support( $post_type, 'editor' );
}

add_action( 'edit_form_after_title', 'gutenberg_disable_content_editor_for_navigation_post_type', 10, 1 );

/**
 * This callback enables content editor for wp_navigation type posts.
 * We need to enable it back because we disable it to hide
 * the content editor for wp_navigation type posts.
 *
 * @see gutenberg_disable_content_editor_for_navigation_post_type
 *
 * @param WP_Post $post An instance of WP_Post class.
 */
function gutenberg_enable_content_editor_for_navigation_post_type( $post ) {
	$post_type = get_post_type( $post );
	if ( 'wp_navigation' !== $post_type ) {
		return;
	}

	add_post_type_support( $post_type, 'editor' );
}

add_action( 'edit_form_after_editor', 'gutenberg_enable_content_editor_for_navigation_post_type', 10, 1 );

/**
 * Rename the menu title from "All Navigation Menus" to "Navigation Menus".
 */
function gutenberg_rename_navigation_post_type_admin_menu_entry() {
	global $submenu;
	if ( ! isset( $submenu['themes.php'] ) ) {
		return;
	}

	$post_type = get_post_type_object( 'wp_navigation' );
	if ( ! $post_type ) {
		return;
	}

	$menu_title_index = 0;
	foreach ( $submenu['themes.php'] as $key => $menu_item ) {
		if ( $post_type->labels->all_items === $menu_item[ $menu_title_index ] ) {
			$submenu['themes.php'][ $key ][ $menu_title_index ] = $post_type->labels->menu_name; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
			return;
		}
	}
}

add_action( 'admin_menu', 'gutenberg_rename_navigation_post_type_admin_menu_entry' );

/**
 * Registers the navigation areas supported by the current theme. The expected
 * shape of the argument is:
 * array(
 *     'primary'   => 'Primary',
 *     'secondary' => 'Secondary',
 *     'tertiary'  => 'Tertiary',
 * )
 *
 * @param array $new_areas Supported navigation areas.
 */
function gutenberg_register_navigation_areas( $new_areas ) {
	global $gutenberg_navigation_areas;
	$gutenberg_navigation_areas = $new_areas;
}

// Register the default navigation areas.
gutenberg_register_navigation_areas(
	array(
		'primary'   => 'Primary',
		'secondary' => 'Secondary',
		'tertiary'  => 'Tertiary',
	)
);

/**
 * Returns the available navigation areas.
 *
 * @return array Registered navigation areas.
 */
function gutenberg_get_navigation_areas() {
	global $gutenberg_navigation_areas;
	return $gutenberg_navigation_areas;
}

/**
 * Retrieves navigation areas.
 *
 * @return array Navigation areas.
 */
function gutenberg_get_navigation_areas_menus() {
	$areas = get_option( 'wp_navigation_areas', array() );
	if ( ! $areas ) {
		// Original key used `fse` prefix but Core options should use `wp`.
		// We fallback to the legacy option to catch sites with values in the
		// original location.
		$legacy_option_key = 'fse_navigation_areas';
		$areas             = get_option( $legacy_option_key, array() );
	}
	return $areas;
}

/**
 * Shim that hides ability to edit visibility and status for wp_navigation type posts.
 * When merged to Core, the CSS below should be moved to wp-admin/css/edit.css.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/54407
 *
 * @param string $hook The current admin page.
 */
function gutenberg_hide_visibility_and_status_for_navigation_posts( $hook ) {
	$allowed_hooks = array( 'post.php', 'post-new.php' );
	if ( ! in_array( $hook, $allowed_hooks, true ) ) {
		return;
	}

	/**
	 * HACK: We're hiding the description field using CSS because this
	 * cannot be done using a filter or an action.
	 */

	$css = <<<CSS
			body.post-type-wp_navigation div#minor-publishing {
				display: none;
			}
CSS;

	wp_add_inline_style( 'common', $css );
}

add_action( 'admin_enqueue_scripts', 'gutenberg_hide_visibility_and_status_for_navigation_posts' );
