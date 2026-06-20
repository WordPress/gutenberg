<?php
/**
 * Connector Fields API.
 *
 * Public functions and lifecycle hooks for {@see WP_Connector_Field_Registry}.
 *
 * @package gutenberg
 * @since 7.1.0
 */

use WordPress\AiClient\AiClient;
use WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication;

if ( ! function_exists( 'register_connector_field' ) ) {
	/**
	 * Registers a configuration field for an already-registered connector.
	 *
	 * Lets plugins add one or more fields to a connector's entry on the
	 * Connectors admin screen. Typical uses include a server URL for locally
	 * hosted services, a default model selection, or an organisation ID.
	 *
	 * Connectors declared with `api_key` authentication receive an implicit
	 * `api_key` field automatically, so plugins do not need to re-declare it.
	 *
	 * @since 7.1.0
	 *
	 * @see WP_Connector_Field_Registry::register()
	 *
	 * @param string $connector_id The connector identifier. Must already be registered.
	 * @param string $field_name   The field slug. Must match `/^[a-z0-9_-]+$/`.
	 * @param array  $args {
	 *     @type string         $type              Optional. The stored data type, mirroring
	 *                                             register_setting(): 'string', 'boolean',
	 *                                             'integer', 'number', 'array', or 'object'.
	 *                                             Default 'string'.
	 *     @type string         $control           Optional. The UI input to render: 'text', 'url',
	 *                                             'email', 'number', 'password', 'textarea',
	 *                                             'select', 'checkbox', or 'custom'. Defaults to a
	 *                                             control derived from `type` (boolean → checkbox,
	 *                                             integer/number → number, otherwise text).
	 *     @type string         $label             Required. Translatable label.
	 *     @type string         $description       Optional. Help text.
	 *     @type string         $placeholder       Optional. Placeholder.
	 *     @type mixed          $default           Optional. Default option value.
	 *     @type bool           $sensitive         Optional. Mask in REST + UI. Default false.
	 *     @type bool|array     $show_in_rest      Optional. Whether/how to expose the setting over
	 *                                             REST. Accepts a boolean or an array carrying a
	 *                                             custom `schema`, matching register_setting().
	 *                                             Defaults to true (the Connectors screen edits
	 *                                             fields exclusively over REST). For a 'select'
	 *                                             control, `choices` are exposed as the schema
	 *                                             `enum` automatically.
	 *     @type array|null     $choices           Optional. Required for the 'select' control. A
	 *                                             `[ value => label ]` map.
	 *     @type callable|null  $sanitize_callback Optional. Sanitizes the value on save. When
	 *                                             omitted, a sane default is chosen from `control`.
	 *     @type callable|null  $auth_callback     Optional. Capability gate for reading/exposing the
	 *                                             field, mirroring register_meta(). Defaults to a
	 *                                             `manage_options` check.
	 *     @type string|null    $env_var_name      Optional. Environment variable override.
	 *     @type string|null    $constant_name     Optional. PHP constant override.
	 *     @type string|null    $setting_name      Optional. Explicit option name.
	 *     @type string|null    $credentials_url   Optional. URL where the user can obtain the value.
	 * }
	 * @return array|null Field data on success, null on failure.
	 */
	function register_connector_field( string $connector_id, string $field_name, array $args ): ?array {
		return WP_Connector_Field_Registry::get_instance()->register( $connector_id, $field_name, $args );
	}
}

if ( ! function_exists( 'unregister_connector_field' ) ) {
	/**
	 * Unregisters a configuration field from a connector.
	 *
	 * @since 7.1.0
	 *
	 * @param string $connector_id The connector identifier.
	 * @param string $field_name   The field slug.
	 * @return array|null The unregistered field on success, null on failure.
	 */
	function unregister_connector_field( string $connector_id, string $field_name ): ?array {
		return WP_Connector_Field_Registry::get_instance()->unregister( $connector_id, $field_name );
	}
}

if ( ! function_exists( 'wp_get_connector_field' ) ) {
	/**
	 * Retrieves a single registered field.
	 *
	 * @since 7.1.0
	 *
	 * @param string $connector_id The connector identifier.
	 * @param string $field_name   The field slug.
	 * @return array|null The field data, or null if not registered.
	 */
	function wp_get_connector_field( string $connector_id, string $field_name ): ?array {
		return WP_Connector_Field_Registry::get_instance()->get_registered( $connector_id, $field_name );
	}
}

