<?php
/**
 * Server-rendered `@wordpress/ui` components, behind the
 * `gutenberg-ui-php-components` experiment.
 *
 * Each component renders from a small PHP template. Its classes come from the
 * recipe in `packages/ui/php/<name>/component.json`, resolved by the build to
 * the same scoped class names the React component uses, and its styles from
 * the stylesheet the build compiles from the package's CSS modules. Parity
 * tests check every combination of variants against React's own render.
 *
 * Only the component name and its props are a contract. The markup and class
 * names follow React, and may change between releases.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/markup.php';
require_once __DIR__ . '/preview-page.php';

/**
 * Returns the components the build generated, or an empty array when
 * `packages/ui/build-php` hasn't been built.
 *
 * @return array Components, by name.
 */
function gutenberg_ui_components_get_manifest() {
	static $components = null;

	if ( null === $components ) {
		$file       = gutenberg_dir_path() . 'packages/ui/build-php/manifest.json';
		$manifest   = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null;
		$components = $manifest['components'] ?? array();
	}

	return $components;
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
 * The content is plain text, escaped when rendered. Unknown or invalid props
 * fall back to their default with a `_doing_it_wrong()` notice, so the screen
 * still renders. Missing required content, or a missing or invalid required
 * prop, renders nothing.
 *
 * @param string      $name    Component name, such as `button`.
 * @param array       $props   Component props.
 * @param string|null $content Component content, such as a button's label.
 * @return string HTML, or an empty string when the component can't render.
 */
function gutenberg_get_ui_component( $name, $props = array(), $content = null ) {
	$components = gutenberg_ui_components_get_manifest();
	$render     = 'gutenberg_ui_render_' . str_replace( '-', '_', $name );

	if ( ! isset( $components[ $name ] ) || ( ! isset( $components[ $name ]['markup'] ) && ! function_exists( $render ) ) ) {
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

	if ( isset( $component['markup'] ) ) {
		return gutenberg_ui_components_render_markup( $component, $props, (string) $content );
	}

	$classes = $component['classes']['base'];
	foreach ( $component['classes']['variants'] as $prop => $values ) {
		// Recipes are JSON, so their keys are strings, including `"true"` and `"false"`.
		$value   = is_bool( $props[ $prop ] ) ? wp_json_encode( $props[ $prop ] ) : (string) $props[ $prop ];
		$classes = array_merge( $classes, $values[ $value ] ?? array() );
	}

	return $render( $props, $classes, (string) $content );
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
