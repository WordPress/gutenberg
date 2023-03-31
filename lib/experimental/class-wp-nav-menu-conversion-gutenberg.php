<?php
/**
 * WP_Nav_Menu_Conversion_Gutenberg class
 *
 * @package gutenberg
 * @since 6.3.0
 */

/**
 * Manages Fallback behavior for Navigation menus.
 *
 * @access public
 */
class WP_Nav_Menu_Conversion_Gutenberg {

	/**
	 * The Menu term object of the menu to convert.
	 *
	 * @var WP_Term
	 */
	private $menu;

	/**
	 * Constructor
	 *
	 * @param WP_Term $menu The Menu term object of the menu to convert.
	 */
	public function __construct( $menu ) {
		$this->menu = $menu;
	}

	/**
	 * Converts a Classic Menu to blocks.
	 *
	 * @return string the serialized and normalized parsed blocks.
	 */
	public function convert() {
		$menu_items = wp_get_nav_menu_items( $this->menu->term_id, array( 'update_post_term_cache' => false ) );

		// Set up the $menu_item variables.
		// Adds the class property classes for the current context, if applicable.
		_wp_menu_item_classes_by_context( $menu_items );

		$menu_items_by_parent_id = $this->group_by_parent_id( $menu_items );

		$inner_blocks = $this->to_blocks(
			isset( $menu_items_by_parent_id[0] )
			? $menu_items_by_parent_id[0]
			: array(),
			$menu_items_by_parent_id
		);

		return serialize_blocks( $inner_blocks );
	}

	/**
	 * Keys menu items keyed by the order in which they appear in the menu.
	 *
	 * @param array $menu_items the menu items to key.
	 * @return array
	 */
	private function key_by_order_id( $menu_items ) {
		return (array) $menu_items;
		$sorted_menu_items = array();

		foreach ( (array) $menu_items as $menu_item ) {
			$sorted_menu_items[ $menu_item->menu_order ] = $menu_item;
		}

		return $sorted_menu_items;
	}

	/**
	 * Returns an array of menu items grouped by the id of the parent menu item.
	 *
	 * @param array $menu_items An array of menu items.
	 * @return array
	 */
	private function group_by_parent_id( $menu_items ) {
		$menu_items_by_parent_id = array();

		foreach ( $menu_items as $menu_item ) {
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
	private function to_blocks( $menu_items, $menu_items_by_parent_id ) {

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
			? $this->to_blocks( $menu_items_by_parent_id[ $menu_item->ID ], $menu_items_by_parent_id )
			: array();
			$block['innerContent'] = array_map( 'serialize_block', $block['innerBlocks'] );

			$blocks[] = $block;
		}

		return $blocks;
	}




}