if ( ! function_exists( 'wp_get_connector_fields' ) ) {
	/**
	 * Retrieves all fields registered on a connector.
	 *
	 * @since 7.1.0
	 *
	 * @param string $connector_id The connector identifier.
	 * @return array<string, array> Fields keyed by field name.
	 */
	function wp_get_connector_fields( string $connector_id ): array {
		return WP_Connector_Field_Registry::get_instance()->get_all_registered( $connector_id );
	}
}

if ( ! function_exists( 'wp_get_connector_field_value' ) ) {
	/**
	 * Resolves the effective value for a connector field.
	 *
	 * Checks in order: environment variable, PHP constant, database option,
	 * registered default.
	 *
	 * @since 7.1.0
	 *
	 * @param string $connector_id The connector identifier.
	 * @param string $field_name   The field slug.
	 * @return mixed The resolved value, or null if the field is not registered.
	 */
	function wp_get_connector_field_value( string $connector_id, string $field_name ) {
		$field = wp_get_connector_field( $connector_id, $field_name );
		if ( null === $field ) {
			return null;
		}

		if ( ! empty( $field['env_var_name'] ) ) {
			$env_value = getenv( $field['env_var_name'] );
			if ( false !== $env_value && '' !== $env_value ) {
				return $env_value;
			}
		}

		if ( ! empty( $field['constant_name'] ) && defined( $field['constant_name'] ) ) {
			$const_value = constant( $field['constant_name'] );
			if ( null !== $const_value && '' !== $const_value ) {
				return $const_value;
			}
		}

		$db_value = get_option( $field['setting_name'], null );
		if ( null !== $db_value && '' !== $db_value ) {
			return $db_value;
		}

		return $field['default'];
	}
}

/**
 * Materialises an implicit `api_key` field for every connector that was
 * declared with `api_key` authentication but did not register the field
 * explicitly via {@see register_connector_field()}.
 *
 * Hooked at priority 9999 so it runs after every other `wp_connectors_init`
 * subscriber, meaning plugins can pre-empt the synthetic field by calling
 * {@see register_connector_field()} themselves earlier.
 *
 * @since 7.1.0
 * @access private
 *
 * @param WP_Connector_Registry $registry The connector registry instance.
 */
function _gutenberg_connector_fields_synthesize_legacy( WP_Connector_Registry $registry ): void {
	$field_registry = WP_Connector_Field_Registry::get_instance();

	foreach ( $registry->get_all_registered() as $connector_id => $connector ) {
		$auth = $connector['authentication'];
		if ( 'api_key' !== $auth['method'] ) {
			continue;
		}
		if ( $field_registry->is_registered( $connector_id, 'api_key' ) ) {
			continue;
		}

		$args = array(
			'type'         => 'string',
			'control'      => 'password',
			'label'        => sprintf(
				/* translators: %s: Connector name. */
				__( '%s API Key', 'gutenberg' ),
				$connector['name']
			),
			'description'  => sprintf(
				/* translators: %s: Connector name. */
				__( 'API key for the %s connector.', 'gutenberg' ),
				$connector['name']
			),
			'sensitive'    => true,
			'show_in_rest' => true,
		);

		if ( ! empty( $auth['setting_name'] ) ) {
			$args['setting_name'] = $auth['setting_name'];
		}
		if ( ! empty( $auth['env_var_name'] ) ) {
			$args['env_var_name'] = $auth['env_var_name'];
		}
		if ( ! empty( $auth['constant_name'] ) ) {
			$args['constant_name'] = $auth['constant_name'];
		}
		if ( ! empty( $auth['credentials_url'] ) ) {
			$args['credentials_url'] = $auth['credentials_url'];
		}

		$field_registry->register( $connector_id, 'api_key', $args );
	}
}
add_action( 'wp_connectors_init', '_gutenberg_connector_fields_synthesize_legacy', 9999 );

/**
 * Masks a sensitive string value for display, showing only the last 4
 * characters. Mirrors the behaviour of core's `_wp_connectors_mask_api_key()`
 * but is self-contained so the field API is not coupled to a private core
 * helper whose behaviour may diverge or be overridden by the Gutenberg
 * experimental Connectors implementation.
 *
 * @since 7.1.0
 * @access private
 *
 * @param string $value The sensitive value to mask.
 * @return string The masked value, e.g. `"••••••••fj39"`.
 */
