<?php
/**
 * Bootstraps the Connections page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_connections_add_settings_menu_item' );

/**
 * Registers the Connections menu item under Settings.
 */
function gutenberg_connections_add_settings_menu_item() {
	add_submenu_page(
		'options-general.php',
		__( 'Connections', 'gutenberg' ),
		__( 'Connections', 'gutenberg' ),
		'manage_options',
		'connections-wp-admin',
		'gutenberg_connections_wp_admin_render_page'
	);
}
