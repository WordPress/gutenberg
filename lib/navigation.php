<?php
/**
 * Functions used in making nav menus interopable with block editors.
 *
 * @package gutenberg
 */

/**
 * Shim that hooks into `wp_update_nav_menu_item` and makes it so that nav menu
 * items support a 'content' field. This field contains HTML and is used by nav
 * menu items with `type` set to `'block'`.
 *
 * Specifically, this shim makes it so that:
 *
 * 1) The `wp_update_nav_menu_item()` function supports setting
 * `'menu-item-content'` on a menu item. When merged to Core, this functionality
 * should exist in `wp_update_nav_menu_item()`.
 *
 * 2) Updating a menu via nav-menus.php supports setting `'menu-item-content'`
 * on a menu item. When merged to Core, this functionality should exist in
 * `wp_nav_menu_update_menu_items()`.
 *
 * 3) The `customize_save` ajax action supports setting `'content'` on a nav
 * menu item. When merged to Core, this functionality should exist in
 * `WP_Customize_Manager::save()`.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50544
 *
 * @param int   $menu_id         ID of the updated menu.
 * @param int   $menu_item_db_id ID of the new menu item.
 * @param array $args            An array of arguments used to update/add the menu item.
 */
function gutenberg_update_nav_menu_item_content( $menu_id, $menu_item_db_id, $args ) {
	global $wp_customize;

	// Support setting content in nav-menus.php by grabbing the value from
	// $_POST. This belongs in `wp_nav_menu_update_menu_items()`.
	if ( isset( $_POST['menu-item-content'][ $menu_item_db_id ] ) ) {
		$args['menu-item-content'] = wp_unslash( $_POST['menu-item-content'][ $menu_item_db_id ] );
	}

	// Support setting content in customize_save admin-ajax.php requests by
	// grabbing the unsanitized $_POST values. This belongs in
	// `WP_Customize_Manager::save()`.
	if ( isset( $wp_customize ) ) {
		$values = $wp_customize->unsanitized_post_values();
		if ( isset( $values[ "nav_menu_item[$menu_item_db_id]" ]['content'] ) ) {
			if ( is_string( $values[ "nav_menu_item[$menu_item_db_id]" ]['content'] ) ) {
				$args['menu-item-content'] = $values[ "nav_menu_item[$menu_item_db_id]" ]['content'];
			} elseif ( isset( $values[ "nav_menu_item[$menu_item_db_id]" ]['content']['raw'] ) ) {
				$args['menu-item-content'] = $values[ "nav_menu_item[$menu_item_db_id]" ]['content']['raw'];
			}
		}
	}

	// Everything else belongs in `wp_update_nav_menu_item()`.

	$defaults = array(
		'menu-item-content' => '',
	);

	$args = wp_parse_args( $args, $defaults );

	update_post_meta( $menu_item_db_id, '_menu_item_content', wp_slash( $args['menu-item-content'] ) );
}
add_action( 'wp_update_nav_menu_item', 'gutenberg_update_nav_menu_item_content', 10, 3 );

/**
 * Shim that hooks into `wp_setup_nav_menu_items` and makes it so that nav menu
 * items have a 'content' field. This field contains HTML and is used by nav
 * menu items with `type` set to `'block'`.
 *
 * Specifically, this shim makes it so that the `wp_setup_nav_menu_item()`
 * function sets `content` on the returned menu item. When merged to Core, this
 * functionality should exist in `wp_setup_nav_menu_item()`.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50544
 *
 * @param object $menu_item The menu item object.
 *
 * @return object Updated menu item object.
 */
function gutenberg_setup_block_nav_menu_item( $menu_item ) {
	if ( 'block' === $menu_item->type ) {
		$menu_item->type_label = __( 'Block', 'gutenberg' );
		$menu_item->content    = ! isset( $menu_item->content ) ? get_post_meta( $menu_item->db_id, '_menu_item_content', true ) : $menu_item->content;

		// Set to make the menu item display nicely in nav-menus.php.
		$menu_item->object = 'block';
		$menu_item->title  = __( 'Block', 'gutenberg' );
	}

	return $menu_item;
}
add_filter( 'wp_setup_nav_menu_item', 'gutenberg_setup_block_nav_menu_item' );

