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
		'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMTIgNEw0IDcuOVYyMGgxNlY3LjlMMTIgNHptNi41IDE0LjVIMTRWMTNoLTR2NS41SDUuNVY4LjhMMTIgNS43bDYuNSAzLjF2OS43eiI+PC9wYXRoPjwvc3ZnPg==',
		1
	);
}