function _gutenberg_connector_fields_mask( string $value ): string {
	if ( strlen( $value ) <= 4 ) {
		return $value;
	}

	return str_repeat( "\u{2022}", min( strlen( $value ) - 4, 16 ) ) . substr( $value, -4 );
}

/**
 * Determines where a field's effective value came from.
 *
 * Returns the first source that provides a non-empty value, checked in this
 * order: environment variable, PHP constant, database option. When nothing
 * is set, returns `'none'`.
 *
 * Self-contained so the field API does not depend on the private core helper
 * `_wp_connectors_get_api_key_source()`, which the Gutenberg experimental
 * Connectors implementation overrides with its own copy.
 *
 * @since 7.1.0
 * @access private
 *
 * @param string $setting_name  Option name to consult.
 * @param string $env_var_name  Optional env var to consult.
 * @param string $constant_name Optional PHP constant to consult.
 * @return string One of 'env', 'constant', 'database', 'none'.
 */
function _gutenberg_connector_fields_resolve_source( string $setting_name, string $env_var_name = '', string $constant_name = '' ): string {
	if ( '' !== $env_var_name ) {
		$env_value = getenv( $env_var_name );
		if ( false !== $env_value && '' !== $env_value ) {
			return 'env';
		}
	}

	if ( '' !== $constant_name && defined( $constant_name ) ) {
		$const_value = constant( $constant_name );
		if ( is_string( $const_value ) && '' !== $const_value ) {
			return 'constant';
		}
	}

	$db_value = get_option( $setting_name, '' );
	if ( '' !== $db_value ) {
		return 'database';
	}

	return 'none';
}

/**
 * Returns the default sanitizer callable for a connector field control.
 *
 * The control captures presentation intent (url / email / textarea /
 * checkbox), while the numeric caster is chosen from the data `type` so an
 * `integer` field stores an int and a `number` field stores a float.
 *
 * @since 7.1.0
 * @access private
 *
 * @param string $control Connector field control.
 * @param string $type    Connector field data type.
 * @return callable Sanitizer callable.
 */
function _gutenberg_connector_fields_default_sanitizer( string $control, string $type = 'string' ): callable {
	switch ( $control ) {
		case 'url':
			return 'esc_url_raw';
		case 'email':
			return 'sanitize_email';
		case 'number':
			if ( 'integer' === $type ) {
				return static function ( $value ): int {
					return is_numeric( $value ) ? (int) $value : 0;
				};
			}
			return static function ( $value ): float {
				// Cast to float explicitly so Settings API sees a stable type
				// regardless of whether the user submitted an int string, a
				// float string, or a non-numeric value. Non-numeric input
				// normalises to 0.0 so the option always stores a valid number.
				return is_numeric( $value ) ? (float) $value : 0.0;
			};
		case 'checkbox':
			return static function ( $value ): bool {
				return (bool) $value;
			};
		case 'textarea':
			return 'sanitize_textarea_field';
		default:
			return 'sanitize_text_field';
	}
}

/**
 * Determines whether the current user may read/write a connector field.
 *
 * Runs the field's `auth_callback` when provided; otherwise falls back to a
 * `manage_options` check (the capability the Settings REST controller already
 * requires). Mirrors the role `register_meta()`'s `auth_callback` plays for
 * protected meta.
 *
 * @since 7.1.0
 * @access private
 *
 * @param array  $field        The registered field.
 * @param string $connector_id The connector identifier.
 * @return bool Whether the current user is authorized for the field.
 */
function _gutenberg_connector_fields_user_can( array $field, string $connector_id ): bool {
	if ( isset( $field['auth_callback'] ) && is_callable( $field['auth_callback'] ) ) {
		return (bool) call_user_func( $field['auth_callback'], $connector_id, $field['name'] );
	}

	return current_user_can( 'manage_options' );
}

/**
 * Registers a `register_setting()` entry for every connector field.
 *
 * Replacement for core's `_wp_register_default_connector_settings()`, which
 * only registers the legacy api_key option. This variant iterates every field
 * declared via {@see register_connector_field()} — including the synthetic
 * `api_key` field injected for legacy api_key connectors.
 *
 * @since 7.1.0
 * @access private
 */
