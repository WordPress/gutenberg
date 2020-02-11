<?php
/**
 * Functions used in making widgets interopable with block editors.
 *
 * @package gutenberg
 */

/**
 * Checks if a screen containing the block editor is being loaded.
 *
 * @return boolean True if a screen containing the block editor is being loaded.
 */
function gutenberg_is_block_editor() {
	// If get_current_screen does not exist, we are neither in the standard block editor for posts, or the widget block editor.
	// We can safely return false.
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}
	$screen = get_current_screen();
	return ! empty( $screen ) &&
		(
			$screen->is_block_editor() ||
			'gutenberg_page_gutenberg-widgets' === $screen->id ||
			'gutenberg_page_gutenberg-edit-site' === $screen->id
		);
}

/**
 * Emulates the Widgets screen `admin_print_styles` when at the block editor
 * screen.
 */
function gutenberg_block_editor_admin_print_styles() {
	if ( gutenberg_is_block_editor() ) {
		/** This action is documented in wp-admin/admin-footer.php */
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_print_styles-widgets.php' );
	}
}
add_action( 'admin_print_styles', 'gutenberg_block_editor_admin_print_styles' );

/**
 * Emulates the Widgets screen `admin_print_scripts` when at the block editor
 * screen.
 */
function gutenberg_block_editor_admin_print_scripts() {
	if ( gutenberg_is_block_editor() ) {
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_print_scripts-widgets.php' );
	}
}
add_action( 'admin_print_scripts', 'gutenberg_block_editor_admin_print_scripts' );

/**
 * Emulates the Widgets screen `admin_print_footer_scripts` when at the block
 * editor screen.
 */
function gutenberg_block_editor_admin_print_footer_scripts() {
	if ( gutenberg_is_block_editor() ) {
		/** This action is documented in wp-admin/admin-footer.php */
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_print_footer_scripts-widgets.php' );
	}
}
add_action( 'admin_print_footer_scripts', 'gutenberg_block_editor_admin_print_footer_scripts' );

/**
 * Emulates the Widgets screen `admin_footer` when at the block editor screen.
 */
function gutenberg_block_editor_admin_footer() {
	if ( gutenberg_is_block_editor() ) {
		// The function wpWidgets.save needs this nonce to work as expected.
		echo implode(
			"\n",
			array(
				'<form method="post">',
				wp_nonce_field( 'save-sidebar-widgets', '_wpnonce_widgets', false ),
				'</form>',
			)
		);
		/** This action is documented in wp-admin/admin-footer.php */
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_footer-widgets.php' );
	}
}
add_action( 'admin_footer', 'gutenberg_block_editor_admin_footer' );


/**
 * Returns the settings required by legacy widgets blocks.
 *
 * @return array Legacy widget settings.
 */
function gutenberg_get_legacy_widget_settings() {
	$settings = array();
	/**
	 * TODO: The hardcoded array should be replaced with a mechanism to allow
	 * core and third party blocks to specify they already have equivalent
	 * blocks, and maybe even allow them to have a migration function.
	 */
	$core_widgets = array(
		'WP_Widget_Pages',
		'WP_Widget_Calendar',
		'WP_Widget_Archives',
		'WP_Widget_Media_Audio',
		'WP_Widget_Media_Image',
		'WP_Widget_Media_Gallery',
		'WP_Widget_Media_Video',
		'WP_Widget_Meta',
		'WP_Widget_Search',
		'WP_Widget_Text',
		'WP_Widget_Categories',
		'WP_Widget_Recent_Posts',
		'WP_Widget_Recent_Comments',
		'WP_Widget_RSS',
		'WP_Widget_Tag_Cloud',
		'WP_Nav_Menu_Widget',
		'WP_Widget_Custom_HTML',
	);

	$has_permissions_to_manage_widgets = current_user_can( 'edit_theme_options' );
	$available_legacy_widgets          = array();
	global $wp_widget_factory;
	if ( ! empty( $wp_widget_factory ) ) {
		foreach ( $wp_widget_factory->widgets as $class => $widget_obj ) {
			$available_legacy_widgets[ $class ] = array(
				'name'              => html_entity_decode( $widget_obj->name ),
				// wp_widget_description is not being used because its input parameter is a Widget Id.
				// Widgets id's reference to a specific widget instance.
				// Here we are iterating on all the available widget classes even if no widget instance exists for them.
				'description'       => isset( $widget_obj->widget_options['description'] ) ?
					html_entity_decode( $widget_obj->widget_options['description'] ) :
					null,
				'isReferenceWidget' => false,
				'isHidden'          => in_array( $class, $core_widgets, true ),
			);
		}
	}
	global $wp_registered_widgets;
	if ( ! empty( $wp_registered_widgets ) ) {
		foreach ( $wp_registered_widgets as $widget_id => $widget_obj ) {

			$block_widget_start = 'blocks-widget-';
			if (
				( is_array( $widget_obj['callback'] ) &&
				isset( $widget_obj['callback'][0] ) &&
				( $widget_obj['callback'][0] instanceof WP_Widget ) ) ||
				// $widget_id starts with $block_widget_start.
				strncmp( $widget_id, $block_widget_start, strlen( $block_widget_start ) ) === 0
			) {
				continue;
			}
			$available_legacy_widgets[ $widget_id ] = array(
				'name'              => html_entity_decode( $widget_obj['name'] ),
				'description'       => html_entity_decode( wp_widget_description( $widget_id ) ),
				'isReferenceWidget' => true,
			);
		}
	}

	$settings['hasPermissionsToManageWidgets'] = $has_permissions_to_manage_widgets;
	$settings['availableLegacyWidgets']        = $available_legacy_widgets;

	return gutenberg_experiments_editor_settings( $settings );
}

