<?php
/**
 * Default connectors backend logic.
 *
 * @package gutenberg
 */

/**
 * Initializes the connector registry with default connectors and fires the registration action.
 *
 * Creates the registry instance, registers built-in connectors (which cannot be unhooked),
 * and then fires the `wp_connectors_init` action for plugins to register their own connectors.
 *
 * @access private
 * @since 7.0.0
 */
function _gutenberg_connectors_init(): void {
	$registry = new WP_Connector_Registry();
	WP_Connector_Registry::set_instance( $registry );

	// Only register default AI providers if AI support is available.
	if ( class_exists( '\WordPress\AiClient\AiClient' ) ) {
		_gutenberg_register_default_ai_providers( $registry );
	}

	// Non-AI default connectors.
	$registry->register(
		'akismet',
		array(
			'name'           => __( 'Akismet Anti-Spam', 'gutenberg' ),
			'description'    => __( 'Protect your site from spam.', 'gutenberg' ),
			'type'           => 'spam_filtering',
			'plugin'         => array(
				'file'      => 'akismet/akismet.php',
				'is_active' => static function (): bool {
					return defined( 'AKISMET_VERSION' );
				},
			),
			'authentication' => array(
				'method'          => 'api_key',
				'credentials_url' => 'https://akismet.com/get/',
				'setting_name'    => 'wordpress_api_key',
				'constant_name'   => 'WPCOM_API_KEY',
			),
		)
	);

	/**
	 * Fires when the connector registry is ready for plugins to register connectors.
	 *
	 * Built-in connectors and any AI providers auto-discovered from the WP AI Client
	 * registry have already been registered at this point and cannot be unhooked.
	 *
	 * AI provider plugins that register with the WP AI Client do not need to use
	 * this action — their connectors are created automatically. This action is
	 * primarily for registering non-AI-provider connectors or overriding metadata
	 * on existing connectors.
	 *
	 * Use `$registry->register()` within this action to add new connectors.
	 * To override an existing connector, unregister it first, then re-register
	 * with updated data.
	 *
	 * Example — overriding metadata on an auto-discovered connector:
	 *
	 *     add_action( 'wp_connectors_init', function ( WP_Connector_Registry $registry ) {
	 *         if ( $registry->is_registered( 'anthropic' ) ) {
	 *             $connector = $registry->unregister( 'anthropic' );
	 *             $connector['description'] = __( 'Custom description for Anthropic.', 'my-plugin' );
	 *             $registry->register( 'anthropic', $connector );
	 *         }
	 *     } );
	 *
	 * @since 7.0.0
	 *
	 * @param WP_Connector_Registry $registry Connector registry instance.
	 */
	do_action( 'wp_connectors_init', $registry );
}
remove_action( 'init', '_wp_connectors_init', 15 );
add_action( 'init', '_gutenberg_connectors_init', 15 );

/**
 * Registers connectors for the built-in AI providers.
 *
 * @access private
 * @since 7.0.0
 *
 * @param WP_Connector_Registry $registry The connector registry instance.
 */