function _gutenberg_connector_fields_register_settings(): void {
	$ai_registry         = class_exists( AiClient::class ) ? AiClient::defaultRegistry() : null;
	$registered_settings = get_registered_settings();

	foreach ( wp_get_connectors() as $connector_id => $connector_data ) {
		foreach ( wp_get_connector_fields( $connector_id ) as $field_name => $field ) {
			$setting_name = $field['setting_name'];

			if ( isset( $registered_settings[ $setting_name ] ) ) {
				continue;
			}

			// Preserve legacy behaviour: for an AI provider's api_key field, skip
			// registration when the provider class is missing from the AI Client
			// registry so we do not expose a dangling option.
			if (
				'api_key' === $field_name &&
				'ai_provider' === $connector_data['type'] &&
				$ai_registry &&
				! $ai_registry->hasProvider( $connector_id )
			) {
				continue;
			}

			register_setting(
				'connectors',
				$setting_name,
				array(
					// `type` is already a valid Settings API data type
					// (string/boolean/integer/number/array/object).
					'type'              => $field['type'],
					'label'             => $field['label'],
					'description'       => $field['description'],
					'default'           => $field['default'],
					// Pass the bool|array form straight through; register_setting()
					// merges a custom `schema` (e.g. a select's `enum`) natively.
					'show_in_rest'      => $field['show_in_rest'],
					'sanitize_callback' => is_callable( $field['sanitize_callback'] )
						? $field['sanitize_callback']
						: _gutenberg_connector_fields_default_sanitizer( $field['control'], $field['type'] ),
				)
			);
		}
	}
}

/**
 * REST response post-dispatch: mask sensitive field values and validate updates.
 *
 * Replacement for core's `_wp_connectors_rest_settings_dispatch()`, which only
 * handles the legacy api_key option. Iterates every registered field instead
 * and masks any field flagged as `sensitive` before emitting the response.
 *
 * Per-field validation is intentionally NOT a registration concern (matching
 * register_setting(), which folds validation into the sanitize callback or the
 * REST schema). The one exception preserved here is the AI-provider api_key
 * live-validation that core already performed, so behaviour is unchanged for
 * existing connectors.
 *
 * @since 7.1.0
 * @access private
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_REST_Server   $server   The server instance.
 * @param WP_REST_Request  $request  The request object.
 * @return WP_REST_Response
 */
function _gutenberg_connector_fields_rest_dispatch( WP_REST_Response $response, WP_REST_Server $server, WP_REST_Request $request ): WP_REST_Response {
	if ( '/wp/v2/settings' !== $request->get_route() ) {
		return $response;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) ) {
		return $response;
	}

	$is_update = 'POST' === $request->get_method() || 'PUT' === $request->get_method();

	foreach ( wp_get_connectors() as $connector_id => $connector_data ) {
		foreach ( wp_get_connector_fields( $connector_id ) as $field_name => $field ) {
			if ( empty( $field['show_in_rest'] ) ) {
				continue;
			}

			$setting_name = $field['setting_name'];
			if ( ! array_key_exists( $setting_name, $data ) ) {
				continue;
			}

			// Enforce the field's auth gate symmetrically with the
			// script-module-data path. Remove (don't merely skip) the value so
			// a field guarded by a stricter `auth_callback` than the endpoint's
			// own `manage_options` is never exposed unmasked.
			if ( ! _gutenberg_connector_fields_user_can( $field, $connector_id ) ) {
				unset( $data[ $setting_name ] );
				continue;
			}

			$value = $data[ $setting_name ];

			// Preserve core's AI-provider api_key live validation: reject and
			// blank an invalid key on update. No generic per-field validation
			// hook — see the function docblock.
			//
			// The class_exists() guard is required: _wp_connectors_is_ai_api_key_valid()
			// dereferences AiClient::defaultRegistry(), which fatals when the WP
			// AI Client library is not loaded. (The experimental dispatch this
			// replaces carried the same guard.)
			if (
				$is_update &&
				is_string( $value ) && '' !== $value &&
				'api_key' === $field_name &&
				'ai_provider' === $connector_data['type'] &&
				! empty( $field['sensitive'] ) &&
				class_exists( '\WordPress\AiClient\AiClient' ) &&
				true !== _wp_connectors_is_ai_api_key_valid( $value, $connector_id )
			) {
				update_option( $setting_name, '' );
				$data[ $setting_name ] = '';
				continue;
			}

			if ( ! empty( $field['sensitive'] ) && is_string( $value ) && '' !== $value ) {
				$data[ $setting_name ] = _gutenberg_connector_fields_mask( $value );
			}
		}
	}

	$response->set_data( $data );
	return $response;
}

