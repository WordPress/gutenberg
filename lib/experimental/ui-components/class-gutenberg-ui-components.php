<?php
/**
 * Renders `@wordpress/ui` components on server-rendered admin screens.
 *
 * The public contract is `render( $name, $props )`: a component name and
 * props in, HTML out. The props each component accepts are declared in
 * `packages/ui/php/<name>/component.json`. The markup and class names are not
 * part of the contract and change with `@wordpress/ui`.
 *
 * The markup comes from `packages/ui/build-php/manifest.php`, which the build
 * generates by rendering the React components: one snapshot per combination
 * of variant props, with slots for the free-form props. Rendering picks the
 * snapshot and fills in the slots and translated strings, so there is no markup
 * to maintain here.
 *
 * @package gutenberg
 */

/**
 * Server-rendered `@wordpress/ui` components, loaded from the generated manifest.
 */
final class Gutenberg_UI_Components {

	/**
	 * Directory of the build output, with a trailing slash.
	 *
	 * @var string
	 */
	private $dir;

	/**
	 * URL of the build output, with a trailing slash.
	 *
	 * @var string
	 */
	private $url;

	/**
	 * The generated manifest, or null when it hasn't been built.
	 *
	 * @var array|null
	 */
	private $manifest;

	/**
	 * Prefix of the asset handles.
	 *
	 * @var string
	 */
	private $prefix;

	/**
	 * Constructor.
	 *
	 * A plugin that bundles its own copy of the build output passes its own
	 * prefix, so its stylesheet loads next to core's instead of replacing it
	 * or being skipped.
	 *
	 * @param string $dir    Directory of the build output.
	 * @param string $url    URL of the build output.
	 * @param string $prefix Optional. Prefix of the asset handles. Default 'wp-ui-'.
	 */
	public function __construct( $dir, $url, $prefix = 'wp-ui-' ) {
		$this->dir    = trailingslashit( $dir );
		$this->url    = trailingslashit( $url );
		$this->prefix = $prefix;

		$manifest       = $this->dir . 'manifest.php';
		$this->manifest = is_readable( $manifest ) ? require $manifest : null;
	}

	/**
	 * Whether the build output is available.
	 *
	 * @return bool
	 */
	public function is_available() {
		return is_array( $this->manifest );
	}

	/**
	 * Returns a component's props and variants, as declared in its `component.json`.
	 *
	 * @param string $name Component name.
	 * @return array|null Component metadata, or null if there's no such component.
	 */
	public function get_component_metadata( $name ) {
		if ( ! is_string( $name ) || ! isset( $this->manifest['components'][ $name ] ) ) {
			return null;
		}

		return $this->manifest['components'][ $name ];
	}

	/**
	 * Registers the stylesheet.
	 *
	 * Screens that render components should enqueue it in the head with
	 * `enqueue_assets()`; otherwise `render()` enqueues it late, and it prints
	 * in the footer.
	 */
	public function register_assets() {
		if ( ! $this->is_available() ) {
			return;
		}

		$version = $this->manifest['version'] . '-' . filemtime( $this->dir . 'manifest.php' );

		wp_register_style( $this->prefix . 'components', $this->url . 'style.css', array( 'wp-theme' ), $version );
	}

	/**
	 * Enqueues the stylesheet.
	 */
	public function enqueue_assets() {
		if ( ! $this->is_available() ) {
			return;
		}

		// Rendering can happen before `admin_enqueue_scripts`.
		if ( ! wp_style_is( $this->prefix . 'components', 'registered' ) ) {
			$this->register_assets();
		}
		wp_enqueue_style( $this->prefix . 'components' );
	}

	/**
	 * Renders a component.
	 *
	 * Props are checked against the component's schema. An unknown prop is
	 * dropped, and an invalid value falls back to the default, each with a
	 * `_doing_it_wrong()` notice, so callers find mistakes without breaking
	 * the screen.
	 *
	 * @param string $name  Component name, e.g. `button`.
	 * @param array  $props Component props.
	 * @return string Component HTML, or an empty string if it can't be rendered.
	 */
	public function render( $name, $props = array() ) {
		$component = $this->get_component_metadata( $name );
		if ( ! $component ) {
			$this->doing_it_wrong(
				/* translators: %s: Component name. */
				sprintf( __( 'Unknown component "%s".', 'gutenberg' ), $name )
			);
			return '';
		}

		$props = $this->apply_deprecations( $component['deprecations'], (array) $props );
		$props = $this->validate_props( $name, $component['props'], $props );
		if ( null === $props ) {
			return '';
		}

		$this->enqueue_assets();

		return $this->fill_snapshot( $component, $props );
	}

	/**
	 * Builds the key of the snapshot for the given props.
	 *
	 * @param array $component Component metadata.
	 * @param array $props     Validated props.
	 * @return string Snapshot key.
	 */
	private function get_snapshot_key( $component, $props ) {
		$key = array();
		foreach ( $component['variants'] as $prop ) {
			$value = $props[ $prop ];
			$key[] = $prop . '=' . ( is_bool( $value ) ? ( $value ? 'true' : 'false' ) : $value );
		}

		return implode( '&', $key );
	}