/**
 * Shim that hooks into `walker_nav_menu_start_el` and makes it so that the
 * default walker which renders a menu will correctly render the HTML associated
 * with any navigation menu item that has `type` set to `'block`'.
 *
 * Specifically, this shim makes it so that `Walker_Nav_Menu::start_el()`
 * renders the `content` of a nav menu item when its `type` is `'block'`. When
 * merged to Core, this functionality should exist in
 * `Walker_Nav_Menu::start_el()`.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50544
 *
 * @param string   $item_output The menu item's starting HTML output.
 * @param WP_Post  $item        Menu item data object.
 * @param int      $depth       Depth of menu item. Used for padding.
 * @param stdClass $args        An object of wp_nav_menu() arguments.
 *
 * @return string The menu item's updated HTML output.
 */
function gutenberg_output_block_nav_menu_item( $item_output, $item, $depth, $args ) {
	if ( 'block' === $item->type ) {
		$item_output = $args->before;
		/** This filter is documented in wp-includes/post-template.php */
		$item_output .= apply_filters( 'the_content', $item->content );
		$item_output .= $args->after;
	}

	return $item_output;
}
add_filter( 'walker_nav_menu_start_el', 'gutenberg_output_block_nav_menu_item', 10, 4 );

/**
 * Shim that prevents menu items with type `'block'` from being rendered in the
 * frontend when the theme does not support block menus.
 *
 * Specifically, this shim makes it so that `wp_nav_menu()` will remove any menu
 * items that have a `type` of `'block'` from `$sorted_menu_items`. When merged
 * to Core, this functionality should exist in `wp_nav_menu()`.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50544
 *
 * @param array $menu_items The menu items, sorted by each menu item's menu order.
 *
 * @return array Updated menu items, sorted by each menu item's menu order.
 */
function gutenberg_remove_block_nav_menu_items( $menu_items ) {
	// We should uncomment the line below when the block-nav-menus feature becomes stable.
	// @see https://github.com/WordPress/gutenberg/issues/34265.
	/*if ( current_theme_supports( 'block-nav-menus' ) ) {*/
	if ( false ) {
		return $menu_items;
	}

	return array_filter(
		$menu_items,
		function( $menu_item ) {
			return 'block' !== $menu_item->type;
		}
	);
}
add_filter( 'wp_nav_menu_objects', 'gutenberg_remove_block_nav_menu_items', 10 );

/**
 * Recursively converts a list of menu items into a list of blocks. This is a
 * helper function used by `gutenberg_output_block_nav_menu()`.
 *
 * Transformation depends on the menu item type. Link menu items are turned into
 * a `core/navigation-link` block. Block menu items are simply parsed.
 *
 * @param array $menu_items The menu items to convert, sorted by each menu item's menu order.
 * @param array $menu_items_by_parent_id All menu items, indexed by their parent's ID.

 * @return array Updated menu items, sorted by each menu item's menu order.
 */
function gutenberg_convert_menu_items_to_blocks(
	$menu_items,
	&$menu_items_by_parent_id
) {
	if ( empty( $menu_items ) ) {
		return array();
	}

	$blocks = array();

	foreach ( $menu_items as $menu_item ) {
		if ( 'block' === $menu_item->type ) {
			$parsed_blocks = parse_blocks( $menu_item->content );

			if ( count( $parsed_blocks ) ) {
				$block = $parsed_blocks[0];
			} else {
				$block = array(
					'blockName' => 'core/freeform',
					'attrs'     => array(
						'originalContent' => $menu_item->content,
					),
				);
			}
		} else {
			$block = array(
				'blockName' => 'core/navigation-link',
				'attrs'     => array(
					'label' => $menu_item->title,
					'url'   => $menu_item->url,
				),
			);
		}

		$block['innerBlocks'] = gutenberg_convert_menu_items_to_blocks(
			isset( $menu_items_by_parent_id[ $menu_item->ID ] )
					? $menu_items_by_parent_id[ $menu_item->ID ]
					: array(),
			$menu_items_by_parent_id
		);

		$blocks[] = $block;
	}

	return $blocks;
}

/**
 * Shim that causes `wp_nav_menu()` to output a Navigation block instead of a
 * nav menu when the theme supports block menus. The Navigation block is
 * constructed by transforming the stored tree of menu items into a tree of
 * blocks.
 *
 * Specifically, this shim makes it so that `wp_nav_menu()` returns early when
 * the theme supports block menus. When merged to Core, this functionality
 * should exist in `wp_nav_menu()` after `$sorted_menu_items` is set. The
 * duplicated code (marked using BEGIN and END) can be deleted.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50544
 *
 * @param string|null $output Nav menu output to short-circuit with. Default null.
 * @param stdClass    $args   An object containing wp_nav_menu() arguments.
 *
 * @return string|null Nav menu output to short-circuit with.
 */