/**
 * Replacement script-module-data filter that exposes the `configSchema`.
 *
 * Delegates to core's filter to produce the baseline payload, then appends a
 * per-connector `configSchema` array consumed by the React admin screen to
 * render typed fields.
 *
 * @since 7.1.0
 * @access private
 *
 * @param array<string, mixed> $data Existing script module data.
 * @return array<string, mixed>
 */
function _gutenberg_connector_fields_script_module_data( array $data ): array {
	if ( ! isset( $data['connectors'] ) || ! is_array( $data['connectors'] ) ) {
		return $data;
	}

	foreach ( $data['connectors'] as $connector_id => &$connector_out ) {
		$config_schema = array();

		foreach ( wp_get_connector_fields( $connector_id ) as $field_name => $field ) {
			if ( empty( $field['show_in_rest'] ) ) {
				continue;
			}

			// Do not expose fields the current user is not authorized to see.
			if ( ! _gutenberg_connector_fields_user_can( $field, $connector_id ) ) {
				continue;
			}

			$field_value  = wp_get_connector_field_value( $connector_id, $field_name );
			$field_source = _gutenberg_connector_fields_resolve_source(
				$field['setting_name'],
				$field['env_var_name'] ?? '',
				$field['constant_name'] ?? ''
			);

			if ( ! empty( $field['sensitive'] ) && is_string( $field_value ) && '' !== $field_value ) {
				$field_value = _gutenberg_connector_fields_mask( $field_value );
			}

			$config_schema[] = array(
				'name'           => $field_name,
				'type'           => $field['type'],
				'control'        => $field['control'],
				'label'          => $field['label'],
				'description'    => $field['description'],
				'placeholder'    => $field['placeholder'],
				'settingName'    => $field['setting_name'],
				'value'          => $field_value,
				'default'        => $field['default'],
				'source'         => $field_source,
				'sensitive'      => ! empty( $field['sensitive'] ),
				'readOnly'       => in_array( $field_source, array( 'env', 'constant' ), true ),
				'isStored'       => in_array( $field_source, array( 'env', 'constant', 'database' ), true ),
				'choices'        => $field['choices'],
				'credentialsUrl' => $field['credentials_url'],
			);
		}

		$connector_out['configSchema'] = $config_schema;
	}
	unset( $connector_out );

	return $data;
}

/**
 * Swaps the existing connector lifecycle hooks for the field-aware versions.
 *
 * Two sets of hooks may be active at this point:
 *
 * 1. **Core** (`_wp_connectors_*` from `wp-includes/connectors.php`) — always
 *    present on WordPress ≥ 7.0.
 * 2. **Gutenberg experimental** (`_gutenberg_*` from
 *    `lib/experimental/connectors/default-connectors.php`) — parallel
 *    implementation shipped with the Gutenberg plugin that, when active,
 *    takes precedence over the core callbacks.
 *
 * Both sets register on global file scope and must be unhooked before they
 * fire on `init` / `rest_post_dispatch`. Runs on `plugins_loaded` so that the
 * global-scope `add_action()` / `add_filter()` calls in both files have
 * already executed but no hooked callback has fired yet.
 *
 * @since 7.1.0
 * @access private
 */
function _gutenberg_connector_fields_replace_hooks(): void {
	// 1. Swap `register_setting()` pass to iterate every connector field.
	remove_action( 'init', '_wp_register_default_connector_settings', 20 );
	remove_action( 'init', '_gutenberg_register_default_connector_settings', 20 );
	add_action( 'init', '_gutenberg_connector_fields_register_settings', 20 );

	// 2. Swap the REST dispatch filter so sensitive fields across the board
	// are masked and validated generically.
	remove_filter( 'rest_post_dispatch', '_wp_connectors_rest_settings_dispatch', 10 );
	remove_filter( 'rest_post_dispatch', '_gutenberg_connectors_rest_settings_dispatch', 10 );
	add_filter( 'rest_post_dispatch', '_gutenberg_connector_fields_rest_dispatch', 10, 3 );

	// 3. Append `configSchema` to the existing script-module-data payload.
	// Runs at priority 20 — after the core / experimental filter has populated
	// `connectors`, so we can enrich each entry with its field schema.
	add_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_connector_fields_script_module_data', 20 );
}
add_action( 'plugins_loaded', '_gutenberg_connector_fields_replace_hooks' );
