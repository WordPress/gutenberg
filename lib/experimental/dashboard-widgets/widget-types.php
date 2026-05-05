<?php
/**
 * Widget Types: server-side registry and client bootstrap.
 *
 * Hydrates `WP_Widget_Type_Registry` from the build manifest at `init`, and
 * exposes the registered widget types to the dashboard client through a
 * temporary inline global (`window.__registeredWidgetTypes`). The inline
 * transport is a stopgap until a REST endpoint replaces it.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-wp-widget-type.php';
require_once __DIR__ . '/class-wp-widget-type-registry.php';

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
 * Prints the inline script that exposes the widget types as a global.
 *
 * Temporary bridge: emits `window.__registeredWidgetTypes` so the
 * `core/widget-types` data store has data on first paint. Globals on
 * `window` are not the desired surface; this is a stopgap until a REST
 * endpoint backed by the widget type registry takes over and the resolver
 * fetches via `apiFetch`. Consumers should read widget types through the
 * `core/widget-types` data store, not by reaching into the global directly.
 */
function gutenberg_print_widget_types_bootstrap() {
	$widget_types = gutenberg_get_registered_widget_types();
	if ( empty( $widget_types ) ) {
		return;
	}

	$entries = array_values(
		array_map(
			static function ( $widget_type ) {
				return array_filter(
					array(
						'name'          => $widget_type->name,
						'render_module' => $widget_type->render_module,
						'widget_module' => $widget_type->widget_module,
					)
				);
			},
			$widget_types
		)
	);

	if ( empty( $entries ) ) {
		return;
	}

	wp_print_inline_script_tag(
		'window.__registeredWidgetTypes = ' . wp_json_encode( $entries ) . ';'
	);
}

add_action( 'admin_print_scripts', 'gutenberg_print_widget_types_bootstrap' );
