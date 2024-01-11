<?php
/**
 * Server-side rendering of the `core/navigation` block.
 *
 * @package WordPress
 */

// These functions are used for the __unstableLocation feature and only active
// when the gutenberg plugin is active.
if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
	/**
	 * Returns the menu items for a WordPress menu location.
	 *
	 * @param string $location The menu location.
	 * @return array Menu items for the location.
	 */
	function block_core_navigation_get_menu_items_at_location( $location ) {
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
	function block_core_navigation_sort_menu_items_by_parent_id( $menu_items ) {
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
	 * Gets the inner blocks for the navigation block from the unstable location attribute.
	 *
	 * @param array $attributes The block attributes.
	 * @return WP_Block_List Returns the inner blocks for the navigation block.
	 */
	function block_core_navigation_get_inner_blocks_from_unstable_location( $attributes ) {
		$menu_items = block_core_navigation_get_menu_items_at_location( $attributes['__unstableLocation'] );
		if ( empty( $menu_items ) ) {
			return new WP_Block_List( array(), $attributes );
		}

		$menu_items_by_parent_id = block_core_navigation_sort_menu_items_by_parent_id( $menu_items );
		$parsed_blocks           = block_core_navigation_parse_blocks_from_menu_items( $menu_items_by_parent_id[0], $menu_items_by_parent_id );
		return new WP_Block_List( $parsed_blocks, $attributes );
	}
}

/**
 * Add Interactivity API directives to the navigation-submenu and page-list
 * blocks markup using the Tag Processor.
 *
 * @param WP_HTML_Tag_Processor $tags             Markup of the navigation block.
 * @param array                 $block_attributes Block attributes.
 *
 * @return string Submenu markup with the directives injected.
 */
function block_core_navigation_add_directives_to_submenu( $tags, $block_attributes ) {
	while ( $tags->next_tag(
		array(
			'tag_name'   => 'LI',
			'class_name' => 'has-child',
		)
	) ) {
		// Add directives to the parent `<li>`.
		$tags->set_attribute( 'data-wp-interactive', '{ "namespace": "core/navigation" }' );
		$tags->set_attribute( 'data-wp-context', '{ "submenuOpenedBy": {}, "type": "submenu" }' );
		$tags->set_attribute( 'data-wp-watch', 'callbacks.initMenu' );
		$tags->set_attribute( 'data-wp-on--focusout', 'actions.handleMenuFocusout' );
		$tags->set_attribute( 'data-wp-on--keydown', 'actions.handleMenuKeydown' );

		// This is a fix for Safari. Without it, Safari doesn't change the active
		// element when the user clicks on a button. It can be removed once we add
		// an overlay to capture the clicks, instead of relying on the focusout
		// event.
		$tags->set_attribute( 'tabindex', '-1' );

		if ( ! isset( $block_attributes['openSubmenusOnClick'] ) || false === $block_attributes['openSubmenusOnClick'] ) {
			$tags->set_attribute( 'data-wp-on--mouseenter', 'actions.openMenuOnHover' );
			$tags->set_attribute( 'data-wp-on--mouseleave', 'actions.closeMenuOnHover' );
		}

		// Add directives to the toggle submenu button.
		if ( $tags->next_tag(
			array(
				'tag_name'   => 'BUTTON',
				'class_name' => 'wp-block-navigation-submenu__toggle',
			)
		) ) {
			$tags->set_attribute( 'data-wp-on--click', 'actions.toggleMenuOnClick' );
			$tags->set_attribute( 'data-wp-bind--aria-expanded', 'state.isMenuOpen' );
			// The `aria-expanded` attribute for SSR is already added in the submenu block.
		}
		// Add directives to the submenu.
		if ( $tags->next_tag(
			array(
				'tag_name'   => 'UL',
				'class_name' => 'wp-block-navigation__submenu-container',
			)
		) ) {
			$tags->set_attribute( 'data-wp-on--focus', 'actions.openMenuOnFocus' );
		}

		// Iterate through subitems if exist.
		block_core_navigation_add_directives_to_submenu( $tags, $block_attributes );
	}
	return $tags->get_updated_html();
}

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the navigation markup in the front-end.
 *
 * @param array $attributes Navigation block attributes.
 *
 * @return array Colors CSS classes and inline styles.
 */
function block_core_navigation_build_css_colors( $attributes ) {
	$colors = array(
		'css_classes'           => array(),
		'inline_styles'         => '',
		'overlay_css_classes'   => array(),
		'overlay_inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color = array_key_exists( 'customTextColor', $attributes );

	// If has text color.
	if ( $has_custom_text_color || $has_named_text_color ) {
		// Add has-text-color class.
		$colors['css_classes'][] = 'has-text-color';
	}

	if ( $has_named_text_color ) {
		// Add the color class.
		$colors['css_classes'][] = sprintf( 'has-%s-color', $attributes['textColor'] );
	} elseif ( $has_custom_text_color ) {
		// Add the custom color inline style.
		$colors['inline_styles'] .= sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	// Background color.
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );

	// If has background color.
	if ( $has_custom_background_color || $has_named_background_color ) {
		// Add has-background class.
		$colors['css_classes'][] = 'has-background';
	}

	if ( $has_named_background_color ) {
		// Add the background-color class.
		$colors['css_classes'][] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	} elseif ( $has_custom_background_color ) {
		// Add the custom background-color inline style.
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	// Overlay text color.
	$has_named_overlay_text_color  = array_key_exists( 'overlayTextColor', $attributes );
	$has_custom_overlay_text_color = array_key_exists( 'customOverlayTextColor', $attributes );

	// If has overlay text color.
	if ( $has_custom_overlay_text_color || $has_named_overlay_text_color ) {
		// Add has-text-color class.
		$colors['overlay_css_classes'][] = 'has-text-color';
	}

	if ( $has_named_overlay_text_color ) {
		// Add the overlay color class.
		$colors['overlay_css_classes'][] = sprintf( 'has-%s-color', $attributes['overlayTextColor'] );
	} elseif ( $has_custom_overlay_text_color ) {
		// Add the custom overlay color inline style.
		$colors['overlay_inline_styles'] .= sprintf( 'color: %s;', $attributes['customOverlayTextColor'] );
	}

	// Overlay background color.
	$has_named_overlay_background_color  = array_key_exists( 'overlayBackgroundColor', $attributes );
	$has_custom_overlay_background_color = array_key_exists( 'customOverlayBackgroundColor', $attributes );

	// If has overlay background color.
	if ( $has_custom_overlay_background_color || $has_named_overlay_background_color ) {
		// Add has-background class.
		$colors['overlay_css_classes'][] = 'has-background';
	}

	if ( $has_named_overlay_background_color ) {
		// Add the overlay background-color class.
		$colors['overlay_css_classes'][] = sprintf( 'has-%s-background-color', $attributes['overlayBackgroundColor'] );
	} elseif ( $has_custom_overlay_background_color ) {
		// Add the custom overlay background-color inline style.
		$colors['overlay_inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customOverlayBackgroundColor'] );
	}

	return $colors;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the navigation markup in the front-end.
 *
 * @param array $attributes Navigation block attributes.
 *
 * @return array Font size CSS classes and inline styles.
 */
function block_core_navigation_build_css_font_sizes( $attributes ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $attributes );
	$has_custom_font_size = array_key_exists( 'customFontSize', $attributes );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $attributes['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $attributes['customFontSize'] );
	}

	return $font_sizes;
}

/**
 * Returns the top-level submenu SVG chevron icon.
 *
 * @return string
 */
function block_core_navigation_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';
}

/**
 * Filter out empty "null" blocks from the block list.
 * 'parse_blocks' includes a null block with '\n\n' as the content when
 * it encounters whitespace. This is not a bug but rather how the parser
 * is designed.
 *
 * @param array $parsed_blocks the parsed blocks to be normalized.
 * @return array the normalized parsed blocks.
 */
function block_core_navigation_filter_out_empty_blocks( $parsed_blocks ) {
	$filtered = array_filter(
		$parsed_blocks,
		static function ( $block ) {
			return isset( $block['blockName'] );
		}
	);

	// Reset keys.
	return array_values( $filtered );
}

/**
 * Returns true if the navigation block contains a nested navigation block.
 *
 * @param WP_Block_List $inner_blocks Inner block instance to be normalized.
 * @return bool true if the navigation block contains a nested navigation block.
 */
function block_core_navigation_block_contains_core_navigation( $inner_blocks ) {
	foreach ( $inner_blocks as $block ) {
		if ( 'core/navigation' === $block->name ) {
			return true;
		}
		if ( $block->inner_blocks && block_core_navigation_block_contains_core_navigation( $block->inner_blocks ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Retrieves the appropriate fallback to be used on the front of the
 * site when there is no menu assigned to the Nav block.
 *
 * This aims to mirror how the fallback mechanic for wp_nav_menu works.
 * See https://developer.wordpress.org/reference/functions/wp_nav_menu/#more-information.
 *
 * @return array the array of blocks to be used as a fallback.
 */
function block_core_navigation_get_fallback_blocks() {
	$page_list_fallback = array(
		array(
			'blockName' => 'core/page-list',
		),
	);

	$registry = WP_Block_Type_Registry::get_instance();

	// If `core/page-list` is not registered then return empty blocks.
	$fallback_blocks = $registry->is_registered( 'core/page-list' ) ? $page_list_fallback : array();

	if ( class_exists( 'WP_Navigation_Fallback' ) ) {
		$navigation_post = WP_Navigation_Fallback::get_fallback();
	} else {
		$navigation_post = Gutenberg_Navigation_Fallback::get_fallback();
	}

	// Use the first non-empty Navigation as fallback if available.
	if ( $navigation_post ) {
		$parsed_blocks  = parse_blocks( $navigation_post->post_content );
		$maybe_fallback = block_core_navigation_filter_out_empty_blocks( $parsed_blocks );

		// Normalizing blocks may result in an empty array of blocks if they were all `null` blocks.
		// In this case default to the (Page List) fallback.
		$fallback_blocks = ! empty( $maybe_fallback ) ? $maybe_fallback : $fallback_blocks;
	}

	/**
	 * Filters the fallback experience for the Navigation block.
	 *
	 * Returning a falsey value will opt out of the fallback and cause the block not to render.
	 * To customise the blocks provided return an array of blocks - these should be valid
	 * children of the `core/navigation` block.
	 *
	 * @since 5.9.0
	 *
	 * @param array[] default fallback blocks provided by the default block mechanic.
	 */
	return apply_filters( 'block_core_navigation_render_fallback', $fallback_blocks );
}

/**
 * Iterate through all inner blocks recursively and get navigation link block's post IDs.
 *
 * @param WP_Block_List $inner_blocks Block list class instance.
 *
 * @return array Array of post IDs.
 */
function block_core_navigation_get_post_ids( $inner_blocks ) {
	$post_ids = array_map( 'block_core_navigation_from_block_get_post_ids', iterator_to_array( $inner_blocks ) );
	return array_unique( array_merge( ...$post_ids ) );
}

/**
 * Get post IDs from a navigation link block instance.
 *
 * @param WP_Block $block Instance of a block.
 *
 * @return array Array of post IDs.
 */
function block_core_navigation_from_block_get_post_ids( $block ) {
	$post_ids = array();

	if ( $block->inner_blocks ) {
		$post_ids = block_core_navigation_get_post_ids( $block->inner_blocks );
	}

	if ( 'core/navigation-link' === $block->name || 'core/navigation-submenu' === $block->name ) {
		if ( $block->attributes && isset( $block->attributes['kind'] ) && 'post-type' === $block->attributes['kind'] && isset( $block->attributes['id'] ) ) {
			$post_ids[] = $block->attributes['id'];
		}
	}

	return $post_ids;
}

/**
 * Renders the `core/navigation` block on server.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The saved content.
 * @param WP_Block $block      The parsed block.
 *
 * @return string Returns the navigation block markup.
 */
function render_block_core_navigation( $attributes, $content, $block ) {
	return WP_Navigation_Block_Renderer::render( $attributes, $content, $block );
}

/**
 * Register the navigation block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation',
		array(
			'render_callback' => 'render_block_core_navigation',
		)
	);

	if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
		gutenberg_register_module(
			'@wordpress/block-library/navigation-block',
			gutenberg_url( '/build/interactivity/navigation.min.js' ),
			array( '@wordpress/interactivity' ),
			defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : get_bloginfo( 'version' )
		);
	}
}

add_action( 'init', 'register_block_core_navigation' );

/**
 * Filter that changes the parsed attribute values of navigation blocks contain typographic presets to contain the values directly.
 *
 * @param array $parsed_block The block being rendered.
 *
 * @return array The block being rendered without typographic presets.
 */
function block_core_navigation_typographic_presets_backcompatibility( $parsed_block ) {
	if ( 'core/navigation' === $parsed_block['blockName'] ) {
		$attribute_to_prefix_map = array(
			'fontStyle'      => 'var:preset|font-style|',
			'fontWeight'     => 'var:preset|font-weight|',
			'textDecoration' => 'var:preset|text-decoration|',
			'textTransform'  => 'var:preset|text-transform|',
		);
		foreach ( $attribute_to_prefix_map as $style_attribute => $prefix ) {
			if ( ! empty( $parsed_block['attrs']['style']['typography'][ $style_attribute ] ) ) {
				$prefix_len      = strlen( $prefix );
				$attribute_value = &$parsed_block['attrs']['style']['typography'][ $style_attribute ];
				if ( 0 === strncmp( $attribute_value, $prefix, $prefix_len ) ) {
					$attribute_value = substr( $attribute_value, $prefix_len );
				}
				if ( 'textDecoration' === $style_attribute && 'strikethrough' === $attribute_value ) {
					$attribute_value = 'line-through';
				}
			}
		}
	}

	return $parsed_block;
}

add_filter( 'render_block_data', 'block_core_navigation_typographic_presets_backcompatibility' );

/**
 * Ensure that the view script has the `wp-interactivity` dependency.
 *
 * @since 6.4.0
 *
 * @global WP_Scripts $wp_scripts
 */
function block_core_navigation_ensure_interactivity_dependency() {
	global $wp_scripts;
	if (
		isset( $wp_scripts->registered['wp-block-navigation-view'] ) &&
		! in_array( 'wp-interactivity', $wp_scripts->registered['wp-block-navigation-view']->deps, true )
	) {
		$wp_scripts->registered['wp-block-navigation-view']->deps[] = 'wp-interactivity';
	}
}

add_action( 'wp_print_scripts', 'block_core_navigation_ensure_interactivity_dependency' );

/**
 * Turns menu item data into a nested array of parsed blocks
 *
 * @deprecated 6.3.0 Use WP_Navigation_Fallback::parse_blocks_from_menu_items() instead.
 *
 * @param array $menu_items               An array of menu items that represent
 *                                        an individual level of a menu.
 * @param array $menu_items_by_parent_id  An array keyed by the id of the
 *                                        parent menu where each element is an
 *                                        array of menu items that belong to
 *                                        that parent.
 * @return array An array of parsed block data.
 */
function block_core_navigation_parse_blocks_from_menu_items( $menu_items, $menu_items_by_parent_id ) {

	_deprecated_function( __FUNCTION__, '6.3.0', 'WP_Navigation_Fallback::parse_blocks_from_menu_items' );

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
			? block_core_navigation_parse_blocks_from_menu_items( $menu_items_by_parent_id[ $menu_item->ID ], $menu_items_by_parent_id )
			: array();
		$block['innerContent'] = array_map( 'serialize_block', $block['innerBlocks'] );

		$blocks[] = $block;
	}

	return $blocks;
}

/**
 * Get the classic navigation menu to use as a fallback.
 *
 * @deprecated 6.3.0 Use WP_Navigation_Fallback::get_classic_menu_fallback() instead.
 *
 * @return object WP_Term The classic navigation.
 */
function block_core_navigation_get_classic_menu_fallback() {

	_deprecated_function( __FUNCTION__, '6.3.0', 'WP_Navigation_Fallback::get_classic_menu_fallback' );

	$classic_nav_menus = wp_get_nav_menus();

	// If menus exist.
	if ( $classic_nav_menus && ! is_wp_error( $classic_nav_menus ) ) {
		// Handles simple use case where user has a classic menu and switches to a block theme.

		// Returns the menu assigned to location `primary`.
		$locations = get_nav_menu_locations();
		if ( isset( $locations['primary'] ) ) {
			$primary_menu = wp_get_nav_menu_object( $locations['primary'] );
			if ( $primary_menu ) {
				return $primary_menu;
			}
		}

		// Returns a menu if `primary` is its slug.
		foreach ( $classic_nav_menus as $classic_nav_menu ) {
			if ( 'primary' === $classic_nav_menu->slug ) {
				return $classic_nav_menu;
			}
		}

		// Otherwise return the most recently created classic menu.
		usort(
			$classic_nav_menus,
			static function ( $a, $b ) {
				return $b->term_id - $a->term_id;
			}
		);
		return $classic_nav_menus[0];
	}
}

/**
 * Converts a classic navigation to blocks.
 *
 * @deprecated 6.3.0 Use WP_Navigation_Fallback::get_classic_menu_fallback_blocks() instead.
 *
 * @param  object $classic_nav_menu WP_Term The classic navigation object to convert.
 * @return array the normalized parsed blocks.
 */
function block_core_navigation_get_classic_menu_fallback_blocks( $classic_nav_menu ) {

	_deprecated_function( __FUNCTION__, '6.3.0', 'WP_Navigation_Fallback::get_classic_menu_fallback_blocks' );

	// BEGIN: Code that already exists in wp_nav_menu().
	$menu_items = wp_get_nav_menu_items( $classic_nav_menu->term_id, array( 'update_post_term_cache' => false ) );

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

	$inner_blocks = block_core_navigation_parse_blocks_from_menu_items(
		isset( $menu_items_by_parent_id[0] )
			? $menu_items_by_parent_id[0]
			: array(),
		$menu_items_by_parent_id
	);

	return serialize_blocks( $inner_blocks );
}

/**
 * If there's a classic menu then use it as a fallback.
 *
 * @deprecated 6.3.0 Use WP_Navigation_Fallback::create_classic_menu_fallback() instead.
 *
 * @return array the normalized parsed blocks.
 */
function block_core_navigation_maybe_use_classic_menu_fallback() {

	_deprecated_function( __FUNCTION__, '6.3.0', 'WP_Navigation_Fallback::create_classic_menu_fallback' );

	// See if we have a classic menu.
	$classic_nav_menu = block_core_navigation_get_classic_menu_fallback();

	if ( ! $classic_nav_menu ) {
		return;
	}

	// If we have a classic menu then convert it to blocks.
	$classic_nav_menu_blocks = block_core_navigation_get_classic_menu_fallback_blocks( $classic_nav_menu );

	if ( empty( $classic_nav_menu_blocks ) ) {
		return;
	}

	// Create a new navigation menu from the classic menu.
	$wp_insert_post_result = wp_insert_post(
		array(
			'post_content' => $classic_nav_menu_blocks,
			'post_title'   => $classic_nav_menu->name,
			'post_name'    => $classic_nav_menu->slug,
			'post_status'  => 'publish',
			'post_type'    => 'wp_navigation',
		),
		true // So that we can check whether the result is an error.
	);

	if ( is_wp_error( $wp_insert_post_result ) ) {
		return;
	}

	// Fetch the most recently published navigation which will be the classic one created above.
	return block_core_navigation_get_most_recently_published_navigation();
}

/**
 * Finds the most recently published `wp_navigation` Post.
 *
 * @deprecated 6.3.0 Use WP_Navigation_Fallback::get_most_recently_published_navigation() instead.
 *
 * @return WP_Post|null the first non-empty Navigation or null.
 */
function block_core_navigation_get_most_recently_published_navigation() {

	_deprecated_function( __FUNCTION__, '6.3.0', 'WP_Navigation_Fallback::get_most_recently_published_navigation' );

	// Default to the most recently created menu.
	$parsed_args = array(
		'post_type'              => 'wp_navigation',
		'no_found_rows'          => true,
		'update_post_meta_cache' => false,
		'update_post_term_cache' => false,
		'order'                  => 'DESC',
		'orderby'                => 'date',
		'post_status'            => 'publish',
		'posts_per_page'         => 1, // get only the most recent.
	);

	$navigation_post = new WP_Query( $parsed_args );
	if ( count( $navigation_post->posts ) > 0 ) {
		return $navigation_post->posts[0];
	}

	return null;
}
