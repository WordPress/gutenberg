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
 * Prints the inline script that exposes the widget types as a global.
 *
 * Consumers should read widget types through the `core/widget-types` data
 * store, not by reaching into the global directly.
 */
function gutenberg_print_widget_types_bootstrap() {
	if ( ! function_exists( 'gutenberg_get_registered_widget_modules' ) ) {
		return;
	}

	$entries = array_values(
		array_filter(
			array_map(
				static function ( $widget ) {
					if ( empty( $widget['name'] ) ) {
						return null;
					}
					return array_filter(
						array(
							'name'          => $widget['name'],
							'render_module' => $widget['render_module'] ?? null,
							'widget_module' => $widget['widget_module'] ?? null,
						)
					);
				},
				gutenberg_get_registered_widget_modules()
			)
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
