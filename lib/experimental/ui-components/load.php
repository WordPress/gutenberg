<?php
/**
 * Server-rendered `@wordpress/ui` components, behind the
 * `gutenberg-ui-php-components` experiment.
 *
 * This file is the Gutenberg adapter: it points the renderer at the plugin's
 * build output, registers the assets and adds the preview page. The renderer
 * and the component definitions don't depend on Gutenberg.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/class-gutenberg-ui-safe-html.php';
require_once __DIR__ . '/class-gutenberg-ui-components.php';
require_once __DIR__ . '/preview-page.php';

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
 * Content is escaped unless it's safe HTML, so it can't break the markup:
 *
 *     // Text: escaped.
 *     gutenberg_get_ui_component( 'card', array( 'title' => __( 'Settings' ) ), $user->display_name );
 *
 *     // Another component: inserted as HTML.
 *     gutenberg_get_ui_component( 'card', $props, gutenberg_get_ui_component( 'button', array( 'label' => __( 'Save' ) ) ) );
 *
 *     // A closure: what it prints is inserted, and it escapes its own values.
 *     gutenberg_get_ui_component( 'card', $props, function () use ( $user ) {
 *         echo '<p>' . esc_html( $user->display_name ) . '</p>';
 *     } );
 *
 * @param string $name    Component name, such as `button`.
 * @param array  $props   Component props, as declared in the component's
 *                        `packages/ui/php/<name>/component.json`.
 * @param mixed  $content Optional. Content, for components that accept it: a
 *                        string (escaped), `Gutenberg_UI_Safe_HTML` such as
 *                        another component, a closure, or a list of those.
 * @return Gutenberg_UI_Safe_HTML Component HTML. Prints like a string.
 */
function gutenberg_get_ui_component( $name, $props = array(), $content = null ) {
	return gutenberg_ui_components()->render( $name, $props, $content );
}

/**
 * Registers the component stylesheet.
 */
function gutenberg_register_ui_component_assets() {
	gutenberg_ui_components()->register_assets();
}
add_action( 'admin_enqueue_scripts', 'gutenberg_register_ui_component_assets', 1 );
