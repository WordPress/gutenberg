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
		'show_ui'               => false,
		'show_in_menu'          => 'themes.php',
		'show_in_admin_bar'     => false,
		'show_in_rest'          => true,
		'map_meta_cap'          => true,
		'rest_base'             => 'navigation',
		'rest_controller_class' => 'WP_REST_Posts_Controller',
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
 * ==========================
 * ========= IDEA 1 =========
 * ==========================
 *
 * On theme switch, take navigationMenuId from theme A template parts, and apply it to theme B template parts.
 * Upsides:
 * * New theme always gets the "primary", "secondary" etc. menus in its corresponding slots.
 * * "Menu areas" are just template areas.
 * * All the UI is in place thanks to the isolated template parts editor.
 *
 * Downsides:
 * * Needs to look for the first available navigation block, it could be nested, missing etc. This should be easy to address.
 * * Placing an intermediate template part between "Primary menu" and the navigation block would derail this function.
 *   I think the only way of addressing it is not accepting intermediate template parts, perhaps via a new flavor of the template part block.
 * * New template parts are stored in the database on theme switch.
 * * It adds a new concept of "re-writing content".
 *
 * Questions:
 * * Template parts are the source of truth, but they could be deleted. I'm not sure if that's a problem.
 * * There are now two blocks instead of one. It uncovers we are really managing two entities, but
 *   it also creates a more complex interaction. I like it, though. Do you?
 */

/**
 * Copies the navigationMenuId attribute from navigation template parts in the old theme, to
 * corresponding ones in the new theme.
 *
 * @param string   $new_name  Name of the new theme.
 * @param WP_Theme $new_theme New theme.
 * @param WP_Theme $old_theme Old theme.
 * @see switch_theme WordPress action.
 */
function gutenberg_migrate_nav_on_theme_switch( $new_name, $new_theme, $old_theme ) {
	$old_theme_name     = $old_theme->get_stylesheet();
	$settings_old_theme = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();
	$old_nav_parts      = get_navigation_template_part_names( $settings_old_theme->get_template_parts() );

	WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
	$new_theme_name     = $new_theme->get_stylesheet();
	$settings_new_theme = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();
	$new_nav_parts      = get_navigation_template_part_names( $settings_new_theme->get_template_parts() );

	$common_parts = array_intersect( $old_nav_parts, $new_nav_parts );
	foreach ( $common_parts as $common_part ) {
		// Get a navigation template part from the old theme.
		$id                = $old_theme_name . '//' . $common_part;
		$old_template_part = gutenberg_get_block_template( $id, 'wp_template_part' );
		if ( ! $old_template_part || empty( $old_template_part->content ) || empty( $old_template_part->wp_id ) ) {
			continue;
		}

		// Extract the navigationMenuId from the old template part.
		$old_blocks = parse_blocks( $old_template_part->content );
		if (
				! $old_blocks ||
				'core/navigation' !== $old_blocks[0]['blockName'] ||
				empty( $old_blocks[0]['attrs']['navigationMenuId'] )
		) {
			continue;
		}
		$old_nav_menu_id = $old_blocks[0]['attrs']['navigationMenuId'];

		// Get a navigation template part from the new theme.
		$new_id            = $new_theme_name . '//' . $common_part;
		$new_template_part = gutenberg_get_block_template( $new_id, 'wp_template_part' );

		// Set the old post_name to something else because there is a hook in place that prevents
		// the new template part from getting the same slug as the old template part.
		// @TODO: Remove this once the post_name is retired as a slug container.
		if ( $old_template_part->wp_id ) {
			$old_post            = get_post( $old_template_part->wp_id );
			$old_post->post_name = 'temp';
			wp_update_post( $old_post );
		}

		// Create a navigation template part for the new theme if one doesn't already exist.
		if ( ! $new_template_part || empty( $new_template_part->content ) || empty( $new_template_part->wp_id ) ) {
			$template_file         = _gutenberg_get_template_file( 'wp_template_part', $common_part );
			$block_template        = _gutenberg_build_template_result_from_file( $template_file, 'wp_template_part' );
			$template_part_args    = array(
				'post_type'    => $block_template->type,
				'post_name'    => $common_part,
				'post_title'   => $common_part,
				'post_content' => $block_template->content,
				'post_status'  => 'publish',
				'tax_input'    => array(
					'wp_theme'              => array(
						$new_theme_name,
					),
					'wp_template_part_area' => array(
						$block_template->area,
					),
				),
			);
			$template_part_post_id = wp_insert_post( $template_part_args );
			wp_set_post_terms( $template_part_post_id, $block_template->area, 'wp_template_part_area' );
			wp_set_post_terms( $template_part_post_id, $new_theme_name, 'wp_theme' );
			$new_template_part = gutenberg_get_block_template( $new_id, 'wp_template_part' );
		}

		// Apply the previous navigation post ID to the navigation block in the new theme.
		$new_blocks = parse_blocks( $new_template_part->content );
		if (
				$new_blocks &&
				! empty( $new_blocks[0]['blockName'] ) &&
				is_array( $new_blocks[0]['attrs'] ) &&
				'core/navigation' === $new_blocks[0]['blockName']
		) {
			$new_blocks[0]['attrs']['navigationMenuId'] = $old_nav_menu_id;
			$new_post                                   = get_post( $new_template_part->wp_id );
			$new_post->post_name                        = $common_part;
			$new_post->post_content                     = serialize_blocks( $new_blocks );
			wp_update_post( $new_post );
		}

		// Restore the old post_name to the old template part.
		// @TODO: Remove this once the post_name is retired as a slug container.
		if ( $old_template_part->wp_id ) {
			$old_post            = get_post( $old_template_part->wp_id );
			$old_post->post_name = $common_part;
			wp_update_post( $old_post );
		}
	}
}