/**
 * Extends default editor settings with values supporting legacy widgets.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_legacy_widget_settings( $settings ) {
	return array_merge( $settings, gutenberg_get_legacy_widget_settings() );
}
add_filter( 'block_editor_settings', 'gutenberg_legacy_widget_settings' );

/**
 * Registers a wp_area post type.
 */
function gutenberg_create_wp_area_post_type() {
	register_post_type(
		'wp_area',
		array(
			'description'  => __( 'Experimental custom post type that will store block areas referenced by themes.', 'gutenberg' ),
			'labels'       => array(
				'name'                     => _x( 'Block Area (Experimental)', 'post type general name', 'gutenberg' ),
				'singular_name'            => _x( 'Block Area (Experimental)', 'post type singular name', 'gutenberg' ),
				'menu_name'                => _x( 'Block Areas', 'admin menu', 'gutenberg' ),
				'name_admin_bar'           => _x( 'Block Area', 'add new on admin bar', 'gutenberg' ),
				'add_new'                  => _x( 'Add New', 'Block', 'gutenberg' ),
				'add_new_item'             => __( 'Add New Block Area', 'gutenberg' ),
				'new_item'                 => __( 'New Block Area', 'gutenberg' ),
				'edit_item'                => __( 'Edit Block Area', 'gutenberg' ),
				'view_item'                => __( 'View Block Area', 'gutenberg' ),
				'all_items'                => __( 'All Block Areas', 'gutenberg' ),
				'search_items'             => __( 'Search Block Areas', 'gutenberg' ),
				'not_found'                => __( 'No block area found.', 'gutenberg' ),
				'not_found_in_trash'       => __( 'No block areas found in Trash.', 'gutenberg' ),
				'filter_items_list'        => __( 'Filter block areas list', 'gutenberg' ),
				'items_list_navigation'    => __( 'Block areas list navigation', 'gutenberg' ),
				'items_list'               => __( 'Block areas list', 'gutenberg' ),
				'item_published'           => __( 'Block area published.', 'gutenberg' ),
				'item_published_privately' => __( 'Block area published privately.', 'gutenberg' ),
				'item_reverted_to_draft'   => __( 'Block area reverted to draft.', 'gutenberg' ),
				'item_scheduled'           => __( 'Block area scheduled.', 'gutenberg' ),
				'item_updated'             => __( 'Block area updated.', 'gutenberg' ),
			),
			'public'       => false,
			'show_ui'      => false,
			'show_in_menu' => false,
			'show_in_rest' => true,
			'rest_base'    => '__experimental/block-areas',
			'capabilities' => array(
				'read'                   => 'edit_posts',
				'create_posts'           => 'edit_theme_options',
				'edit_posts'             => 'edit_theme_options',
				'edit_published_posts'   => 'edit_theme_options',
				'delete_published_posts' => 'edit_theme_options',
				'edit_others_posts'      => 'edit_theme_options',
				'delete_others_posts'    => 'edit_theme_options',
			),
			'map_meta_cap' => true,
			'supports'     => array(
				'title',
				'editor',
			),
		)
	);
}
add_action( 'init', 'gutenberg_create_wp_area_post_type' );

add_filter( 'sidebars_widgets', 'Experimental_WP_Widget_Blocks_Manager::swap_out_sidebars_blocks_for_block_widgets' );

/**
 * Function to enqueue admin-widgets as part of the block editor assets.
 */
function gutenberg_enqueue_widget_scripts() {
	wp_enqueue_script( 'admin-widgets' );
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_widget_scripts' );