function _gutenberg_register_default_ai_providers( WP_Connector_Registry $registry ): void {
	// Built-in connectors.
	$defaults = array(
		'anthropic' => array(
			'name'           => 'Anthropic',
			'description'    => __( 'Text generation with Claude.', 'gutenberg' ),
			'type'           => 'ai_provider',
			'plugin'         => array(
				'file' => 'ai-provider-for-anthropic/plugin.php',
			),
			'authentication' => array(
				'method'          => 'api_key',
				'credentials_url' => 'https://platform.claude.com/settings/keys',
			),
		),
		'google'    => array(
			'name'           => 'Google',
			'description'    => __( 'Text and image generation with Gemini and Imagen.', 'gutenberg' ),
			'type'           => 'ai_provider',
			'plugin'         => array(
				'file' => 'ai-provider-for-google/plugin.php',
			),
			'authentication' => array(
				'method'          => 'api_key',
				'credentials_url' => 'https://aistudio.google.com/api-keys',
			),
		),
		'openai'    => array(
			'name'           => 'OpenAI',
			'description'    => __( 'Text and image generation with GPT and Dall-E.', 'gutenberg' ),
			'type'           => 'ai_provider',
			'plugin'         => array(
				'file' => 'ai-provider-for-openai/plugin.php',
			),
			'authentication' => array(
				'method'          => 'api_key',
				'credentials_url' => 'https://platform.openai.com/api-keys',
			),
		),
	);

	// Merge AI Client registry data on top of defaults.
	// Registry values (from provider plugins) take precedence over hardcoded fallbacks.
	$ai_registry = \WordPress\AiClient\AiClient::defaultRegistry();

	foreach ( array_filter( $ai_registry->getRegisteredProviderIds() ) as $connector_id ) {
		$provider_class_name = $ai_registry->getProviderClassName( $connector_id );
		$provider_metadata   = $provider_class_name::metadata();

		$auth_method = method_exists( $provider_metadata, 'getAuthenticationMethod' ) ? $provider_metadata->getAuthenticationMethod() : null;
		$is_api_key  = null !== $auth_method && $auth_method->isApiKey();

		if ( $is_api_key ) {
			$credentials_url = $provider_metadata->getCredentialsUrl();
			$authentication  = array(
				'method' => 'api_key',
			);
			if ( $credentials_url ) {
				$authentication['credentials_url'] = $credentials_url;
			}
		} else {
			$authentication = array( 'method' => 'none' );
		}

		$name        = $provider_metadata->getName();
		$description = method_exists( $provider_metadata, 'getDescription' ) ? $provider_metadata->getDescription() : null;
		$logo_url    = method_exists( $provider_metadata, 'getLogoPath' ) && $provider_metadata->getLogoPath()
			? _wp_connectors_resolve_ai_provider_logo_url( $provider_metadata->getLogoPath() )
			: null;

		if ( isset( $defaults[ $connector_id ] ) ) {
			// Override fields with non-empty registry values.
			if ( $name ) {
				$defaults[ $connector_id ]['name'] = $name;
			}
			if ( $description ) {
				$defaults[ $connector_id ]['description'] = $description;
			}
			if ( $logo_url ) {
				$defaults[ $connector_id ]['logo_url'] = $logo_url;
			}
			// Always update auth method; keep existing credentials_url as fallback.
			$defaults[ $connector_id ]['authentication']['method'] = $authentication['method'];
			if ( ! empty( $authentication['credentials_url'] ) ) {
				$defaults[ $connector_id ]['authentication']['credentials_url'] = $authentication['credentials_url'];
			}
		} else {
			$defaults[ $connector_id ] = array(
				'name'           => $name ? $name : ucwords( $connector_id ),
				'description'    => $description ? $description : '',
				'type'           => 'ai_provider',
				'authentication' => $authentication,
			);
			if ( $logo_url ) {
				$defaults[ $connector_id ]['logo_url'] = $logo_url;
			}
		}
	}

	// Register all default AI connectors directly on the registry.
	foreach ( $defaults as $id => $args ) {
		if ( 'api_key' === $args['authentication']['method'] ) {
			$sanitized_id = str_replace( '-', '_', $id );

			$args['authentication']['setting_name'] = "connectors_ai_{$sanitized_id}_api_key";

			// All AI providers use the {CONSTANT_CASE_ID}_API_KEY naming convention.
			$constant_case_key = strtoupper( (string) preg_replace( '/([a-z])([A-Z])/', '$1_$2', $sanitized_id ) ) . '_API_KEY';

			$args['authentication']['constant_name'] = $constant_case_key;
			$args['authentication']['env_var_name']  = $constant_case_key;
		}

		$args['plugin']['is_active'] = static function () use ( $ai_registry, $id ): bool {
			try {
				return $ai_registry->hasProvider( $id );
			} catch ( Exception $e ) {
				return false;
			}
		};

		$registry->register( $id, $args );
	}
}

/**
 * Determines the source of an API key for a given connector.
 *
 * Checks in order: environment variable, PHP constant, database.
 * Environment variable and PHP constant are only checked when explicitly
 * provided in the connector's authentication config.
 *
 * @access private
 *
 * @param string $setting_name  The option name for the API key (e.g., 'connectors_ai_openai_api_key').
 * @param string $env_var_name  Optional. Environment variable name. Only checked when non-empty.
 * @param string $constant_name Optional. PHP constant name. Only checked when non-empty.
 * @return string The key source: 'env', 'constant', 'database', or 'none'.
 */
