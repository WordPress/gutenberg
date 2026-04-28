<?php
/**
 * Bootstraps the Dashboard Widgets page in wp-admin.
 *
 * @package gutenberg
 */

add_action( 'admin_menu', 'gutenberg_register_dashboard_widgets_menu' );
add_action( 'dashboard_init', 'gutenberg_dashboard_widgets_register_demo_widget' );
add_action( 'dashboard-wp-admin_init', 'gutenberg_dashboard_widgets_register_demo_widget' );
add_action( 'dashboard_init', 'gutenberg_dashboard_widgets_register_activity_widget' );
add_action( 'dashboard-wp-admin_init', 'gutenberg_dashboard_widgets_register_activity_widget' );

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
 * TEMPORARY DEMO — DELETE WHEN THE WIDGET RENDERING ENGINE LANDS.
 *
 * Wires the `hello-world` widget as a dynamic dep of the dashboard module
 * (via the route machinery, using a non-navigable path) so it lands in the
 * import map and `React.lazy` in the dashboard stage can resolve it.
 * The real implementation will wire widgets from layout state, not a
 * hardcoded demo registration.
 */
function gutenberg_dashboard_widgets_register_demo_widget() {
	$widget_module = 'wp/widgets/hello-world/render';

	if ( function_exists( 'gutenberg_register_dashboard_route' ) ) {
		gutenberg_register_dashboard_route( '/__widget_demo_hello_world', $widget_module );
	}

	if ( function_exists( 'gutenberg_register_dashboard_wp_admin_route' ) ) {
		gutenberg_register_dashboard_wp_admin_route( '/__widget_demo_hello_world', $widget_module );
	}
}

/**
 * Wires the `activity` widget as a dynamic dep of the dashboard module so it
 * lands in the import map and React.lazy in the dashboard stage can resolve it.
 */
function gutenberg_dashboard_widgets_register_activity_widget() {
	$widget_module = 'wp/widgets/activity/render';

	if ( function_exists( 'gutenberg_register_dashboard_route' ) ) {
		gutenberg_register_dashboard_route( '/__widget_activity', $widget_module );
	}

	if ( function_exists( 'gutenberg_register_dashboard_wp_admin_route' ) ) {
		gutenberg_register_dashboard_wp_admin_route( '/__widget_activity', $widget_module );
	}
}