/**
 * Returns a list of template parts representing labeled navigation areas such as primary, secondary, etc.
 *
 * @param array[] $template_parts Template parts from theme.json.
 * @return array List of template parts na
 */
function get_navigation_template_part_names( $template_parts ) {
	$menu_parts = array();
	foreach ( $template_parts as $key => $part ) {
		if ( WP_TEMPLATE_PART_AREA_PRIMARY_MENU === $part['area'] ) {
			$menu_parts[] = $key;
		}
	}
	return $menu_parts;
}

// Set a priority such that WP_Theme_JSON_Resolver_Gutenberg still has contains the cached data.
// This will clean the cache which may be unexpected, so it would be better to introduce a `before_theme_switch` action.

// Enable re-writing like: add_action( 'switch_theme', 'gutenberg_migrate_nav_on_theme_switch', -200, 3 );.

// IDEA 1 above is self contained and ends here.


/**
 * ==========================
 * ========= IDEA 2 =========
 * ==========================
 *
 * Parse navigation-related template parts on save, and store an association like {"primary-menu": 794} somewhere.
 * When a new navigation-related template part is rendered for the first time, provide {"primary-menu": 794} to use
 * as the initial value of the `navigationMenuId` attribute.
 *
 * Upsides:
 * * Menus are matched between themes via a keyword.
 * * "Menu areas" are just template areas.
 * * All the UI is in place thanks to the isolated template parts editor.
 *
 * Downsides:
 * * It still wouldn't work if there's a nested template part between the "primary-menu" and the navigation block.
 * * We don't use "initial" attributes in other blocks, so it's a precedent.
 */


/**
 * When the navigation-related template part post is saved, extract the navigationMenuId it contains,
 * and store it in the database for later.
 *
 * @param int $post_id Post ID.
 */
function store_navigation_associations( $post_id ) {
	$template_part_post = get_post( $post_id );

	// Only proceed if the template part represents a navigation.
	$area_terms = get_the_terms( $template_part_post, 'wp_template_part_area' );
	if ( is_wp_error( $area_terms ) || false === $area_terms ) {
		return;
	}

	$area = $area_terms[0]->name;
	if ( ! in_array( $area, gutenberg_get_navigation_template_part_areas(), true ) ) {
		return;
	}

	// Only proceed if the template part is related to the current theme.
	$theme_terms = get_the_terms( $post_id, 'wp_theme' );
	if ( is_wp_error( $theme_terms ) || false === $theme_terms ) {
		return;
	}
	$theme = $theme_terms[0]->name;
	if ( get_stylesheet() !== $theme ) {
		return;
	}

	// Get the first navigation menu ID from the post.
	// @TODO: traverse the entire tree, not just the first block.
	$blocks = parse_blocks( $template_part_post->post_content );
	if (
			! $blocks ||
			'core/navigation' !== $blocks[0]['blockName'] ||
			empty( $blocks[0]['attrs']['navigationMenuId'] )
	) {
		return;
	}
	$navigation_post_id = $blocks[0]['attrs']['navigationMenuId'];

	// Update the area -> navigation ID map.
	// Site options are a quick&dirty choice for now. We could use taxonomies, theme mods, or anything else here.
	$updated_associations = array_merge(
		get_option( 'navigation_associations', array() ),
		array( $area => $navigation_post_id )
	);
	update_option( 'navigation_associations', $updated_associations );
}
add_action( 'save_post_wp_template_part', 'store_navigation_associations' );

/**
 * Returns a list of template areas that are meant to hold navigation.
 *
 * @todo move this where WP_TEMPLATE_PART_AREA_PRIMARY_MENU is declared.
 * @return string A list of area idetifiers.
 */
function gutenberg_get_navigation_template_part_areas() {
	return array(
		WP_TEMPLATE_PART_AREA_PRIMARY_MENU,
	);
}


/**
 * TODO: Make changing nested entities affect parent entities in Gutenberg
 * example:
 * <!-- wp:template-part {"slug":"header"} -->
 *   <!-- wp:template-part {"slug":"primary-menu","tagName":"primary-menu","className":"primary-menu","layout":{"inherit":true}} -->
 *     <!-- wp:navigation { "navigationMenuId": {primary-menu} } -->
 *   <!-- /wp:template-part -->
 * <!-- /wp:template-part -->
 *
 * If I set navigationMenuId to something else, it should save the primary-menu template part. Currently it doesn't and it seems like a bug.
 */
