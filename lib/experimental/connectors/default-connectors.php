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
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	$registry = new WP_Connector_Registry();
	WP_Connector_Registry::set_instance( $registry );

	// Built-in connectors.
	$defaults = array(
		'anthropic' => array(
			'name'           => 'Anthropic',
			'description'    => __( 'Text generation with Claude.', 'gutenberg' ),
			'type'           => 'ai_provider',
			'plugin'         => array(
				'slug' => 'ai-provider-for-anthropic',
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
				'slug' => 'ai-provider-for-google',
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
				'slug' => 'ai-provider-for-openai',
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

	foreach ( $ai_registry->getRegisteredProviderIds() as $connector_id ) {
		$provider_class_name = $ai_registry->getProviderClassName( $connector_id );
		$provider_metadata   = $provider_class_name::metadata();

		$auth_method = method_exists( $provider_metadata, 'getAuthenticationMethod' ) ? $provider_metadata->getAuthenticationMethod() : null;
		$is_api_key  = null !== $auth_method && $auth_method->isApiKey();

		if ( $is_api_key ) {
			$credentials_url = $provider_metadata->getCredentialsUrl();
			$authentication  = array(
				'method'          => 'api_key',
				'credentials_url' => $credentials_url ? $credentials_url : null,
			);
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
				'logo_url'       => $logo_url,
			);
		}
	}

	// Register all default connectors directly on the registry.
	foreach ( $defaults as $id => $args ) {
		$registry->register( $id, $args );
	}

	/**
	 * Fires when the connector registry is ready for plugins to register connectors.
	 *
	 * Default connectors have already been registered at this point and cannot be
	 * unhooked. Use `$registry->register()` within this action to add new connectors.
	 *
	 * Example usage:
	 *
	 *     add_action( 'wp_connectors_init', function ( WP_Connector_Registry $registry ) {
	 *         $registry->register(
	 *             'my_custom_ai',
	 *             array(
	 *                 'name'           => __( 'My Custom AI', 'my-plugin' ),
	 *                 'description'    => __( 'Custom AI provider integration.', 'my-plugin' ),
	 *                 'type'           => 'ai_provider',
	 *                 'authentication' => array(
	 *                     'method'          => 'api_key',
	 *                     'credentials_url' => 'https://example.com/api-keys',
	 *                 ),
	 *             )
	 *         );
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
 * Determines the source of an API key for a given provider.
 *
 * Checks in order: environment variable, PHP constant, database.
 * Uses the same naming convention as the WP AI Client ProviderRegistry.
 *
 * @access private
 *
 * @param string $provider_id  The provider ID (e.g., 'openai', 'anthropic', 'google').
 * @param string $setting_name The option name for the API key (e.g., 'connectors_ai_openai_api_key').
 * @return string The key source: 'env', 'constant', 'database', or 'none'.
 */
function _gutenberg_get_api_key_source( string $provider_id, string $setting_name ): string {
	// Convert provider ID to CONSTANT_CASE for env var name.
	// e.g., 'openai' -> 'OPENAI', 'anthropic' -> 'ANTHROPIC'.
	$constant_case_id = strtoupper(
		preg_replace( '/([a-z])([A-Z])/', '$1_$2', str_replace( '-', '_', $provider_id ) )
	);
	$env_var_name     = "{$constant_case_id}_API_KEY";

	// Check environment variable first.
	$env_value = getenv( $env_var_name );
	if ( false !== $env_value && '' !== $env_value ) {
		return 'env';
	}

	// Check PHP constant.
	if ( defined( $env_var_name ) ) {
		$const_value = constant( $env_var_name );
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
 * Masks and validates connector API keys in REST responses.
 *
 * On every `/wp/v2/settings` response, masks connector API key values so raw
 * keys are never exposed via the REST API.
 *
 * On POST or PUT requests, validates each updated key against the provider
 * before masking. If validation fails, the key is reverted to an empty string.
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
		if ( 'ai_provider' !== $connector_data['type'] || 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
			continue;
		}

		$setting_name = $auth['setting_name'];
		if ( ! array_key_exists( $setting_name, $data ) ) {
			continue;
		}

		$value = $data[ $setting_name ];

		// On update, validate the key before masking.
		if ( $is_update && is_string( $value ) && '' !== $value ) {
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
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	$ai_registry = \WordPress\AiClient\AiClient::defaultRegistry();

	foreach ( wp_get_connectors() as $connector_id => $connector_data ) {
		$auth = $connector_data['authentication'];
		if ( 'ai_provider' !== $connector_data['type'] || 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
			continue;
		}

		// Skip registering the setting if the provider is not in the registry.
		if ( ! $ai_registry->hasProvider( $connector_id ) ) {
			continue;
		}

		register_setting(
			'connectors',
			$auth['setting_name'],
			array(
				'type'              => 'string',
				'label'             => sprintf(
					/* translators: %s: AI provider name. */
					__( '%s API Key', 'gutenberg' ),
					$connector_data['name']
				),
				'description'       => sprintf(
					/* translators: %s: AI provider name. */
					__( 'API key for the %s AI provider.', 'gutenberg' ),
					$connector_data['name']
				),
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
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
			$key_source = _gutenberg_get_api_key_source( $connector_id, $auth['setting_name'] );
			if ( 'env' === $key_source || 'constant' === $key_source ) {
				continue;
			}

			$api_key = get_option( $auth['setting_name'], '' );
			if ( '' === $api_key ) {
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

	// Build a slug-to-file map for plugin installation status.
	if ( ! function_exists( 'get_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	$plugin_files_by_slug = array();
	foreach ( array_keys( get_plugins() ) as $plugin_file ) {
		$slug                          = str_contains( $plugin_file, '/' ) ? dirname( $plugin_file ) : str_replace( '.php', '', $plugin_file );
		$plugin_files_by_slug[ $slug ] = $plugin_file;
	}

	$connectors = array();
	foreach ( wp_get_connectors() as $connector_id => $connector_data ) {
		$auth     = $connector_data['authentication'];
		$auth_out = array( 'method' => $auth['method'] );

		if ( 'api_key' === $auth['method'] ) {
			$auth_out['settingName']    = $auth['setting_name'] ?? '';
			$auth_out['credentialsUrl'] = $auth['credentials_url'] ?? null;
			$auth_out['keySource']      = _gutenberg_get_api_key_source( $connector_id, $auth['setting_name'] ?? '' );
			try {
				$auth_out['isConnected'] = $registry->hasProvider( $connector_id ) && $registry->isProviderConfigured( $connector_id );
			} catch ( Exception $e ) {
				$auth_out['isConnected'] = false;
			}
		}

		$connector_out = array(
			'name'           => $connector_data['name'],
			'description'    => $connector_data['description'],
			'logoUrl'        => ! empty( $connector_data['logo_url'] ) ? $connector_data['logo_url'] : null,
			'type'           => $connector_data['type'],
			'authentication' => $auth_out,
		);

		if ( ! empty( $connector_data['plugin']['slug'] ) ) {
			$plugin_slug = $connector_data['plugin']['slug'];
			$plugin_file = $plugin_files_by_slug[ $plugin_slug ] ?? null;

			$is_installed = null !== $plugin_file;
			$is_activated = $is_installed && is_plugin_active( $plugin_file );

			$connector_out['plugin'] = array(
				'slug'        => $plugin_slug,
				'isInstalled' => $is_installed,
				'isActivated' => $is_activated,
			);
		}

		$connectors[ $connector_id ] = $connector_out;
	}
	ksort( $connectors );
	$data['connectors'] = $connectors;
	return $data;
}
remove_filter( 'script_module_data_options-connectors-wp-admin', '_wp_connectors_get_connector_script_module_data' );
add_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_get_connector_script_module_data' );
