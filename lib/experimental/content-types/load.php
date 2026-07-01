<?php
/**
 * Bootstraps the Content Types page in wp-admin under Settings.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', '_gutenberg_content_types_add_settings_menu_items', 11 );

/**
 * Registers the "Content Types" submenu item under Settings.
 *
 * @access private
 */
function _gutenberg_content_types_add_settings_menu_items() {
	if ( function_exists( 'gutenberg_content_types_wp_admin_render_page' ) ) {
		add_submenu_page(
			'options-general.php',
			__( 'Content Types', 'gutenberg' ),
			__( 'Content Types', 'gutenberg' ),
			'manage_options',
			'content-types-wp-admin',
			'gutenberg_content_types_wp_admin_render_page'
		);
	}
}
