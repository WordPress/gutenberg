<?php
/**
 * Block template functions.
 *
 * @package gutenberg
 */

/**
 * Registers block editor 'wp_template' post type.
 */
function gutenberg_register_template_post_type() {
	if (
		get_option( 'gutenberg-experiments' ) &&
		! array_key_exists( 'gutenberg-full-site-editing', get_option( 'gutenberg-experiments' ) )
	) {
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
		'labels'            => $labels,
		'description'       => __( 'Templates to include in your theme.', 'gutenberg' ),
		'public'            => false,
		'has_archive'       => false,
		'show_ui'           => true,
		'show_in_menu'      => 'themes.php',
		'show_in_admin_bar' => false,
		'show_in_rest'      => true,
		'rest_base'         => 'templates',
		'capability_type'   => array( 'template', 'templates' ),
		'map_meta_cap'      => true,
		'supports'          => array(
			'title',
			'editor',
			'revisions',
		),
	);

	register_post_type( 'wp_template', $args );
}
add_action( 'init', 'gutenberg_register_template_post_type' );

/**
 * Filters the capabilities of a user to conditionally grant them capabilities for managing 'wp_template' posts.
 *
 * Any user who can 'edit_theme_options' will have access.
 *
 * @param array $allcaps A user's capabilities.
 * @return array Filtered $allcaps.
 */
function gutenberg_grant_template_caps( array $allcaps ) {
	if ( isset( $allcaps['edit_theme_options'] ) ) {
		$allcaps['edit_templates']             = $allcaps['edit_theme_options'];
		$allcaps['edit_others_templates']      = $allcaps['edit_theme_options'];
		$allcaps['edit_published_templates']   = $allcaps['edit_theme_options'];
		$allcaps['edit_private_templates']     = $allcaps['edit_theme_options'];
		$allcaps['delete_templates']           = $allcaps['edit_theme_options'];
		$allcaps['delete_others_templates']    = $allcaps['edit_theme_options'];
		$allcaps['delete_published_templates'] = $allcaps['edit_theme_options'];
		$allcaps['delete_private_templates']   = $allcaps['edit_theme_options'];
		$allcaps['publish_templates']          = $allcaps['edit_theme_options'];
		$allcaps['read_private_templates']     = $allcaps['edit_theme_options'];
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'gutenberg_grant_template_caps' );
