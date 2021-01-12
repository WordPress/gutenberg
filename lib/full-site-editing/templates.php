<?php
/**
 * Block template functions.
 *
 * @package gutenberg
 */

/**
 * Returns all block template file path of the current theme and its parent theme.
 * Includes demo block template files if demo experiment is enabled.
 *
 * @return array $block_template_files A list of paths to all template files.
 */
function gutenberg_get_template_paths() {
	$block_template_files = glob( get_stylesheet_directory() . '/block-templates/*.html' );
	$block_template_files = is_array( $block_template_files ) ? $block_template_files : array();

	if ( is_child_theme() ) {
		$child_block_template_files = glob( get_template_directory() . '/block-templates/*.html' );
		$child_block_template_files = is_array( $child_block_template_files ) ? $child_block_template_files : array();
		$block_template_files       = array_merge( $block_template_files, $child_block_template_files );
	}

	return $block_template_files;
}

/**
 * Registers block editor 'wp_template' post type.
 */
function gutenberg_register_template_post_type() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	$labels = array(
		'name'                  => __( 'Templates', 'gutenberg' ),
		'singular_name'         => __( 'Template', 'gutenberg' ),
		'menu_name'             => _x( 'Templates', 'Admin Menu text', 'gutenberg' ),
		'add_new'               => _x( 'Add New', 'Template', 'gutenberg' ),
		'add_new_item'          => __( 'Add New Template', 'gutenberg' ),
		'new_item'              => __( 'New Template', 'gutenberg' ),
		'edit_item'             => __( 'Edit Template', 'gutenberg' ),
		'view_item'             => __( 'View Template', 'gutenberg' ),
		'all_items'             => __( 'All Templates', 'gutenberg' ),
		'search_items'          => __( 'Search Templates', 'gutenberg' ),
		'parent_item_colon'     => __( 'Parent Template:', 'gutenberg' ),
		'not_found'             => __( 'No templates found.', 'gutenberg' ),
		'not_found_in_trash'    => __( 'No templates found in Trash.', 'gutenberg' ),
		'archives'              => __( 'Template archives', 'gutenberg' ),
		'insert_into_item'      => __( 'Insert into template', 'gutenberg' ),
		'uploaded_to_this_item' => __( 'Uploaded to this template', 'gutenberg' ),
		'filter_items_list'     => __( 'Filter templates list', 'gutenberg' ),
		'items_list_navigation' => __( 'Templates list navigation', 'gutenberg' ),
		'items_list'            => __( 'Templates list', 'gutenberg' ),
	);

	$args = array(
		'labels'                => $labels,
		'description'           => __( 'Templates to include in your theme.', 'gutenberg' ),
		'public'                => false,
		'has_archive'           => false,
		'show_ui'               => true,
		'show_in_menu'          => 'themes.php',
		'show_in_admin_bar'     => false,
		'show_in_rest'          => true,
		'rest_base'             => 'templates',
		'rest_controller_class' => 'WP_REST_Templates_Controller',
		'capability_type'       => array( 'template', 'templates' ),
		'map_meta_cap'          => true,
		'supports'              => array(
			'title',
			'slug',
			'excerpt',
			'editor',
			'revisions',
		),
	);

	register_post_type( 'wp_template', $args );
}
add_action( 'init', 'gutenberg_register_template_post_type' );

/**
 * Registers block editor 'wp_theme' taxonomy.
 */
