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
	if ( ! gutenberg_supports_block_templates() ) {
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
		'labels'                => $labels,
		'description'           => __( 'Template parts to include in your templates.', 'gutenberg' ),
		'public'                => false,
		'has_archive'           => false,
		'show_ui'               => true,
		'show_in_menu'          => 'themes.php',
		'show_in_admin_bar'     => false,
		'show_in_rest'          => true,
		'rest_base'             => 'template-parts',
		'rest_controller_class' => 'WP_REST_Templates_Controller',
		'map_meta_cap'          => true,
		'supports'              => array(
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
 * Registers the 'wp_template_part_area' taxonomy.
 */
function gutenberg_register_wp_template_part_area_taxonomy() {
	if ( ! gutenberg_supports_block_templates() ) {
		return;
	}

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

// Define constants for supported wp_template_part_area taxonomy.
if ( ! defined( 'WP_TEMPLATE_PART_AREA_HEADER' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_HEADER', 'header' );
}
if ( ! defined( 'WP_TEMPLATE_PART_AREA_FOOTER' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_FOOTER', 'footer' );
}
if ( ! defined( 'WP_TEMPLATE_PART_AREA_SIDEBAR' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_SIDEBAR', 'sidebar' );
}
if ( ! defined( 'WP_TEMPLATE_PART_AREA_UNCATEGORIZED' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_UNCATEGORIZED', 'uncategorized' );
}

/**
 * Fixes the label of the 'wp_template_part' admin menu entry.
 */
function gutenberg_fix_template_part_admin_menu_entry() {
	if ( ! gutenberg_supports_block_templates() ) {
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
 * Sets a custom slug when creating auto-draft template parts.
 * This is only needed for auto-drafts created by the regular WP editor.
 * If this page is to be removed, this won't be necessary.
 *
 * @param int $post_id Post ID.
 */
function set_unique_slug_on_create_template_part( $post_id ) {
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
add_action( 'save_post_wp_template_part', 'set_unique_slug_on_create_template_part' );

/**
 * Returns a filtered list of allowed area values for template parts.
 *
 * @return array The supported template part area values.
 */
function gutenberg_get_allowed_template_part_areas() {
	$default_area_definitions = array(
		array(
			'area'        => WP_TEMPLATE_PART_AREA_UNCATEGORIZED,
			'label'       => __( 'General', 'gutenberg' ),
			'description' => __(
				'General templates often perform a specific role like displaying post content, and are not tied to any particular area.',
				'gutenberg'
			),
			'icon'        => 'layout',
			'area_tag'    => 'div',
		),
		array(
			'area'        => WP_TEMPLATE_PART_AREA_HEADER,
			'label'       => __( 'Header', 'gutenberg' ),
			'description' => __(
				'The Header template defines a page area that typically contains a title, logo, and main navigation.',
				'gutenberg'
			),
			'icon'        => 'header',
			'area_tag'    => 'header',
		),
		array(
			'area'        => WP_TEMPLATE_PART_AREA_FOOTER,
			'label'       => __( 'Footer', 'gutenberg' ),
			'description' => __(
				'The Footer template defines a page area that typically contains site credits, social links, or any other combination of blocks.',
				'gutenberg'
			),
			'icon'        => 'footer',
			'area_tag'    => 'footer',
		),
	);

	/**
	 * Filters the list of allowed template part area values.
	 *
	 * @param array $default_areas An array of supported area objects.
	 */
	return apply_filters( 'default_wp_template_part_areas', $default_area_definitions );
}

/**
 * Checks whether the input 'area' is a supported value.
 * Returns the input if supported, otherwise returns the 'uncategorized' value.
 *
 * @param string $type Template part area name.
 *
 * @return string Input if supported, else the uncategorized value.
 */
function gutenberg_filter_template_part_area( $type ) {
	$allowed_areas = array_map(
		function ( $item ) {
			return $item['area'];
		},
		gutenberg_get_allowed_template_part_areas()
	);
	if ( in_array( $type, $allowed_areas, true ) ) {
		return $type;
	}

	/* translators: %1$s: Template area type, %2$s: the uncategorized template area value. */
	$warning_message = sprintf( __( '"%1$s" is not a supported wp_template_part area value and has been added as "%2$s".', 'gutenberg' ), $type, WP_TEMPLATE_PART_AREA_UNCATEGORIZED );
	trigger_error( $warning_message, E_USER_NOTICE );
	return WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
}

/**
 * Print a template-part.
 *
 * @param string $part The template-part to print. Use "header" or "footer".
 *
 * @return void
 */
function gutenberg_block_template_part( $part ) {
	$template_part = gutenberg_get_block_template( get_stylesheet() . '//' . $part, 'wp_template_part' );
	if ( ! $template_part || empty( $template_part->content ) ) {
		return;
	}
	echo do_blocks( $template_part->content );
}

/**
 * Print the header template-part.
 *
 * @return void
 */
function gutenberg_block_header_area() {
	gutenberg_block_template_part( 'header' );
}

/**
 * Print the footer template-part.
 *
 * @return void
 */
function gutenberg_block_footer_area() {
	gutenberg_block_template_part( 'footer' );
}
