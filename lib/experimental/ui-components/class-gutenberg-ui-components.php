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
 * generates by rendering the React components: a base render, what each
 * variant value changes, and full snapshots for the combinations those
 * changes can't rebuild, with placeholders for the free-form props. Rendering
 * applies the changes and fills in the placeholders and translated strings,
 * so there is no markup to maintain here.
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

		return $this->fill_placeholders( $component, $props );
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
	 * Builds the markup for the given props, with placeholders still in it.
	 *
	 * Starts from the base render and applies what each variant value
	 * changes: classes, attributes and inline styles, per tag. Combinations
	 * those changes can't rebuild, such as a variant that swaps an icon, are
	 * stored as full snapshots instead. The build checks every combination, so
	 * this always matches what React renders.
	 *
	 * @param array $component Component metadata.
	 * @param array $props     Validated props.
	 * @return string Markup with placeholders.
	 */
	private function get_markup( $component, $props ) {
		$key = $this->get_snapshot_key( $component, $props );
		if ( isset( $component['exceptions'][ $key ] ) ) {
			return $component['exceptions'][ $key ];
		}

		$changes_by_tag = array();
		foreach ( explode( '&', $key ) as $variant ) {
			foreach ( $component['changes'][ $variant ] ?? array() as $change ) {
				$changes_by_tag[ $change['tag'] ][] = $change;
			}
		}
		if ( ! $changes_by_tag ) {
			return $component['base'];
		}

		$processor = new WP_HTML_Tag_Processor( $component['base'] );
		$tag       = -1;
		while ( $processor->next_tag() ) {
			++$tag;
			foreach ( $changes_by_tag[ $tag ] ?? array() as $change ) {
				foreach ( $change['removeClass'] ?? array() as $class_name ) {
					$processor->remove_class( $class_name );
				}
				foreach ( $change['addClass'] ?? array() as $class_name ) {
					$processor->add_class( $class_name );
				}
				if ( isset( $change['style'] ) ) {
					$processor->set_attribute( 'style', $this->change_style( (string) $processor->get_attribute( 'style' ), $change['style'] ) );
				}
				foreach ( $change['set'] ?? array() as $name => $value ) {
					$processor->set_attribute( $name, $value );
				}
				foreach ( $change['remove'] ?? array() as $name ) {
					$processor->remove_attribute( $name );
				}
			}
		}

		return $processor->get_updated_html();
	}

	/**
	 * Sets or removes declarations in an inline style.
	 *
	 * @param string $style   Inline style.
	 * @param array  $changes Value per property, or null to remove it.
	 * @return string Inline style.
	 */
	private function change_style( $style, $changes ) {
		$declarations = array();
		foreach ( array_filter( explode( ';', $style ) ) as $declaration ) {
			list( $property, $value )          = array_pad( explode( ':', $declaration, 2 ), 2, '' );
			$declarations[ trim( $property ) ] = trim( $value );
		}
		foreach ( $changes as $property => $value ) {
			if ( null === $value ) {
				unset( $declarations[ $property ] );
			} else {
				$declarations[ $property ] = $value;
			}
		}

		$style = array();
		foreach ( $declarations as $property => $value ) {
			$style[] = $property . ':' . $value;
		}
		return implode( ';', $style );
	}

	/**
	 * Fills in the slots and translated strings of the markup.
	 *
	 * Each placeholder says where it is, such as `__wpuislot_label__text__`
	 * or `__wpuislot_type__attr_type__`, so it's escaped for that context.
	 * Everything is replaced in one pass, so filled-in values are never read
	 * as placeholders themselves.
	 *
	 * @param array $component Component metadata.
	 * @param array $props     Validated props.
	 * @return string Component HTML.
	 */
	private function fill_placeholders( $component, $props ) {
		return preg_replace_callback(
			'/__wpui(slot|text)_([a-z0-9_]+?)__(?:attr_([a-z0-9-]+)|text)__/',
			static function ( $placeholder ) use ( $component, $props ) {
				$attribute = $placeholder[3] ?? '';

				if ( 'text' === $placeholder[1] ) {
					// A string React translates with `__()`, such as a "Dismiss" label.
					list( $text, $domain ) = $component['texts'][ $placeholder[2] ];
					return self::esc_plain_text( translate( $text, $domain ) ); // phpcs:ignore WordPress.WP.I18n -- Strings from the React components.
				}

				$value = (string) $props[ $placeholder[2] ];
				if ( '' !== $attribute ) {
					// React blocks `javascript:` URLs; esc_url() does the same here.
					return in_array( $attribute, array( 'href', 'src', 'action', 'formaction' ), true ) ? esc_url( $value ) : self::esc_plain_text( $value );
				}
				if ( isset( $component['props'][ $placeholder[2] ]['format'] ) && 'html' === $component['props'][ $placeholder[2] ]['format'] ) {
					// HTML props are printed as is; callers escape what they pass.
					return $value;
				}
				return self::esc_plain_text( $value );
			},
			$this->get_markup( $component, $props )
		);
	}

	/**
	 * Escapes plain text for HTML text or an attribute value, as React does.
	 *
	 * React escapes `&`, `<`, `>`, `"` and `'` in every string and never reads
	 * entities in it, so any entity a caller passes shows as written. Unlike
	 * `esc_html()` and `esc_attr()`, which leave existing entities alone, this
	 * does the same. Props are plain text: decode a string that is already
	 * HTML-encoded, such as the result of `get_the_title()`, first.
	 *
	 * @param string $text Plain text.
	 * @return string Escaped text.
	 */
	private static function esc_plain_text( $text ) {
		return htmlspecialchars( (string) $text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8' );
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
