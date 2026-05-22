<?php
/**
 * Bootstraps the Dashboard Widgets page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_dashboard_widgets_menu' );
add_action( 'dashboard_init', 'gutenberg_dashboard_widgets_register_events_widget' );
add_action( 'dashboard-wp-admin_init', 'gutenberg_dashboard_widgets_register_events_widget' );

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

/**
 * Wires the `events` widget as a dynamic dep of the dashboard module so it
 * lands in the import map and React.lazy in the dashboard stage can resolve it.
 */
function gutenberg_dashboard_widgets_register_events_widget() {
	$widget_module = 'wp/widgets/events/render';

	if ( function_exists( 'gutenberg_register_dashboard_route' ) ) {
		gutenberg_register_dashboard_route( '/__widget_events', $widget_module );
	}

	if ( function_exists( 'gutenberg_register_dashboard_wp_admin_route' ) ) {
		gutenberg_register_dashboard_wp_admin_route( '/__widget_events', $widget_module );
	}
}
