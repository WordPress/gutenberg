<?php
/**
 * Connector Fields API: WP_Connector_Field_Registry class.
 *
 * @package gutenberg
 * @since 7.1.0
 */

if ( ! class_exists( 'WP_Connector_Field_Registry' ) ) {
	/**
	 * Manages the registration and lookup of configuration fields for connectors.
	 *
	 * Connectors declared via {@see WP_Connector_Registry::register()} describe a
	 * single authentication mechanism (`api_key` or `none`) plus a handful of
	 * display metadata fields. This registry lets plugins attach any number of
	 * additional, typed configuration fields to those connectors so users can
	 * configure things like server URLs, model preferences, or organisation IDs
	 * from the Connectors admin screen.
	 *
	 * This is an internal class. Use the public API functions to interact with
	 * connector fields:
	 *
	 *  - `register_connector_field()`
	 *  - `unregister_connector_field()`
	 *  - `wp_get_connector_field()`
	 *  - `wp_get_connector_fields()`
	 *  - `wp_get_connector_field_value()`
	 *
	 * @since 7.1.0
	 * @access private
	 *
	 * @phpstan-type ConnectorField array{
	 *     name: non-empty-string,
	 *     type: 'string'|'boolean'|'integer'|'number'|'array'|'object',
	 *     control: 'text'|'url'|'email'|'number'|'password'|'textarea'|'select'|'checkbox'|'custom',
	 *     label: non-empty-string,
	 *     description: string,
	 *     placeholder: string,
	 *     default: mixed,
	 *     sensitive: bool,
	 *     show_in_rest: bool|array<string, mixed>,
	 *     choices: array<string, string>|null,
	 *     sanitize_callback: callable|null,
	 *     auth_callback: callable|null,
	 *     env_var_name: string|null,
	 *     constant_name: string|null,
	 *     credentials_url: string|null,
	 *     setting_name: non-empty-string
	 * }
	 */
	final class WP_Connector_Field_Registry {
		/**
		 * The singleton instance of the registry.
		 *
		 * @since 7.1.0
		 */
		private static ?WP_Connector_Field_Registry $instance = null;

		/**
		 * Registered fields, keyed by connector ID and then by field name.
		 *
		 * @since 7.1.0
		 * @var array<string, array<string, array>>
		 * @phpstan-var array<string, array<string, ConnectorField>>
		 */
		private array $registered_fields = array();

		/**
		 * Allowed values for the `type` field argument (the stored data type).
		 *
		 * Mirrors the data types accepted by `register_setting()` and
		 * `register_meta()` so the field's REST schema and Settings API
		 * registration stay consistent with core conventions.
		 *
		 * @since 7.1.0
		 * @var array<int, string>
		 */
		private const DATA_TYPES = array(
			'string',
			'boolean',
			'integer',
			'number',
			'array',
			'object',
		);

		/**
		 * Allowed values for the `control` field argument (the UI input hint).
		 *
		 * Kept distinct from the data `type` — a field can store a `string`
		 * yet render as a `url`, `password`, `select`, or `textarea`. `custom`
		 * signals the field is rendered by a plugin-provided component.
		 *
		 * @since 7.1.0
		 * @var array<int, string>
		 */
		private const CONTROLS = array(
			'text',
			'url',
			'email',
			'number',
			'password',
			'textarea',
			'select',
			'checkbox',
			'custom',
		);

		/**
		 * Registers a configuration field for an existing connector.
		 *
		 * See {@see register_connector_field()} for the full argument description.
		 *
		 * @since 7.1.0
		 *
		 * @param string $connector_id The connector identifier. Must already be registered.
		 * @param string $field_name   The field slug. Must match `/^[a-z0-9_-]+$/`.
		 * @param array  $args         Field arguments.
		 * @return array|null The registered field on success, null on failure.
		 */
		public function register( string $connector_id, string $field_name, array $args ): ?array {
			if ( ! wp_is_connector_registered( $connector_id ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Connector ID. */
					sprintf( __( 'Connector "%s" is not registered. Register the connector before adding fields.', 'gutenberg' ), esc_html( $connector_id ) ),
					'7.1.0'
				);
				return null;
			}

			if ( ! preg_match( '/^[a-z0-9_-]+$/', $field_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Connector field name must contain only lowercase alphanumeric characters, hyphens, and underscores.', 'gutenberg' ),
					'7.1.0'
				);
				return null;
			}

			if ( isset( $this->registered_fields[ $connector_id ][ $field_name ] ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: 1: Field name, 2: Connector ID. */
						__( 'Field "%1$s" is already registered for connector "%2$s".', 'gutenberg' ),
						esc_html( $field_name ),
						esc_html( $connector_id )
					),
					'7.1.0'
				);
				return null;
			}

			// Resolve the data type. Defaults to 'string', mirroring
			// register_setting()/register_meta().
			$type = $args['type'] ?? 'string';
			if ( ! is_string( $type ) || ! in_array( $type, self::DATA_TYPES, true ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: 1: Field name, 2: Comma-separated list of valid data types. */
						__( 'Connector field "%1$s" has an invalid "type". Must be one of: %2$s.', 'gutenberg' ),
						esc_html( $field_name ),
						esc_html( implode( ', ', self::DATA_TYPES ) )
					),
					'7.1.0'
				);
				return null;
			}

			// Resolve the UI control. Defaults to a sensible control for the
			// data type when not explicitly provided.
			$control = $args['control'] ?? self::default_control_for_type( $type );
			if ( ! is_string( $control ) || ! in_array( $control, self::CONTROLS, true ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: 1: Field name, 2: Comma-separated list of valid controls. */
						__( 'Connector field "%1$s" has an invalid "control". Must be one of: %2$s.', 'gutenberg' ),
						esc_html( $field_name ),
						esc_html( implode( ', ', self::CONTROLS ) )
					),
					'7.1.0'
				);
				return null;
			}

			if ( empty( $args['label'] ) || ! is_string( $args['label'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Field name. */
					sprintf( __( 'Connector field "%s" requires a non-empty "label" string.', 'gutenberg' ), esc_html( $field_name ) ),
					'7.1.0'
				);
				return null;
			}

			if ( 'select' === $control ) {
				if ( empty( $args['choices'] ) || ! is_array( $args['choices'] ) ) {
					_doing_it_wrong(
						__METHOD__,
						/* translators: %s: Field name. */
						sprintf( __( 'Connector field "%s" of type "select" requires a non-empty "choices" array.', 'gutenberg' ), esc_html( $field_name ) ),
						'7.1.0'
					);
					return null;
				}

				// Every choice must map a non-empty string key (the value the
				// server will store) to a non-empty string label (what the user
				// sees). Reject the registration rather than silently rendering
				// a broken select.
				foreach ( $args['choices'] as $choice_key => $choice_label ) {
					if ( ! is_string( $choice_key ) || '' === $choice_key ) {
						_doing_it_wrong(
							__METHOD__,
							/* translators: %s: Field name. */
							sprintf( __( 'Connector field "%s" has a "choices" entry with an invalid key. Keys must be non-empty strings.', 'gutenberg' ), esc_html( $field_name ) ),
							'7.1.0'
						);
						return null;
					}
					if ( ! is_string( $choice_label ) || '' === $choice_label ) {
						_doing_it_wrong(
							__METHOD__,
							sprintf(
								/* translators: 1: Field name, 2: Choice key. */
								__( 'Connector field "%1$s" choice "%2$s" requires a non-empty string label.', 'gutenberg' ),
								esc_html( $field_name ),
								esc_html( $choice_key )
							),
							'7.1.0'
						);
						return null;
					}
				}
			}

			if ( isset( $args['sanitize_callback'] ) && ! is_callable( $args['sanitize_callback'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Field name. */
					sprintf( __( 'Connector field "%s" sanitize_callback must be callable.', 'gutenberg' ), esc_html( $field_name ) ),
					'7.1.0'
				);
				return null;
			}

			if ( isset( $args['auth_callback'] ) && ! is_callable( $args['auth_callback'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Field name. */
					sprintf( __( 'Connector field "%s" auth_callback must be callable.', 'gutenberg' ), esc_html( $field_name ) ),
					'7.1.0'
				);
				return null;
			}

			if ( isset( $args['show_in_rest'] ) && ! is_bool( $args['show_in_rest'] ) && ! is_array( $args['show_in_rest'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Field name. */
					sprintf( __( 'Connector field "%s" show_in_rest must be a boolean or an array.', 'gutenberg' ), esc_html( $field_name ) ),
					'7.1.0'
				);
				return null;
			}

			$connector = wp_get_connector( $connector_id );

			if ( isset( $args['setting_name'] ) ) {
				if ( ! is_string( $args['setting_name'] ) || '' === $args['setting_name'] ) {
					_doing_it_wrong(
						__METHOD__,
						/* translators: %s: Field name. */
						sprintf( __( 'Connector field "%s" setting_name must be a non-empty string.', 'gutenberg' ), esc_html( $field_name ) ),
						'7.1.0'
					);
					return null;
				}
				$setting_name = $args['setting_name'];
			} else {
				// Align the auto-generated name with the scheme already used by
				// `_wp_connectors_register_default_ai_providers()` for legacy
				// `api_key` settings: `ai_provider` connectors get the shortened
				// `ai` prefix so all fields on the same connector share a stable
				// root. Other connector types keep their type slug verbatim.
				$type_prefix  = 'ai_provider' === $connector['type'] ? 'ai' : $connector['type'];
				$setting_name = str_replace( '-', '_', "connectors_{$type_prefix}_{$connector_id}_{$field_name}" );
			}

			$choices = isset( $args['choices'] ) && is_array( $args['choices'] ) ? $args['choices'] : null;

			// Resolve REST exposure. Connector fields are configured exclusively
			// over the Settings REST API on the Connectors screen, so this
			// defaults to true (unlike register_setting()'s `false`) — a field
			// that is not exposed cannot be edited by the UI. The `array` form
			// carries a custom schema, matching register_setting().
			$show_in_rest = $args['show_in_rest'] ?? true;
			if ( true === $show_in_rest && null !== $choices ) {
				// A select's choices are the canonical REST `enum`, mirroring how
				// core constrains options such as `default_ping_status`.
				$show_in_rest = array(
					'schema' => array( 'enum' => array_keys( $choices ) ),
				);
			}

			$field = array(
				'name'              => $field_name,
				'type'              => $type,
				'control'           => $control,
				'label'             => $args['label'],
				'description'       => isset( $args['description'] ) && is_string( $args['description'] ) ? $args['description'] : '',
				'placeholder'       => isset( $args['placeholder'] ) && is_string( $args['placeholder'] ) ? $args['placeholder'] : '',
				'default'           => $args['default'] ?? self::default_value_for_type( $type ),
				'sensitive'         => ! empty( $args['sensitive'] ),
				'show_in_rest'      => $show_in_rest,
				'choices'           => $choices,
				'sanitize_callback' => $args['sanitize_callback'] ?? null,
				'auth_callback'     => $args['auth_callback'] ?? null,
				'env_var_name'      => isset( $args['env_var_name'] ) && is_string( $args['env_var_name'] ) ? $args['env_var_name'] : null,
				'constant_name'     => isset( $args['constant_name'] ) && is_string( $args['constant_name'] ) ? $args['constant_name'] : null,
				'credentials_url'   => isset( $args['credentials_url'] ) && is_string( $args['credentials_url'] ) ? $args['credentials_url'] : null,
				'setting_name'      => $setting_name,
			);

			$this->registered_fields[ $connector_id ][ $field_name ] = $field;

			return $field;
		}

		/**
		 * Unregisters a field from a connector.
		 *
		 * @since 7.1.0
		 *
		 * @param string $connector_id The connector identifier.
		 * @param string $field_name   The field slug.
		 * @return array|null The unregistered field on success, null on failure.
		 */
		public function unregister( string $connector_id, string $field_name ): ?array {
			if ( ! isset( $this->registered_fields[ $connector_id ][ $field_name ] ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: 1: Field name, 2: Connector ID. */
						__( 'Field "%1$s" is not registered for connector "%2$s".', 'gutenberg' ),
						esc_html( $field_name ),
						esc_html( $connector_id )
					),
					'7.1.0'
				);
				return null;
			}

			$field = $this->registered_fields[ $connector_id ][ $field_name ];
			unset( $this->registered_fields[ $connector_id ][ $field_name ] );
			if ( empty( $this->registered_fields[ $connector_id ] ) ) {
				unset( $this->registered_fields[ $connector_id ] );
			}

			return $field;
		}

		/**
		 * Checks whether a field is registered on a connector.
		 *
		 * @since 7.1.0
		 *
		 * @param string $connector_id The connector identifier.
		 * @param string $field_name   The field slug.
		 * @return bool True if the field is registered, false otherwise.
		 */
		public function is_registered( string $connector_id, string $field_name ): bool {
			return isset( $this->registered_fields[ $connector_id ][ $field_name ] );
		}

		/**
		 * Retrieves a single registered field.
		 *
		 * @since 7.1.0
		 *
		 * @param string $connector_id The connector identifier.
		 * @param string $field_name   The field slug.
		 * @return array|null The field data, or null if not registered.
		 */
		public function get_registered( string $connector_id, string $field_name ): ?array {
			return $this->registered_fields[ $connector_id ][ $field_name ] ?? null;
		}

		/**
		 * Retrieves all fields registered on a connector.
		 *
		 * @since 7.1.0
		 *
		 * @param string $connector_id The connector identifier.
		 * @return array<string, array> Fields keyed by field name.
		 */
		public function get_all_registered( string $connector_id ): array {
			return $this->registered_fields[ $connector_id ] ?? array();
		}

		/**
		 * Returns the default UI control for a given data type.
		 *
		 * Used when a field declares a `type` but no explicit `control`.
		 *
		 * @since 7.1.0
		 *
		 * @param string $type The data type.
		 * @return string The default control slug.
		 */
		private static function default_control_for_type( string $type ): string {
			switch ( $type ) {
				case 'boolean':
					return 'checkbox';
				case 'integer':
				case 'number':
					return 'number';
				default:
					return 'text';
			}
		}

		/**
		 * Returns the type-appropriate "empty" default for a field that does
		 * not declare an explicit `default`.
		 *
		 * Keeps the registered default consistent with the field's declared
		 * data type and REST schema (a boolean defaults to `false`, not `''`).
		 *
		 * @since 7.1.0
		 *
		 * @param string $type The data type.
		 * @return mixed The default value for the type.
		 */
		private static function default_value_for_type( string $type ) {
			switch ( $type ) {
				case 'boolean':
					return false;
				case 'integer':
					return 0;
				case 'number':
					return 0.0;
				case 'array':
				case 'object':
					return array();
				default:
					return '';
			}
		}

		/**
		 * Retrieves the main instance of the registry class.
		 *
		 * @since 7.1.0
		 *
		 * @return WP_Connector_Field_Registry The main registry instance.
		 */
		public static function get_instance(): self {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Overrides or clears the singleton instance.
		 *
		 * Intended for the PHPUnit test harness and internal callers that need
		 * deterministic registry state between cases. Pass `null` to force the
		 * next `get_instance()` call to create a fresh registry.
		 *
		 * @since 7.1.0
		 * @access private
		 *
		 * @param WP_Connector_Field_Registry|null $instance The instance to set, or null to reset.
		 */
		public static function set_instance( ?self $instance ): void {
			self::$instance = $instance;
		}
	}
}