function _gutenberg_get_api_key_source( string $setting_name, string $env_var_name = '', string $constant_name = '' ): string {
	// Check environment variable (only if explicitly configured).
	if ( '' !== $env_var_name ) {
		$env_value = getenv( $env_var_name );
		if ( false !== $env_value && '' !== $env_value ) {
			return 'env';
		}
	}

	// Check PHP constant (only if explicitly configured).
	if ( '' !== $constant_name && defined( $constant_name ) ) {
		$const_value = constant( $constant_name );
		if ( is_string( $const_value ) && '' !== $const_value ) {
			return 'constant';
		}
	}

	// Check database.
	$db_value = get_option( $setting_name, '' );
	if ( '' !== $db_value ) {
		return 'database';
	}

	return 'none';
}

/**
 * Parses a `username:password` credentials string.
 *
 * Splits on the first colon, matching the HTTP Basic authentication
 * userinfo format, so passwords may contain colons.
 *
 * @access private
 *
 * @param string $value The raw credentials string.
 * @return array{username: string, password: string} Parsed credentials. Both values
 *                                                   are empty when the string is malformed.
 */
function _gutenberg_parse_application_password_credentials( string $value ): array {
	$separator = strpos( $value, ':' );
	// Trim so surrounding whitespace or a trailing newline (common when the
	// value comes from a file or `.env`) does not become part of the credentials.
	$username = false === $separator ? '' : trim( substr( $value, 0, $separator ) );
	$password = false === $separator ? '' : trim( substr( $value, $separator + 1 ) );

	if ( '' === $username || '' === $password ) {
		return array(
			'username' => '',
			'password' => '',
		);
	}

	return array(
		'username' => $username,
		'password' => $password,
	);
}

/**
 * Resolves application-password credentials for a connector.
 *
 * Checks in order: environment variable, PHP constant, database. The
 * environment variable and constant are only checked when their respective
 * names are provided, and must contain the credentials as a single
 * `username:password` string. A non-empty environment variable or constant
 * that cannot be parsed as `username:password` is reported with
 * `_doing_it_wrong()` and ignored, so resolution falls through to the next
 * source.
 *
 * @access private
 *
 * @param array $auth The connector's authentication configuration.
 * @return array{username: string, password: string, source: string} Resolved credentials and
 *                                                                   their source: 'env', 'constant',
 *                                                                   'database', or 'none'.
 */
function _gutenberg_get_application_password_credentials( array $auth ): array {
	// Check environment variable (only if explicitly configured).
	$env_var_name = $auth['env_var_name'] ?? '';
	if ( '' !== $env_var_name ) {
		$env_value = getenv( $env_var_name );
		if ( false !== $env_value && '' !== $env_value ) {
			$credentials = _gutenberg_parse_application_password_credentials( $env_value );
			if ( '' !== $credentials['username'] && '' !== $credentials['password'] ) {
				$credentials['source'] = 'env';
				return $credentials;
			}

			_doing_it_wrong(
				__FUNCTION__,
				sprintf(
					/* translators: %s: Environment variable name. */
					__( 'The %s environment variable must contain application password credentials in "username:password" format.', 'gutenberg' ),
					esc_html( $env_var_name )
				),
				'7.0.0'
			);
		}
	}

	// Check PHP constant (only if explicitly configured).
	$constant_name = $auth['constant_name'] ?? '';
	if ( '' !== $constant_name && defined( $constant_name ) ) {
		$const_value = constant( $constant_name );
		if ( is_string( $const_value ) && '' !== $const_value ) {
			$credentials = _gutenberg_parse_application_password_credentials( $const_value );
			if ( '' !== $credentials['username'] && '' !== $credentials['password'] ) {
				$credentials['source'] = 'constant';
				return $credentials;
			}

			_doing_it_wrong(
				__FUNCTION__,
				sprintf(
					/* translators: %s: PHP constant name. */
					__( 'The %s constant must contain application password credentials in "username:password" format.', 'gutenberg' ),
					esc_html( $constant_name )
				),
				'7.0.0'
			);
		}
	}

	// Check database.
	$stored   = get_option( $auth['setting_name'] ?? '', array() );
	$username = is_array( $stored ) && isset( $stored['username'] ) && is_string( $stored['username'] ) ? $stored['username'] : '';
	$password = is_array( $stored ) && isset( $stored['password'] ) && is_string( $stored['password'] ) ? $stored['password'] : '';

	return array(
		'username' => $username,
		'password' => $password,
		'source'   => '' !== $username && '' !== $password ? 'database' : 'none',
	);
}

/**
 * Masks an API key, showing only the last 4 characters.
 *
 * @access private
 *
 * @param string $key The API key to mask.
 * @return string The masked key, e.g. "************fj39".
 */
