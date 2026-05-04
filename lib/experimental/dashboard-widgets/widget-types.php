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
