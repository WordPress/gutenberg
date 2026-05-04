<?php
/**
 * Widget types client bootstrap.
 *
 * Bridge layer between the build manifest and the client-side data store.
 * Reads the widgets discovered by the build pipeline and exposes them to the
 * client as `window.__registeredWidgetTypes`, which the `core/widget-types`
 * resolver consumes to import each widget's metadata module on demand.
 *
 * The data source is `gutenberg_get_registered_widget_modules()`, the getter
 * emitted by `wp-build` alongside the script-module registration in
 * `build/widgets.php`. Going through that getter keeps a single read of the
 * manifest per request and matches the registry+getter pattern used for
 * routes and pages.
 *
 * Internal-only: there is no public PHP registration surface. Authoring of
 * widget types stays 100% build-driven via the `widgets/` folder.
 *
 * Provisional bridge: this inline-payload approach hands first-paint
 * consumers a populated store with no extra round-trip. The longer-term
 * direction is a server-side widget type registry exposed through a REST
 * endpoint, which the resolver will consume via `apiFetch`. When that lands,
 * the inline payload becomes optional (a hydration prefill the resolver
 * picks up when present, falling back to the endpoint otherwise).
 *
 * @package gutenberg
 */

/**
 * Builds the bootstrap entries from the build manifest.
 *
 * Maps each widget discovered by `wp-build` into the shape consumed by the
 * client resolver: `{ name, render_module?, widget_module? }`. Module handles
 * follow the convention `wp/widgets/{dir}/{render|widget}` produced by
 * `gutenberg_register_widget_modules()`.
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
 * Prints the inline script that exposes the widget types as a global on
 * every admin page.
 *
 * The global is a transitional surface (see file header). Consumers should
 * read widget types through the `core/widget-types` data store rather than
 * touching the global directly.
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