function _gutenberg_mask_api_key( string $key ): string {
	if ( strlen( $key ) <= 4 ) {
		return $key;
	}

	return str_repeat( "\u{2022}", min( strlen( $key ) - 4, 16 ) ) . substr( $key, -4 );
}

/**
 * Checks whether an API key is valid for a given provider.
 *
 * @access private
 *
 * @param string $key         The API key to check.
 * @param string $provider_id The WP AI client provider ID.
 * @return bool|null True if valid, false if invalid, null if unable to determine.
 */
function _gutenberg_is_ai_api_key_valid( string $key, string $provider_id ): ?bool {
	try {
		$registry = \WordPress\AiClient\AiClient::defaultRegistry();

		if ( ! $registry->hasProvider( $provider_id ) ) {
			_doing_it_wrong(
				__FUNCTION__,
				sprintf(
					/* translators: %s: AI provider ID. */
					__( 'The provider "%s" is not registered in the AI client registry.', 'gutenberg' ),
					$provider_id
				),
				'7.0.0'
			);
			return null;
		}

		$registry->setProviderRequestAuthentication(
			$provider_id,
			new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $key )
		);

		return $registry->isProviderConfigured( $provider_id );
	} catch ( Exception $e ) {
		wp_trigger_error( __FUNCTION__, $e->getMessage() );
		return null;
	}
}

/**
 * Sanitizes stored application-password credentials for a connector.
 *
 * Credential fields that are missing or not strings keep their currently
 * stored values, so partial updates cannot silently clear a stored secret.
 * A password matching the mask that `_gutenberg_connectors_rest_settings_dispatch()`
 * places in REST responses also keeps the stored password, so a masked
 * settings response can be submitted back to the endpoint unchanged.
 * Pass an empty string to clear a field.
 * If the sanitized username is empty, both fields are discarded so partial
 * credentials cannot leave an orphaned secret.
 *
 * @access private
 *
 * @param mixed  $value  The submitted setting value.
 * @param string $option The option name being sanitized. Passed explicitly by the
 *                       registered sanitize callback; falls back to the current
 *                       `sanitize_option_{$option}` filter name when omitted.
 * @return array{username: string, password: string} Sanitized credentials.
 */
function _gutenberg_sanitize_application_password_credentials( $value, string $option = '' ): array {
	if ( ! is_array( $value ) ) {
		$value = array();
	}

	if ( '' === $option ) {
		$option = str_replace( 'sanitize_option_', '', (string) current_filter() );
	}

	$stored = get_option( $option );
	if ( ! is_array( $stored ) ) {
		$stored = array();
	}

	$credentials = array();
	foreach ( array( 'username', 'password' ) as $field ) {
		if ( isset( $value[ $field ] ) && is_string( $value[ $field ] ) ) {
			$credentials[ $field ] = sanitize_text_field( $value[ $field ] );
		} else {
			$credentials[ $field ] = isset( $stored[ $field ] ) && is_string( $stored[ $field ] ) ? $stored[ $field ] : '';
		}
	}

	// A masked password means a client resubmitted a masked REST response.
	if ( str_repeat( "\u{2022}", 16 ) === $credentials['password'] ) {
		$credentials['password'] = isset( $stored['password'] ) && is_string( $stored['password'] ) ? $stored['password'] : '';
	}

	if ( '' === $credentials['username'] ) {
		return array(
			'username' => '',
			'password' => '',
		);
	}

	return $credentials;
}

/**
 * Masks and validates connector credentials in REST responses.
 *
 * On every `/wp/v2/settings` response, masks connector API key values and the
 * password field of default application-password credential objects.
 *
 * On POST or PUT requests, validates each updated AI provider API key before
 * masking. If validation fails, the key is reverted to an empty string.
 * Application password values are masked but not validated.
 *
 * @access private
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_REST_Server   $server   The server instance.
 * @param WP_REST_Request  $request  The request object.
 * @return WP_REST_Response The modified response with masked/validated keys.
 */
