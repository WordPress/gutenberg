<?php
/**
 * Server-rendered `@wordpress/ui` components, behind the
 * `gutenberg-ui-php-components` experiment.
 *
 * Each component renders from a small PHP template, which picks its classes as
 * the React component does, from the stylesheets listed in
 * `packages/ui/php/<name>/component.json`. The build compiles those stylesheets
 * with the same scoped class names as React. Parity tests check every
 * combination of variants against React's own render.
 *
 * Components that opt in are interactive: React mounts the real component over
 * what PHP printed (see `interactive.php`).
 *
 * Only the component name and its props are a contract. The markup and class
 * names follow React, and may change between releases.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/components/button.php';
require_once __DIR__ . '/components/searchable-select-control.php';
require_once __DIR__ . '/components/switch-control.php';
require_once __DIR__ . '/interactive.php';
require_once __DIR__ . '/preview-page.php';

/**
 * Reads what the build generated in `packages/ui/build-php`.
 *
 * @return array Manifest, or an empty array when it hasn't been built.
 */
function gutenberg_ui_components_read_manifest() {
	static $manifest = null;

	if ( null === $manifest ) {
		$file     = gutenberg_dir_path() . 'packages/ui/build-php/manifest.json';
		$decoded  = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null;
		$manifest = is_array( $decoded ) ? $decoded : array();
	}

	return $manifest;
}

/**
 * Returns the components the build generated, or an empty array when
 * `packages/ui/build-php` hasn't been built.
 *
 * @return array Components, by name.
 */
function gutenberg_ui_components_get_manifest() {
	return gutenberg_ui_components_read_manifest()['components'] ?? array();
}

/**
 * Returns the scoped class names of a stylesheet a component uses, as React
 * gets them when it imports the stylesheet.
 *
 * Internal: for component templates.
 *
 * @access private
 *
 * @param string $stylesheet Stylesheet listed in the component's
 *                           `component.json`, such as `button/style`.
 * @return string[] Scoped class names, by their name in the stylesheet.
 */
function gutenberg_ui_components_get_styles( $stylesheet ) {
	return gutenberg_ui_components_read_manifest()['styles'][ $stylesheet ] ?? array();
}

/**
 * Enqueues the components' stylesheet, registering it the first time.
 *
 * Rendering a component enqueues it too, but by then the head may already be
 * printed, so the styles would load in the footer. Screens that render
 * components should call this on `admin_enqueue_scripts`.
 */
function gutenberg_ui_components_enqueue_assets() {
	$file = gutenberg_dir_path() . 'packages/ui/build-php/style.css';
	if ( ! wp_style_is( 'wp-ui-components', 'registered' ) && is_readable( $file ) ) {
		wp_register_style(
			'wp-ui-components',
			gutenberg_url( 'packages/ui/build-php/style.css' ),
			// The stylesheet has fallbacks for every design token, but uses the
			// tokens from the theme stylesheet when it's there.
			wp_style_is( 'wp-theme', 'registered' ) ? array( 'wp-theme' ) : array(),
			(string) filemtime( $file )
		);
	}

	wp_enqueue_style( 'wp-ui-components' );
}

/**
 * Returns the HTML of a `@wordpress/ui` component.
 *
 * The content is plain text, escaped with `esc_html()` when rendered. Unknown
 * or invalid props fall back to their default with a `_doing_it_wrong()`
 * notice, so the screen still renders. Missing required content, or a missing
 * or invalid required prop, renders nothing.
 *
 * @param string      $name    Component name, such as `button`.
 * @param array       $props   Component props.
 * @param string|null $content Component content, such as a button's label.
 * @return string HTML, or an empty string when the component can't render.
 */
function gutenberg_get_ui_component( $name, $props = array(), $content = null ) {
	$components = gutenberg_ui_components_get_manifest();
	$render     = '_gutenberg_ui_render_' . str_replace( '-', '_', $name );

	if ( ! isset( $components[ $name ] ) || ! function_exists( $render ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			/* translators: %s: Component name. */
			esc_html( sprintf( __( 'There is no "%s" UI component.', 'gutenberg' ), $name ) ),
			'24.4.0'
		);
		return '';
	}

	$component = $components[ $name ];
	$props     = gutenberg_ui_components_validate_props( $name, $component['props'], (array) $props );
	if ( null === $props ) {
		return '';
	}

	if ( ! empty( $component['content']['required'] ) && ( ! is_string( $content ) || '' === $content ) ) {
		_doing_it_wrong(
			__FUNCTION__,
			/* translators: %s: Component name. */
			esc_html( sprintf( __( 'The "%s" component needs text content.', 'gutenberg' ), $name ) ),
			'24.4.0'
		);
		return '';
	}

	gutenberg_ui_components_enqueue_assets();

	$html = $render( $props, (string) $content );

	return isset( $component['interactive'] ) ? gutenberg_ui_components_wrap_interactive( $component, $props, $html ) : $html;
}

/**
 * Prints a `@wordpress/ui` component.
 *
 * See `gutenberg_get_ui_component()`, which returns the HTML instead.
 *
 * @param string      $name    Component name, such as `button`.
 * @param array       $props   Component props.
 * @param string|null $content Component content, such as a button's label.
 */
function gutenberg_ui_component( $name, $props = array(), $content = null ) {
	// Components escape their own output.
	echo gutenberg_get_ui_component( $name, $props, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Validates props against a component's schema.
 *
 * @param string $name   Component name.
 * @param array  $schema Props schema.
 * @param array  $props  Props.
 * @return array|null Validated props, with defaults filled in, or null when a
 *                    required prop is missing or invalid.
 */
function gutenberg_ui_components_validate_props( $name, $schema, $props ) {
	foreach ( array_keys( array_diff_key( $props, $schema ) ) as $prop ) {
		_doing_it_wrong(
			'gutenberg_get_ui_component',
			/* translators: 1: Prop name. 2: Component name. */
			esc_html( sprintf( __( 'Unknown prop "%1$s" for the "%2$s" component.', 'gutenberg' ), $prop, $name ) ),
			'24.4.0'
		);
	}

	$validated = array();
	foreach ( $schema as $prop => $prop_schema ) {
		$is_required = ! empty( $prop_schema['required'] );

		if ( ! array_key_exists( $prop, $props ) ) {
			if ( $is_required ) {
				_doing_it_wrong(
					'gutenberg_get_ui_component',
					/* translators: 1: Prop name. 2: Component name. */
					esc_html( sprintf( __( 'The "%1$s" prop is required for the "%2$s" component.', 'gutenberg' ), $prop, $name ) ),
					'24.4.0'
				);
				return null;
			}
			$validated[ $prop ] = $prop_schema['default'];
			continue;
		}

		$error = rest_validate_value_from_schema( $props[ $prop ], $prop_schema, $prop );
		if ( is_wp_error( $error ) ) {
			_doing_it_wrong(
				'gutenberg_get_ui_component',
				/* translators: 1: Component name. 2: Validation error. */
				esc_html( sprintf( __( 'Invalid prop for the "%1$s" component: %2$s', 'gutenberg' ), $name, $error->get_error_message() ) ),
				'24.4.0'
			);
			if ( $is_required ) {
				return null;
			}
			$validated[ $prop ] = $prop_schema['default'];
			continue;
		}

		// Validation accepts `1` or `'true'` for a boolean; templates need the real type.
		$validated[ $prop ] = rest_sanitize_value_from_schema( $props[ $prop ], $prop_schema, $prop );
	}

	return $validated;
}
