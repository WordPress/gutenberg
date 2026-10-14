<?php
/**
 * Server-rendered `@wordpress/ui` components, behind the
 * `gutenberg-ui-php-components` experiment.
 *
 * This file is the Gutenberg adapter: it points the renderer at the plugin's
 * build output and registers the assets. The renderer
 * and the component definitions don't depend on Gutenberg.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-gutenberg-ui-components.php';

/**
 * Returns the shared component renderer.
 *
 * @return Gutenberg_UI_Components
 */
function gutenberg_ui_components() {
	static $components = null;

	if ( null === $components ) {
		$components = new Gutenberg_UI_Components(
			gutenberg_dir_path() . 'packages/ui/build-php',
			gutenberg_url( 'packages/ui/build-php/' )
		);
	}

	return $components;
}

/**
 * Returns the HTML of a `@wordpress/ui` component.
 *
 * Only the component name and props are a contract. The markup and class
 * names change with `@wordpress/ui`, so don't style or query them.
 *
 * @param string $name  Component name, such as `button`.
 * @param array  $props Component props, as declared in the component's
 *                      `packages/ui/php/<name>/component.json`.
 * @return string Component HTML.
 */
function gutenberg_get_ui_component( $name, $props = array() ) {
	return gutenberg_ui_components()->render( $name, $props );
}

/**
 * Registers the component stylesheet.
 */
function gutenberg_register_ui_component_assets() {
	gutenberg_ui_components()->register_assets();
}
add_action( 'admin_enqueue_scripts', 'gutenberg_register_ui_component_assets', 1 );
