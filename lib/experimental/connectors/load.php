<?php
/**
 * Bootstraps the Connectors page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_connectors_add_settings_menu_item' );

/**
 * Registers the Connectors menu item under Settings.
 */
function gutenberg_connectors_add_settings_menu_item() {
	add_submenu_page(
		'options-general.php',
		__( 'Connectors', 'gutenberg' ),
		__( 'Connectors', 'gutenberg' ),
		'manage_options',
		'connections-wp-admin',
		'gutenberg_connections_wp_admin_render_page'
	);
}
