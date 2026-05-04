<?php
/**
 * Widget types client bootstrap.
 *
 * Temporary bridge: exposes the build-discovered widgets to the client as
 * the `window.__registeredWidgetTypes` global so the `core/widget-types`
 * resolver has data to read on first paint. Globals on `window` are not
 * the desired surface; this is a stopgap until a REST endpoint backed by
 * a server-side registry takes over and the resolver fetches via
 * `apiFetch`.
 *
 * @package gutenberg
 */

/**
 * Builds the bootstrap entries from the build manifest.
 *
 * @return array<int, array{ name: string, render_module?: string, widget_module?: string }>
 */
function gutenberg_get_widget_types_bootstrap_entries() {
	if ( ! function_exists( 'gutenberg_get_registered_widget_modules' ) ) {
		return array();
	}

	$widgets = gutenberg_get_registered_widget_modules();
	$entries = array();

	foreach ( $widgets as $widget ) {
		if ( empty( $widget['name'] ) || empty( $widget['dir_name'] ) ) {
			continue;
		}

		$entry = array( 'name' => $widget['name'] );

		if ( ! empty( $widget['has_render'] ) ) {
			$entry['render_module'] = 'wp/widgets/' . $widget['dir_name'] . '/render';
		}
		if ( ! empty( $widget['has_widget'] ) ) {
			$entry['widget_module'] = 'wp/widgets/' . $widget['dir_name'] . '/widget';
		}

		$entries[] = $entry;
	}

	return $entries;
}

/**
 * Prints the inline script that exposes the widget types as a global.
 *
 * Consumers should read widget types through the `core/widget-types` data
 * store, not by reaching into the global directly.
 */
function gutenberg_print_widget_types_bootstrap() {
	$entries = gutenberg_get_widget_types_bootstrap_entries();
	if ( empty( $entries ) ) {
		return;
	}

	wp_print_inline_script_tag(
		'window.__registeredWidgetTypes = ' . wp_json_encode( $entries ) . ';'
	);
}

add_action( 'admin_print_scripts', 'gutenberg_print_widget_types_bootstrap' );

/**
 * Returns dynamic script-module dependency entries for the registered
 * widget types.
 *
 * Surfaces consume this through the `{page}_script_module_dependencies`
 * filter to add widgets to their page's import map. The entries use
 * `'import' => 'dynamic'`, so the modules enter the import map without
 * being downloaded eagerly: the bytes are fetched only when something
 * calls `import()` on the handle.
 *
 * @param string[]|null $widget_names Optional. When provided, only widgets
 *                                    whose `name` is in the list are
 *                                    included. When null (the default),
 *                                    every registered widget is included.
 * @return array<int, array{ id: string, import: string }>
 */
function gutenberg_get_widget_module_dependencies( $widget_names = null ) {
	if ( ! function_exists( 'gutenberg_get_registered_widget_modules' ) ) {
		return array();
	}

	$widgets      = gutenberg_get_registered_widget_modules();
	$dependencies = array();

	foreach ( $widgets as $widget ) {
		if ( empty( $widget['name'] ) || empty( $widget['dir_name'] ) ) {
			continue;
		}
		if ( null !== $widget_names && ! in_array( $widget['name'], $widget_names, true ) ) {
			continue;
		}

		if ( ! empty( $widget['has_widget'] ) ) {
			$dependencies[] = array(
				'id'     => 'wp/widgets/' . $widget['dir_name'] . '/widget',
				'import' => 'dynamic',
			);
		}
		if ( ! empty( $widget['has_render'] ) ) {
			$dependencies[] = array(
				'id'     => 'wp/widgets/' . $widget['dir_name'] . '/render',
				'import' => 'dynamic',
			);
		}
	}

	return $dependencies;
}

/**
 * Adds widget script-module dependencies to the dashboard page.
 *
 * @param array $dependencies Existing dependencies.
 * @return array
 */
function gutenberg_dashboard_widgets_module_dependencies( $dependencies ) {
	return array_merge( $dependencies, gutenberg_get_widget_module_dependencies() );
}

add_filter( 'dashboard_script_module_dependencies', 'gutenberg_dashboard_widgets_module_dependencies' );
add_filter( 'dashboard_wp_admin_script_module_dependencies', 'gutenberg_dashboard_widgets_module_dependencies' );
