<?php
/**
 * Full Site Editing Utils
 *
 * @package gutenberg
 */

/**
 * Removes legacy adminbar items from FSE themes.
 *
 * @param WP_Admin_Bar $wp_admin_bar The admin-bar instance.
 */
function gutenberg_adminbar_items( $wp_admin_bar ) {

	// Add site-editor link.
	if ( ! is_admin() && current_user_can( 'edit_theme_options' ) ) {
		$wp_admin_bar->add_node(
			array(
				'id'    => 'site-editor',
				'title' => __( 'Edit site', 'gutenberg' ),
				'href'  => admin_url( 'admin.php?page=gutenberg-edit-site' ),
			)
		);
	}
}

add_action( 'admin_bar_menu', 'gutenberg_adminbar_items', 50 );

/**
 * Activates the 'menu_order' filter and then hooks into 'menu_order'
 */
add_filter( 'custom_menu_order', '__return_true' );
add_filter( 'menu_order', 'gutenberg_menu_order' );

/**
 * Filters WordPress default menu order
 *
 * @param array $menu_order Menu Order.
 */
function gutenberg_menu_order( $menu_order ) {
	$new_positions = array(
		// Position the site editor before the appearance menu.
		'gutenberg-edit-site' => array_search( 'themes.php', $menu_order, true ),
	);

	// Traverse through the new positions and move
	// the items if found in the original menu_positions.
	foreach ( $new_positions as $value => $new_index ) {
		$current_index = array_search( $value, $menu_order, true );
		if ( $current_index ) {
			$out = array_splice( $menu_order, $current_index, 1 );
			array_splice( $menu_order, $new_index, 0, $out );
		}
	}
	return $menu_order;
}
