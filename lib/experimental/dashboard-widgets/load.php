<?php
/**
 * Bootstraps the Dashboard Widgets page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_dashboard_widgets_menu' );

/**
 * Registers the Dashboard Widgets menu item.
 */
function gutenberg_register_dashboard_widgets_menu() {
	add_menu_page(
		__( 'Dashboard (Beta)', 'gutenberg' ),
		__( 'Dashboard (Beta)', 'gutenberg' ),
		'read',
		'dashboard-wp-admin',
		'gutenberg_dashboard_wp_admin_render_page',
		'dashicons-dashboard',
		1
	);
}
