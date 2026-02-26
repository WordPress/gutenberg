<?php
/**
 * Bootstraps the Connectors page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', '_gutenberg_connectors_add_settings_menu_item' );

/**
 * Registers the Connectors menu item under Settings.
 *
 * @access private
 */
function _gutenberg_connectors_add_settings_menu_item(): void {
	add_submenu_page(
		'options-general.php',
		__( 'Connectors', 'gutenberg' ),
		__( 'Connectors', 'gutenberg' ),
		'manage_options',
		'connectors-wp-admin',
		'gutenberg_connectors_wp_admin_render_page',
		1
	);
}

require __DIR__ . '/default-connectors.php';