	/**
	 * Fills in a snapshot's slots and translated strings.
	 *
	 * @param array $component Component metadata.
	 * @param array $props     Validated props.
	 * @return string Component HTML.
	 */
	private function fill_snapshot( $component, $props ) {
		$html = '';
		foreach ( $component['snapshots'][ $this->get_snapshot_key( $component, $props ) ] as $part ) {
			if ( is_string( $part ) ) {
				$html .= $part;
				continue;
			}

			switch ( $part[0] ) {
				case 'slot':
					$value = (string) $props[ $part[1] ];
					if ( 'attribute' === $part[2] ) {
						// React blocks `javascript:` URLs; esc_url() does the same here.
						$html .= in_array( $part[3], array( 'href', 'src', 'action', 'formaction' ), true ) ? esc_url( $value ) : esc_attr( $value );
					} elseif ( isset( $component['props'][ $part[1] ]['format'] ) && 'html' === $component['props'][ $part[1] ]['format'] ) {
						// HTML props are printed as is; callers escape what they pass.
						$html .= $value;
					} else {
						$html .= esc_html( $value );
					}
					break;

				case 'text':
					// A string React translates with `__()`, such as a "Dismiss" label.
					$text  = translate( $part[1], $part[2] ); // phpcs:ignore WordPress.WP.I18n -- Strings from the React components.
					$html .= 'attribute' === $part[3] ? esc_attr( $text ) : esc_html( $text );
					break;
			}
		}

		return $html;
	}

	/**
	 * Keeps deprecated props and values working by mapping them to their
	 * replacements, with a `_deprecated_argument()` notice.
	 *
	 * A deprecation is `{ prop, replacement, since }` for a renamed prop, or
	 * `{ prop, value, replacement, since }` for a renamed value.
	 *
	 * @param array $deprecations The component's deprecations.
	 * @param array $props        Props passed by the caller.
	 * @return array Props with the replacements applied.
	 */
	private function apply_deprecations( $deprecations, $props ) {
		foreach ( $deprecations as $deprecation ) {
			$prop = $deprecation['prop'];
			if ( ! array_key_exists( $prop, $props ) ) {
				continue;
			}

			if ( isset( $deprecation['value'] ) ) {
				if ( $props[ $prop ] !== $deprecation['value'] ) {
					continue;
				}
				$props[ $prop ] = $deprecation['replacement'];
				/* translators: 1: Old value. 2: Prop name. 3: New value. */
				$message = sprintf( __( 'The "%1$s" value of "%2$s" is deprecated. Use "%3$s" instead.', 'gutenberg' ), $deprecation['value'], $prop, $deprecation['replacement'] );
			} else {
				if ( ! array_key_exists( $deprecation['replacement'], $props ) ) {
					$props[ $deprecation['replacement'] ] = $props[ $prop ];
				}
				unset( $props[ $prop ] );
				/* translators: 1: Old prop name. 2: New prop name. */
				$message = sprintf( __( 'The "%1$s" prop is deprecated. Use "%2$s" instead.', 'gutenberg' ), $prop, $deprecation['replacement'] );
			}

			_deprecated_argument( __CLASS__ . '::render', esc_html( $deprecation['since'] ), esc_html( $message ) );
		}

		return $props;
	}

	/**
	 * Checks props against a component's schema and fills in defaults.
	 *
	 * @param string $name   Component name.
	 * @param array  $schema Prop schemas, keyed by prop name.
	 * @param array  $props  Props passed by the caller.
	 * @return array|null Props to render with, or null if a required prop is missing.
	 */
	private function validate_props( $name, $schema, $props ) {
		foreach ( array_keys( array_diff_key( $props, $schema ) ) as $prop ) {
			$this->doing_it_wrong(
				/* translators: 1: Prop name. 2: Component name. */
				sprintf( __( 'Unknown prop "%1$s" for the "%2$s" component.', 'gutenberg' ), $prop, $name )
			);
		}

		$validated = array();
		foreach ( $schema as $prop => $prop_schema ) {
			$is_required = ! empty( $prop_schema['required'] );

			if ( ! array_key_exists( $prop, $props ) ) {
				if ( $is_required ) {
					$this->doing_it_wrong(
						/* translators: 1: Prop name. 2: Component name. */
						sprintf( __( 'The "%1$s" prop is required for the "%2$s" component.', 'gutenberg' ), $prop, $name )
					);
					return null;
				}
				$validated[ $prop ] = $prop_schema['default'];
				continue;
			}

			$error = rest_validate_value_from_schema( $props[ $prop ], $prop_schema, $prop );
			if ( is_wp_error( $error ) ) {
				$this->doing_it_wrong(
					/* translators: 1: Component name. 2: Validation error. */
					sprintf( __( 'Invalid prop for the "%1$s" component: %2$s', 'gutenberg' ), $name, $error->get_error_message() )
				);
				if ( $is_required ) {
					return null;
				}
				$validated[ $prop ] = $prop_schema['default'];
				continue;
			}

			// Validation accepts `1` or `'true'` for a boolean; the snapshot key needs the real type.
			$validated[ $prop ] = rest_sanitize_value_from_schema( $props[ $prop ], $prop_schema, $prop );
		}

		return $validated;
	}

	/**
	 * Reports a mistake by the caller.
	 *
	 * @param string $message Message.
	 */
	private function doing_it_wrong( $message ) {
		_doing_it_wrong( __CLASS__ . '::render', esc_html( $message ), 'gutenberg-experimental' );
	}
}
