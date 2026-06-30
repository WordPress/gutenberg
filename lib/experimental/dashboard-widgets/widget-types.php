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
 * Returns the i18n schema describing which widget metadata fields are
 * translatable and the gettext context to use for each.
 *
 * Read once from widget-i18n.json and memoized for the rest of the request.
 *
 * @return array Map of translatable field name to gettext context.
 */
function gutenberg_get_widget_metadata_i18n_schema() {
	static $i18n_schema = null;

	if ( null === $i18n_schema ) {
		$schema      = wp_json_file_decode( __DIR__ . '/widget-i18n.json', array( 'associative' => true ) );
		$i18n_schema = is_array( $schema ) ? $schema : array();
	}

	return $i18n_schema;
}

/**
 * Translates a widget's user-facing metadata strings.
 *
 * Runs `title`, `description`, and `keywords` through the widget i18n schema
 * using the widget's `textdomain`, leaving every other key untouched. A no-op
 * when the widget declares no `textdomain`.
 *
 * @param array $widget Widget data from the build manifest.
 * @return array Widget data with its translatable strings localized.
 */
function gutenberg_translate_widget_metadata( $widget ) {
	$textdomain = $widget['textdomain'] ?? null;
	if ( ! $textdomain ) {
		return $widget;
	}

	$i18n_schema = gutenberg_get_widget_metadata_i18n_schema();

	foreach ( array( 'title', 'description', 'keywords' ) as $field ) {
		if ( isset( $widget[ $field ], $i18n_schema[ $field ] ) ) {
			$widget[ $field ] = translate_settings_using_i18n_schema( $i18n_schema[ $field ], $widget[ $field ], $textdomain );
		}
	}

	return $widget;
}

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

		$widget = gutenberg_translate_widget_metadata( $widget );

		$registry->register(
			$widget['name'],
			array(
				'render_module' => $widget['render_module'] ?? null,
				'widget_module' => $widget['widget_module'] ?? null,
				'presentation'  => $widget['presentation'] ?? null,
				'category'      => $widget['category'] ?? null,
				'title'         => $widget['title'] ?? null,
				'description'   => $widget['description'] ?? null,
				'keywords'      => $widget['keywords'] ?? null,
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