function gutenberg_register_wp_theme_taxonomy() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	register_taxonomy(
		'wp_theme',
		array( 'wp_template', 'wp_template_part' ),
		array(
			'public'            => false,
			'hierarchical'      => false,
			'labels'            => array(
				'name'          => __( 'Themes', 'gutenberg' ),
				'singular_name' => __( 'Theme', 'gutenberg' ),
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
add_action( 'init', 'gutenberg_register_wp_theme_taxonomy' );

/**
 * Automatically set the theme meta for templates.
 *
 * @param array $post_id Template ID.
 */
function gutenberg_set_template_and_template_part_post_theme( $post_id ) {
	$themes = wp_get_post_terms( $post_id, 'wp_theme' );
	if ( ! $themes ) {
		wp_set_post_terms( $post_id, array( wp_get_theme()->get_stylesheet() ), 'wp_theme', true );
	}
}
add_action( 'save_post_wp_template', 'gutenberg_set_template_and_template_part_post_theme', 10, 3 );
add_action( 'save_post_wp_template_part', 'gutenberg_set_template_and_template_part_post_theme', 10, 3 );

/**
 * Gets the fallback templates for a given template type.
 *
 * @param string $type The template type.
 * @return array Fallback templates
 */
function gutenberg_get_fallback_templates( $type ) {
	$all = array(
		'archive' => 'index',
		'archive-$posttype' => 'archive',
		'attachment' => 'single',
		'author' => 'archive',
		'author-$id' => 'author',
		'author-$nicename' => 'author-$id',
		'category' => 'archive',
		'category-$id' => 'category',
		'category-$slug' => 'category-$id',
		'date' => 'archive',
		'home' => 'index',
		'$mimetype' => 'attachment',
		'$mimetype-$subtype' => '$subtype',
		'page' => 'singular',
		'page-$id' => 'page',
		'page-$slug' => 'page-$id',
		'search' => 'index',
		'single' => 'singular',
		'singular' => 'index',
		'single-post' => 'single',
		'single-$posttype' => 'single',
		'single-$posttype-$slug' => 'single-$posttype',
		'$subtype' => '$mimetype',
		'tag' => 'archive',
		'tag-$id' => 'tag',
		'tag-$slug' => 'tag-$id',
		'taxonomy' => 'archive',
		'taxonomy-$taxonomy' => 'taxonomy',
		'taxonomy-$taxonomy-$term' => 'taxonomy-$taxonomy',
		'404' => 'index'
	);

	$hierarchy = array();

	do {
		$hierarchy[] = $type;
	}
	while ( isset( $all[ $type ] ) && ( $type = $all[ $type ] ) );

	return $hierarchy;
}

/**
 * Filters the capabilities of a user to conditionally grant them capabilities for managing 'wp_template' posts.
 *
 * Any user who can 'edit_theme_options' will have access.
 *
 * @param array $caps The capabilities being mapped to.
 * @param string $cap The capability to be mapped.
 * @param int|WP_User $user The user being queried.
 * @param array $args Additional arguments.
 * @return array Filtered $caps.
 */
function gutenberg_grant_template_caps( $caps, $cap, $user, $args ) {
	foreach ( $caps as &$capability ) {
		if ( in_array( $capability, array(
			'edit_templates',
			'edit_others_templates',
			'edit_published_templates',
			'edit_private_templates',
			'delete_templates',
			'delete_others_templates',
			'delete_published_templates',
			'delete_private_templates',
			'publish_templates',
			'read_private_templates'
		) ) ) {
			$type = isset( $args[0] ) && ( $post = get_post( $args[0] ) ) && !empty( $post->post_name ) ? $post->post_name : 'index';
			$capability = str_replace( 'templates', $type . '_templates', $capability );
		}

		$pattern = '/^(?>(edit(_(others|published|private))?|delete(_(others|published|private))?|publish|read_private)_)(.+)_templates$/';
		if ( ( $type = preg_filter( $pattern, '$6', $capability ) ) ) {

			$hierarchy = array_reverse( array_slice( gutenberg_get_fallback_templates( $type ), 1 ) );

			if ( empty( $hierarchy ) ) {
				if ( user_can( $user, 'edit_theme_options' ) ) {
					$capability = 'exist';
				} else {
					$capability = preg_replace( $pattern, '$1_templates', $capability );
				}
			} else {
				foreach ( $hierarchy as $next ) {
					if ( user_can( $user, str_replace( $type, $next, $capability ) ) ) {
						$capability = 'exist';
						break;
					}
				}
			}
		}
	}

	return $caps;	
}
// Hook to priority 9 to get ahead of plugins.
add_filter( 'map_meta_cap', 'gutenberg_grant_template_caps', 9, 4 );

/**
 * Prevents users losing edit access to templates when changing the slug
 *
 * @param array $data The post data to be saved.
 * @return array Filtered $data.
 */
function gutenberg_prevent_unauthorized_edits_to_templates( $data ) {
	if ( $data['post_type'] != 'wp_template' ) {
		return $data;
	}

	if ( $data['post_author'] != get_current_user_id() && !current_user_can( 'edit_others_' . $data['post_name'] . '_templates' ) ) {
		wp_die( 'You can\'t edit templates of this type.' );
	}

	if ( $data['post_status'] == 'publish' && !current_user_can( 'edit_published_' . $data['post_name'] . '_templates' ) ) {
		wp_die( 'You can\'t edit templates of this type.' );
	}

	if ( $data['post_status'] == 'private' && !current_user_can( 'edit_private_' . $data['post_name'] . '_templates' ) ) {
		wp_die( 'You can\'t edit templates of this type.' );
	}

	if ( !current_user_can( 'edit_' . $data['post_name'] . '_templates' ) ) {
		wp_die( 'You can\'t edit templates of this type.' );
	}

	return $data;
}
// Hook to priority 9 to get ahead of plugins.
add_filter( 'wp_insert_post_data', 'gutenberg_prevent_unauthorized_edits_to_templates' );

/**
 * Fixes the label of the 'wp_template' admin menu entry.
 */
function gutenberg_fix_template_admin_menu_entry() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}
	global $submenu;
	if ( ! isset( $submenu['themes.php'] ) ) {
		return;
	}
	$post_type = get_post_type_object( 'wp_template' );
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
add_action( 'admin_menu', 'gutenberg_fix_template_admin_menu_entry' );

// Customize the `wp_template` admin list.
add_filter( 'manage_wp_template_posts_columns', 'gutenberg_templates_lists_custom_columns' );
add_action( 'manage_wp_template_posts_custom_column', 'gutenberg_render_templates_lists_custom_column', 10, 2 );
add_filter( 'views_edit-wp_template', 'gutenberg_filter_templates_edit_views' );

/**
 * Sets a custom slug when creating auto-draft templates.
 * This is only needed for auto-drafts created by the regular WP editor.
 * If this page is to be removed, this won't be necessary.
 *
 * @param int $post_id Post ID.
 */
function set_unique_slug_on_create_template( $post_id ) {
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
add_action( 'save_post_wp_template', 'set_unique_slug_on_create_template' );
