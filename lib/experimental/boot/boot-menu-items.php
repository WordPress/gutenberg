<?php
/**
 * Boot package menu item registration API.
 *
 * @package gutenberg
 */

/**
 * Registered menu items storage.
 *
 * @var array
 */
global $gutenberg_boot_menu_items;
$gutenberg_boot_menu_items = array();

/**
 * Register a boot menu item.
 *
 * @param string $id        Unique menu item ID.
 * @param string $label     Menu item label.
 * @param string $to        Route path the menu item links to.
 * @param string $parent_id Optional parent menu item ID.
 */
function gutenberg_register_boot_menu_item( $id, $label, $to, $parent_id = '' ) {
	global $gutenberg_boot_menu_items;

	$menu_item = array(
		'id'    => $id,
		'label' => $label,
		'to'    => $to,
	);

	// Only include parent if it's not empty (matches next-admin approach).
	if ( ! empty( $parent_id ) ) {
		$menu_item['parent'] = $parent_id;
	}

	$gutenberg_boot_menu_items[] = $menu_item;
}

/**
 * Get all registered boot menu items.
 *
 * @return array Array of registered menu items.
 */
function gutenberg_get_boot_menu_items() {
	global $gutenberg_boot_menu_items;
	return $gutenberg_boot_menu_items;
}
