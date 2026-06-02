<?php
/**
 * Widget Types: server-side registry and REST exposure.
 *
 * Hydrates `WP_Widget_Type_Registry` from the build manifest at `init`,
 * and exposes the registry to the client through the
 * `/wp/v2/widget-modules` REST endpoint. The JS layer reads the endpoint
 * via core-data and dynamically imports each widget's render module on
 * the consumer side.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-wp-widget-type.php';
require_once __DIR__ . '/class-wp-widget-type-registry.php';
require_once __DIR__ . '/class-wp-rest-widget-modules-controller.php';

/**
 * Hydrates the widget type registry from the build manifest.
 *
 * Iterates the widgets discovered by the build pipeline (via
 * `gutenberg_get_registered_widget_modules()`) and registers each one in
 * `WP_Widget_Type_Registry`. The manifest is the single source of widget
 * authorship in this codebase; this loop is a deterministic copy of it
 * into the in-memory registry, with no filters in between.
 */
function gutenberg_register_widget_types() {
	if ( ! function_exists( 'gutenberg_get_registered_widget_modules' ) ) {
		return;
	}

	$registry = WP_Widget_Type_Registry::get_instance();

	foreach ( gutenberg_get_registered_widget_modules() as $widget ) {
		if ( empty( $widget['name'] ) || $registry->is_registered( $widget['name'] ) ) {
			continue;
		}

		$registry->register(
			$widget['name'],
			array(
				'render_module' => $widget['render_module'] ?? null,
				'widget_module' => $widget['widget_module'] ?? null,
				'presentation'  => $widget['presentation'] ?? null,
			)
		);
	}
}

if ( did_action( 'init' ) ) {
	gutenberg_register_widget_types();
} else {
	add_action( 'init', 'gutenberg_register_widget_types' );
}

/**
 * Returns all widget types registered in the widget type registry.
 *
 * Convenience accessor around `WP_Widget_Type_Registry::get_all_registered()`
 * for callers that prefer a function-based API.
 *
 * @return WP_Widget_Type[] Associative array of `$name => $widget_type`
 *                          pairs.
 */
function gutenberg_get_registered_widget_types() {
	return WP_Widget_Type_Registry::get_instance()->get_all_registered();
}

/**
 * Registers the REST controller that exposes the widget type registry.
 */
function gutenberg_register_widget_modules_rest_controller() {
	$controller = new WP_REST_Widget_Modules_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_widget_modules_rest_controller' );

/**
 * Adds the registered widget modules to the dashboard page's boot
 * dependencies.
 *
 * The wp-build page templates expose a generic
 * `{page-id}-wp-admin_boot_dependencies` filter. The dashboard hooks
 * it to make every registered widget render and metadata module
 * available in the page's import map for dynamic `import()` calls.
 *
 * Both the render module and the metadata module are added as
 * 'dynamic' dependencies so they are reachable from the import map but
 * not eagerly executed.
 *
 * @param array $boot_dependencies Boot dependencies for the page.
 * @return array Updated boot dependencies.
 */
function gutenberg_add_widget_modules_to_dashboard_boot_deps( $boot_dependencies ) {
	foreach ( gutenberg_get_registered_widget_types() as $widget_type ) {
		if ( $widget_type->render_module ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget_type->render_module,
			);
		}
		if ( $widget_type->widget_module ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $widget_type->widget_module,
			);
		}
	}

	return $boot_dependencies;
}
add_filter( 'dashboard-wp-admin_boot_dependencies', 'gutenberg_add_widget_modules_to_dashboard_boot_deps' );