function _gutenberg_connectors_rest_settings_dispatch( WP_REST_Response $response, WP_REST_Server $server, WP_REST_Request $request ): WP_REST_Response {
	if ( '/wp/v2/settings' !== $request->get_route() ) {
		return $response;
	}

	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return $response;
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) ) {
		return $response;
	}

	$is_update = 'POST' === $request->get_method() || 'PUT' === $request->get_method();

	foreach ( wp_get_connectors() as $connector_id => $connector_data ) {
		$auth = $connector_data['authentication'];

		if ( 'application_password' === $auth['method'] && ! empty( $auth['setting_name'] ) ) {
			$setting_name = $auth['setting_name'];
			if ( array_key_exists( $setting_name, $data ) && is_array( $data[ $setting_name ] ) ) {
				$password = $data[ $setting_name ]['password'] ?? '';
				if ( is_string( $password ) && '' !== $password ) {
					$data[ $setting_name ]['password'] = str_repeat( "\u{2022}", 16 );
				}
			}
			continue;
		}

		if ( 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
			continue;
		}

		$setting_name = $auth['setting_name'];
		if ( ! array_key_exists( $setting_name, $data ) ) {
			continue;
		}

		$value = $data[ $setting_name ];

		// On update, validate AI provider keys before masking.
		// Non-AI connectors accept keys as-is; the service plugin handles its own validation.
		if ( $is_update && is_string( $value ) && '' !== $value && 'ai_provider' === $connector_data['type'] ) {
			if ( true !== _gutenberg_is_ai_api_key_valid( $value, $connector_id ) ) {
				update_option( $setting_name, '' );
				$data[ $setting_name ] = '';
				continue;
			}
		}

		// Mask the key in the response.
		if ( is_string( $value ) && '' !== $value ) {
			$data[ $setting_name ] = _gutenberg_mask_api_key( $value );
		}
	}

	$response->set_data( $data );
	return $response;
}
remove_filter( 'rest_post_dispatch', '_wp_connectors_validate_keys_in_rest', 10 );
remove_filter( 'rest_post_dispatch', '_wp_connectors_rest_settings_dispatch', 10 );
add_filter( 'rest_post_dispatch', '_gutenberg_connectors_rest_settings_dispatch', 10, 3 );

/**
 * Registers default connector settings.
 *
 * @access private
 */
function _gutenberg_register_default_connector_settings(): void {
	$existing_settings = get_registered_settings();

	foreach ( wp_get_connectors() as $connector_data ) {
		$auth = $connector_data['authentication'];
		if ( 'api_key' !== $auth['method'] && 'application_password' !== $auth['method'] ) {
			continue;
		}

		if ( empty( $auth['setting_name'] ) || isset( $existing_settings[ $auth['setting_name'] ] ) ) {
			continue;
		}
		$setting_name = $auth['setting_name'];

		if ( ! isset( $connector_data['plugin']['is_active'] ) || ! is_callable( $connector_data['plugin']['is_active'] ) ) {
			continue;
		}

		if ( ! call_user_func( $connector_data['plugin']['is_active'] ) ) {
			continue;
		}

		if ( 'api_key' === $auth['method'] ) {
			register_setting(
				'connectors',
				$setting_name,
				array(
					'type'              => 'string',
					'label'             => sprintf(
						/* translators: %s: Connector name. */
						__( '%s API Key', 'gutenberg' ),
						$connector_data['name']
					),
					'description'       => sprintf(
						/* translators: %s: Connector name. */
						__( 'API key for the %s connector.', 'gutenberg' ),
						$connector_data['name']
					),
					'default'           => '',
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_text_field',
				)
			);
		} elseif ( 'application_password' === $auth['method'] ) {
			register_setting(
				'connectors',
				$setting_name,
				array(
					'type'              => 'object',
					'label'             => sprintf(
						/* translators: %s: Connector name. */
						__( '%s Credentials', 'gutenberg' ),
						$connector_data['name']
					),
					'description'       => sprintf(
						/* translators: %s: Connector name. */
						__( 'Application password credentials for the %s connector.', 'gutenberg' ),
						$connector_data['name']
					),
					'default'           => array(
						'username' => '',
						'password' => '',
					),
					'show_in_rest'      => array(
						'schema' => array(
							'type'                 => 'object',
							'properties'           => array(
								'username' => array(
									'type' => 'string',
								),
								'password' => array(
									'type' => 'string',
								),
							),
							'additionalProperties' => false,
						),
					),
					'sanitize_callback' => static function ( $value ) use ( $setting_name ) {
						return _gutenberg_sanitize_application_password_credentials( $value, $setting_name );
					},
				)
			);
		}
	}
}
remove_action( 'init', '_wp_register_default_connector_settings', 20 );
add_action( 'init', '_gutenberg_register_default_connector_settings', 20 );

/**
 * Passes stored connector API keys to the WP AI client.
 *
 * @access private
 */
