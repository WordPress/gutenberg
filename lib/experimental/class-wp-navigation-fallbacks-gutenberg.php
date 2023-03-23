<?php
/**
 * WP_Navigation_Fallbacks_Gutenberg class
 *
 * @package gutenberg
 * @since 6.3.0
 */

/**
 * Manages Fallback behavior for Navigation menus.
 *
 * @access public
 */
class WP_Navigation_Fallbacks_Gutenberg {

	/**
	 * Gets (and/or creates) an appropriate fallback Navigation Menu.
	 *
	 * @return WP_Post|null the fallback Navigation Post or null.
	 */
	public static function get_fallback_menu() {

		// 1.
		// Get the most recently published Navigation post.
		$navigation_post = static::get_most_recently_published_navigation();

		if ( $navigation_post ) {
			return $navigation_post;
		}

		// 2.
		// If there are no navigation posts then try to find a classic menu
		// and convert it into a block based navigation menu.
		$navigation_post = static::create_classic_menu_fallback();

		if ( $navigation_post && ! is_wp_error( $navigation_post ) ) {
			// Fetch the newly created Navigation post.
			return static::get_most_recently_published_navigation();
		}

		// 3.
		// If there are no navigation posts then default to a list of Pages.
		$navigation_post = static::create_default_fallback();

		if ( $navigation_post && ! is_wp_error( $navigation_post ) ) {
			// Fetch the newly created Navigation post.
			return static::get_most_recently_published_navigation();
		}

		// It was not possible to create a fallback.
		return null;
	}




	/**
	 * Finds the most recently published `wp_navigation` Post.
	 *
	 * @return WP_Post|null the first non-empty Navigation or null.
	 */
	public static function get_most_recently_published_navigation() {

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

	/**
	 * Creates a Navigation Menu post from a Classic Menu.
	 *
	 * @return int|WP_Error The post ID of the default fallback menu or a WP_Error object.
	 */
	public static function create_classic_menu_fallback() {
		// See if we have a classic menu.
		$classic_nav_menu = static::get_classic_menu_fallback();

		if ( ! $classic_nav_menu ) {
			return new WP_Error( 'no_classic_menus', 'No Classic Menus found.' );
		}

		// If we have a classic menu then convert it to blocks.
		$classic_nav_menu_blocks = static::get_classic_menu_fallback_blocks( $classic_nav_menu );

		if ( empty( $classic_nav_menu_blocks ) ) {
			return new WP_Error( 'cannot_convert_classic', 'Unable to convert Classic Menu to blocks.' );
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

		return $wp_insert_post_result;
	}

	/**
	 * Get the classic navigation menu to use as a fallback.
	 *
	 * @return object WP_Term The classic navigation.
	 */
	public static function get_classic_menu_fallback() {
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
				function( $a, $b ) {
					return $b->term_id - $a->term_id;
				}
			);
			return $classic_nav_menus[0];
		}
	}

	/**
	 * Converts a classic navigation to blocks.
	 *
	 * @param  object $classic_nav_menu WP_Term The classic navigation object to convert.
	 * @return array the normalized parsed blocks.
	 */
	public static function get_classic_menu_fallback_blocks( $classic_nav_menu ) {
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

		$inner_blocks = static::parse_blocks_from_menu_items(
			isset( $menu_items_by_parent_id[0] )
			? $menu_items_by_parent_id[0]
			: array(),
			$menu_items_by_parent_id
		);

		return serialize_blocks( $inner_blocks );
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
	public static function parse_blocks_from_menu_items( $menu_items, $menu_items_by_parent_id ) {
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
			? static::parse_blocks_from_menu_items( $menu_items_by_parent_id[ $menu_item->ID ], $menu_items_by_parent_id )
			: array();
			$block['innerContent'] = array_map( 'serialize_block', $block['innerBlocks'] );

			$blocks[] = $block;
		}

		return $blocks;
	}



	/**
	 * Creates a default Navigation Menu fallback.
	 *
	 * @return int|WP_Error The post ID of the default fallback menu or a WP_Error object.
	 */
	private static function create_default_fallback() {
		$registry = WP_Block_Type_Registry::get_instance();

		// If `core/page-list` is not registered then use empty blocks.
		$default_blocks = $registry->is_registered( 'core/page-list' ) ? '<!-- wp:page-list /-->' : '';

		// Create a new navigation menu from the fallback blocks.
		$wp_insert_post_result = wp_insert_post(
			array(
				'post_content' => $default_blocks,
				'post_title'   => _x( 'Navigation', 'Title of a Navigation menu', 'gutenberg' ),
				'post_name'    => 'navigation',
				'post_status'  => 'publish',
				'post_type'    => 'wp_navigation',
			),
			true // So that we can check whether the result is an error.
		);

		return $wp_insert_post_result;
	}
}