function gutenberg_output_block_nav_menu( $output, $args ) {
	// We should uncomment the line below when the block-nav-menus feature becomes stable.
	// @see https://github.com/WordPress/gutenberg/issues/34265.
	/*if ( ! current_theme_supports( 'block-nav-menus' ) ) {*/
	if ( true ) {
		return null;
	}

	// BEGIN: Code that already exists in wp_nav_menu().

	// Get the nav menu based on the requested menu.
	$menu = wp_get_nav_menu_object( $args->menu );

	// Get the nav menu based on the theme_location.
	$locations = get_nav_menu_locations();
	if ( ! $menu && $args->theme_location && $locations && isset( $locations[ $args->theme_location ] ) ) {
		$menu = wp_get_nav_menu_object( $locations[ $args->theme_location ] );
	}

	// Get the first menu that has items if we still can't find a menu.
	if ( ! $menu && ! $args->theme_location ) {
		$menus = wp_get_nav_menus();
		foreach ( $menus as $menu_maybe ) {
			$menu_items = wp_get_nav_menu_items( $menu_maybe->term_id, array( 'update_post_term_cache' => false ) );
			if ( $menu_items ) {
				$menu = $menu_maybe;
				break;
			}
		}
	}

	if ( empty( $args->menu ) ) {
		$args->menu = $menu;
	}

	// If the menu exists, get its items.
	if ( $menu && ! is_wp_error( $menu ) && ! isset( $menu_items ) ) {
		$menu_items = wp_get_nav_menu_items( $menu->term_id, array( 'update_post_term_cache' => false ) );
	}

	// Set up the $menu_item variables.
	_wp_menu_item_classes_by_context( $menu_items );

	$sorted_menu_items = array();
	foreach ( (array) $menu_items as $menu_item ) {
		$sorted_menu_items[ $menu_item->menu_order ] = $menu_item;
	}

	unset( $menu_items, $menu_item );

	// END: Code that already exists in wp_nav_menu().

	$menu_items_by_parent_id = array();
	foreach ( $sorted_menu_items as $menu_item ) {
		$menu_items_by_parent_id[ $menu_item->menu_item_parent ][] = $menu_item;
	}

	$block_attributes = array();
	if ( isset( $args->block_attributes ) ) {
		$block_attributes = $args->block_attributes;
	}

	$navigation_block = array(
		'blockName'   => 'core/navigation',
		'attrs'       => $block_attributes,
		'innerBlocks' => gutenberg_convert_menu_items_to_blocks(
			isset( $menu_items_by_parent_id[0] )
				? $menu_items_by_parent_id[0]
				: array(),
			$menu_items_by_parent_id
		),
	);

	return render_block( $navigation_block );
}
add_filter( 'pre_wp_nav_menu', 'gutenberg_output_block_nav_menu', 10, 2 );

/**
 * Shim that makes nav-menus.php nicely display a menu item with its `type` set to
 * `'block'`.
 *
 * Specifically, this shim makes it so that `Walker_Nav_Menu_Edit::start_el()`
 * outputs extra form fields. When merged to Core, this markup should exist in
 * `Walker_Nav_Menu_Edit::start_el()`.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50544
 *
 * @param int     $item_id Menu item ID.
 * @param WP_Post $item    Menu item data object.
 */
function gutenberg_output_block_menu_item_custom_fields( $item_id, $item ) {
	if ( 'block' === $item->type ) {
		?>
		<p class="field-content description description-wide">
			<label for="edit-menu-item-content-<?php echo $item_id; ?>">
				<?php _e( 'Content', 'gutenberg' ); ?><br />
				<textarea id="edit-menu-item-content-<?php echo $item_id; ?>" class="widefat" rows="3" cols="20" name="menu-item-content[<?php echo $item_id; ?>]" readonly><?php echo esc_textarea( trim( $item->content ) ); ?></textarea>
			</label>
		</p>
		<?php
	}
}
add_action( 'wp_nav_menu_item_custom_fields', 'gutenberg_output_block_menu_item_custom_fields', 10, 2 );

/**
 * Shim that adds extra styling to nav-menus.php. This lets us style menu items
 * that have a `type` set to `'block'`. When merged to Core, this CSS should be
 * moved to nav-menus.css.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50544
 *
 * @param string $hook The current admin page.
 */
