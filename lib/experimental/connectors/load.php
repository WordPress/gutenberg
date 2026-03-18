<?php
/**
 * Bootstraps the Connectors page in wp-admin.
 *
 * @package gutenberg
 */

// Priority 11 to run after Core's menu.php sets up the connectors menu.
add_action( 'admin_menu', '_gutenberg_connectors_add_settings_menu_item', 11 );

/**
 * Registers the Connectors menu item under Settings.
 * Removes Core's connectors menu item first to prevent duplication.
 *
 * @access private
 */
function _gutenberg_connectors_add_settings_menu_item(): void {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) || ! function_exists( 'gutenberg_options_connectors_wp_admin_render_page' ) ) {
		return;
	}

	// Remove Core's connectors menu item if it exists.
	remove_submenu_page( 'options-general.php', 'connectors-wp-admin' );
	remove_submenu_page( 'options-general.php', 'options-connectors.php' );

	add_submenu_page(
		'options-general.php',
		__( 'Connectors', 'gutenberg' ),
		__( 'Connectors', 'gutenberg' ),
		'manage_options',
		'options-connectors-wp-admin',
		'gutenberg_options_connectors_wp_admin_render_page',
		1
	);
}

require __DIR__ . '/default-connectors.php';
