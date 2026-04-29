<?php
/**
 * Bootstraps the Content Types pages (Taxonomies) in wp-admin under Settings.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', '_gutenberg_content_types_add_settings_menu_items', 11 );

/**
 * Registers "Taxonomies" submenu items under Settings.
 *
 * @access private
 */
function _gutenberg_content_types_add_settings_menu_items() {
	if ( function_exists( 'gutenberg_taxonomies_wp_admin_render_page' ) ) {
		add_submenu_page(
			'options-general.php',
			__( 'Taxonomies', 'gutenberg' ),
			__( 'Taxonomies', 'gutenberg' ),
			'manage_options',
			'taxonomies-wp-admin',
			'gutenberg_taxonomies_wp_admin_render_page'
		);
	}
}