function _gutenberg_pass_default_connector_keys_to_ai_client(): void {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	try {
		$ai_registry = \WordPress\AiClient\AiClient::defaultRegistry();
		foreach ( wp_get_connectors() as $connector_id => $connector_data ) {
			if ( 'ai_provider' !== $connector_data['type'] ) {
				continue;
			}

			$auth = $connector_data['authentication'];
			if ( 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
				continue;
			}

			if ( ! $ai_registry->hasProvider( $connector_id ) ) {
				continue;
			}

			// Skip if the key is already provided via env var or constant.
			$key_source = _gutenberg_get_api_key_source(
				$auth['setting_name'],
				$auth['env_var_name'] ?? '',
				$auth['constant_name'] ?? ''
			);
			if ( 'env' === $key_source || 'constant' === $key_source ) {
				continue;
			}

			$api_key = get_option( $auth['setting_name'], '' );
			if ( ! is_string( $api_key ) || '' === $api_key ) {
				continue;
			}

			$ai_registry->setProviderRequestAuthentication(
				$connector_id,
				new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $api_key )
			);
		}
	} catch ( Exception $e ) {
		wp_trigger_error( __FUNCTION__, $e->getMessage() );
	}
}
remove_action( 'init', '_wp_connectors_pass_default_keys_to_ai_client', 20 );
add_action( 'init', '_gutenberg_pass_default_connector_keys_to_ai_client', 20 );

/**
 * Exposes connector settings to the options-connectors-wp-admin script module.
 *
 * @access private
 *
 * @param array $data Existing script module data.
 * @return array Script module data with connectors added.
 */
function _gutenberg_get_connector_script_module_data( array $data ): array {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return $data;
	}

	$registry = \WordPress\AiClient\AiClient::defaultRegistry();

	if ( ! function_exists( 'validate_plugin' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	$connectors = array();
	foreach ( wp_get_connectors() as $connector_id => $connector_data ) {
		$auth     = $connector_data['authentication'];
		$auth_out = array( 'method' => $auth['method'] );

		if ( 'api_key' === $auth['method'] ) {
			$auth_out['settingName']    = $auth['setting_name'] ?? '';
			$auth_out['credentialsUrl'] = $auth['credentials_url'] ?? null;
			$auth_out['keySource']      = _gutenberg_get_api_key_source(
				$auth['setting_name'] ?? '',
				$auth['env_var_name'] ?? '',
				$auth['constant_name'] ?? ''
			);

			if ( 'ai_provider' === $connector_data['type'] ) {
				try {
					$auth_out['isConnected'] = $registry->hasProvider( $connector_id ) && $registry->isProviderConfigured( $connector_id );
				} catch ( Exception $e ) {
					$auth_out['isConnected'] = false;
				}
			} else {
				// For non-AI connectors, consider connected if a key exists from any source.
				$auth_out['isConnected'] = 'none' !== $auth_out['keySource'];
			}
		} elseif ( 'application_password' === $auth['method'] ) {
			$credentials = _gutenberg_get_application_password_credentials( $auth );

			$auth_out['settingName']    = $auth['setting_name'] ?? '';
			$auth_out['credentialsUrl'] = $auth['credentials_url'] ?? null;
			$auth_out['keySource']      = $credentials['source'];
			$auth_out['isConnected']    = '' !== $credentials['username'] && '' !== $credentials['password'];
		}

		$connector_out = array(
			'name'           => $connector_data['name'],
			'description'    => $connector_data['description'],
			'logoUrl'        => ! empty( $connector_data['logo_url'] ) ? $connector_data['logo_url'] : null,
			'type'           => $connector_data['type'],
			'authentication' => $auth_out,
		);

		if ( ! empty( $connector_data['plugin']['file'] ) ) {
			$file         = $connector_data['plugin']['file'];
			$is_activated = (bool) call_user_func( $connector_data['plugin']['is_active'] );
			$is_installed = $is_activated || 0 === validate_plugin( $file );

			$connector_out['plugin'] = array(
				'file'        => $file,
				'isInstalled' => $is_installed,
				'isActivated' => $is_activated,
			);
		}

		$connectors[ $connector_id ] = $connector_out;
	}
	ksort( $connectors );
	$data['connectors']        = $connectors;
	$data['isFileModDisabled'] = ! wp_is_file_mod_allowed( 'install_plugins' );
	return $data;
}
remove_filter( 'script_module_data_options-connectors-wp-admin', '_wp_connectors_get_connector_script_module_data' );
add_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_get_connector_script_module_data' );