function gutenberg_add_block_menu_item_styles_to_nav_menus( $hook ) {
	if ( 'nav-menus.php' === $hook ) {
		$css = <<<CSS
			/**
			 * HACK: We're hiding the description field using CSS because this
			 * cannot be done using a filter. When merged to Core, we should
			 * actually remove the field from
			 * `Walker_Nav_Menu_Edit::start_el()`.
			 */
			.menu-item-block .description:not(.field-content) {
				display: none;
			}
CSS;
		wp_add_inline_style( 'nav-menus', $css );
	}
}
add_action( 'admin_enqueue_scripts', 'gutenberg_add_block_menu_item_styles_to_nav_menus' );


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
		// We should disable UI for non-FSE themes.
		'show_ui'               => gutenberg_is_fse_theme(),
		'show_in_menu'          => 'themes.php',
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
function gutenberg_rename_navigation_menus_admin_menu_entry() {
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

add_action( 'admin_menu', 'gutenberg_rename_navigation_menus_admin_menu_entry' );

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
 * Returns the API paths to preload to make the navigation area block load fast.
 *
 * @return array A list of paths.
 */
function gutenberg_get_navigation_areas_paths_to_preload() {
	$areas        = get_option( 'fse_navigation_areas', array() );
	$active_areas = array_intersect_key( $areas, gutenberg_get_navigation_areas() );
	$paths        = array(
		'/__experimental/block-navigation-areas?context=edit',
	);
	foreach ( $active_areas as $post_id ) {
		if ( 0 !== $post_id ) {
			$paths[] = "/wp/v2/navigation/$post_id?context=edit";
		}
	}
	return $paths;
}

/**
 * Migrates classic menus to block-based menus on theme switch.
 *
 * @param string   $new_name  Name of the new theme.
 * @param WP_Theme $new_theme New theme.
 * @param WP_Theme $old_theme Old theme.
 * @see switch_theme WordPress action.
 */
function gutenberg_migrate_nav_on_theme_switch( $new_name, $new_theme, $old_theme ) {
	// Do nothing when switching to a theme that does not support site editor.
	if ( ! gutenberg_experimental_is_site_editor_available() ) {
		return;
	}

	// get_nav_menu_locations() calls get_theme_mod() which depends on the stylesheet option.
	// At the same time, switch_theme runs only after the stylesheet option was updated to $new_theme.
	// To retrieve theme mods of the old theme, the getter is hooked to get_option( 'stylesheet' ) so that we
	// get the old theme, which causes the get_nav_menu_locations to get the locations of the old theme.
	$get_old_theme_stylesheet = function() use ( $old_theme ) {
		return $old_theme->get_stylesheet();
	};
	add_filter( 'option_stylesheet', $get_old_theme_stylesheet );

	$locations    = get_nav_menu_locations();
	$area_mapping = get_option( 'fse_navigation_areas', array() );

	foreach ( $locations as $location_name => $menu_id ) {
		// Get the menu from the location, skipping if there is no
		// menu or there was an error.
		$menu = wp_get_nav_menu_object( $menu_id );
		if ( ! $menu || is_wp_error( $menu ) ) {
			continue;
		}

		$menu_items = gutenberg_global_get_menu_items_at_location( $location_name );
		if ( empty( $menu_items ) ) {
			continue;
		}

		$post_name   = 'classic_menu_' . $menu_id;
		$post_status = 'publish';

		// Get or create to avoid creating too many wp_navigation posts.
		$query          = new WP_Query;
		$matching_posts = $query->query(
			array(
				'name'           => $post_name,
				'post_status'    => $post_status,
				'post_type'      => 'wp_navigation',
				'posts_per_page' => 1,
			)
		);

		if ( count( $matching_posts ) ) {
			$navigation_post_id = $matching_posts[0]->ID;
		} else {
			$menu_items_by_parent_id = gutenberg_global_sort_menu_items_by_parent_id( $menu_items );
			$parsed_blocks           = gutenberg_global_parse_blocks_from_menu_items( $menu_items_by_parent_id[0], $menu_items_by_parent_id );
			$post_data               = array(
				'post_type'    => 'wp_navigation',
				'post_title'   => sprintf(
					/* translators: %s: the name of the menu, e.g. "Main Menu". */
					__( 'Classic menu: %s', 'gutenberg' ),
					$menu->name
				),
				'post_name'    => $post_name,
				'post_content' => serialize_blocks( $parsed_blocks ),
				'post_status'  => $post_status,
			);
			$navigation_post_id      = wp_insert_post( $post_data );
		}

		$area_mapping[ $location_name ] = $navigation_post_id;
	}
	remove_filter( 'option_stylesheet', $get_old_theme_stylesheet );

	update_option( 'fse_navigation_areas', $area_mapping );
}

add_action( 'switch_theme', 'gutenberg_migrate_nav_on_theme_switch', 200, 3 );

// The functions below are copied over from packages/block-library/src/navigation/index.php
// Let's figure out a better way of managing these global PHP dependencies.

/**
 * Returns the menu items for a WordPress menu location.
 *
 * @param string $location The menu location.
 * @return array Menu items for the location.
 */
function gutenberg_global_get_menu_items_at_location( $location ) {
	if ( empty( $location ) ) {
		return;
	}

	// Build menu data. The following approximates the code in
	// `wp_nav_menu()` and `gutenberg_output_block_nav_menu`.

	// Find the location in the list of locations, returning early if the
	// location can't be found.
	$locations = get_nav_menu_locations();
	if ( ! isset( $locations[ $location ] ) ) {
		return;
	}

	// Get the menu from the location, returning early if there is no
	// menu or there was an error.
	$menu = wp_get_nav_menu_object( $locations[ $location ] );
	if ( ! $menu || is_wp_error( $menu ) ) {
		return;
	}

	$menu_items = wp_get_nav_menu_items( $menu->term_id, array( 'update_post_term_cache' => false ) );
	_wp_menu_item_classes_by_context( $menu_items );

	return $menu_items;
}


/**
 * Sorts a standard array of menu items into a nested structure keyed by the
 * id of the parent menu.
 *
 * @param array $menu_items Menu items to sort.
 * @return array An array keyed by the id of the parent menu where each element
 *               is an array of menu items that belong to that parent.
 */
function gutenberg_global_sort_menu_items_by_parent_id( $menu_items ) {
	$sorted_menu_items = array();
	foreach ( (array) $menu_items as $menu_item ) {
		$sorted_menu_items[ $menu_item->menu_order ] = $menu_item;
	}
	unset( $menu_items, $menu_item );

	$menu_items_by_parent_id = array();
	foreach ( $sorted_menu_items as $menu_item ) {
		$menu_items_by_parent_id[ $menu_item->menu_item_parent ][] = $menu_item;
	}

	return $menu_items_by_parent_id;
}

/**
 * Turns menu item data into a nested array of parsed blocks
 *
 * @param array $menu_items               An array of menu items that represent
 *                                        an individual level of a menu.
 * @param array $menu_items_by_parent_id  An array keyed by the id of the
 *                                        parent menu where each element is an
 *                                        array of menu items that belong to
 *                                        that parent.
 * @return array An array of parsed block data.
 */
function gutenberg_global_parse_blocks_from_menu_items( $menu_items, $menu_items_by_parent_id ) {
	if ( empty( $menu_items ) ) {
		return array();
	}

	$blocks = array();

	foreach ( $menu_items as $menu_item ) {
		$class_name       = ! empty( $menu_item->classes ) ? implode( ' ', (array) $menu_item->classes ) : null;
		$id               = ( null !== $menu_item->object_id && 'custom' !== $menu_item->object ) ? $menu_item->object_id : null;
		$opens_in_new_tab = null !== $menu_item->target && '_blank' === $menu_item->target;
		$rel              = ( null !== $menu_item->xfn && '' !== $menu_item->xfn ) ? $menu_item->xfn : null;
		$kind             = null !== $menu_item->type ? str_replace( '_', '-', $menu_item->type ) : 'custom';

		$block = array(
			'blockName' => isset( $menu_items_by_parent_id[ $menu_item->ID ] ) ? 'core/navigation-submenu' : 'core/navigation-link',
			'attrs'     => array(
				'className'     => $class_name,
				'description'   => $menu_item->description,
				'id'            => $id,
				'kind'          => $kind,
				'label'         => $menu_item->title,
				'opensInNewTab' => $opens_in_new_tab,
				'rel'           => $rel,
				'title'         => $menu_item->attr_title,
				'type'          => $menu_item->object,
				'url'           => $menu_item->url,
			),
		);

		$block['innerBlocks']  = isset( $menu_items_by_parent_id[ $menu_item->ID ] )
			? gutenberg_global_parse_blocks_from_menu_items( $menu_items_by_parent_id[ $menu_item->ID ], $menu_items_by_parent_id )
			: array();
		$block['innerContent'] = array_map( 'serialize_block', $block['innerBlocks'] );

		$blocks[] = $block;
	}

	return $blocks;
}
