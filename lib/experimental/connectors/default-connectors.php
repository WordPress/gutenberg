<?php
/**
 * Default connectors backend logic.
 *
 * @package gutenberg
 */

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
function _gutenberg_is_api_key_valid( string $key, string $provider_id ): ?bool {
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
 * Retrieves the real (unmasked) value of a connector API key.
 *
 * Temporarily removes the masking filter, reads the option, then re-adds it.
 *
 * @access private
 *
 * @param string   $option_name   The option name for the API key.
 * @param callable $mask_callback The mask filter function.
 * @return string The real API key value.
 */
function _gutenberg_get_real_api_key( string $option_name, callable $mask_callback ): string {
	remove_filter( "option_{$option_name}", $mask_callback );
	$value = get_option( $option_name, '' );
	add_filter( "option_{$option_name}", $mask_callback );
	return (string) $value;
}

/**
 * Gets the registered connector settings.
 *
 * @access private
 *
 * @return array {
 *     Provider settings keyed by provider ID.
 *
 *     @type array ...$0 {
 *         Data for a single provider.
 *
 *         @type string $name           The provider's display name.
 *         @type string $description    The provider's description.
 *         @type string $type           The connector type: 'ai_provider'.
 *         @type array  $authentication {
 *             Authentication configuration.
 *
 *             @type string      $method          The authentication method: 'api_key' or 'none'.
 *             @type string|null $credentials_url URL where users can obtain API credentials (api_key only).
 *             @type string      $setting_name    The setting name for the API key (api_key only).
 *         }
 *     }
 * }
 */
function _gutenberg_get_connector_settings(): array {
	$providers = array(
		'google'    => array(
			'name'           => 'Gemini',
			'description'    => __( 'Content generation, translation, and vision with Google\'s Gemini.', 'gutenberg' ),
			'type'           => 'ai_provider',
			'authentication' => array(
				'method'          => 'api_key',
				'credentials_url' => 'https://aistudio.google.com/api-keys',
			),
		),
		'openai'    => array(
			'name'           => 'OpenAI',
			'description'    => __( 'Text, image, and code generation with GPT and DALL-E.', 'gutenberg' ),
			'type'           => 'ai_provider',
			'authentication' => array(
				'method'          => 'api_key',
				'credentials_url' => 'https://platform.openai.com/api-keys',
			),
		),
		'anthropic' => array(
			'name'           => 'Claude',
			'description'    => __( 'Writing, research, and analysis with Claude.', 'gutenberg' ),
			'type'           => 'ai_provider',
			'authentication' => array(
				'method'          => 'api_key',
				'credentials_url' => 'https://platform.claude.com/settings/keys',
			),
		),
	);

	$registry = \WordPress\AiClient\AiClient::defaultRegistry();

	foreach ( $registry->getRegisteredProviderIds() as $provider_id ) {
		$provider_class_name = $registry->getProviderClassName( $provider_id );
		$provider_metadata   = $provider_class_name::metadata();

		$auth_method     = $provider_metadata->getAuthenticationMethod();
		$is_api_key      = null !== $auth_method && $auth_method->isApiKey();
		$credentials_url = $provider_metadata->getCredentialsUrl();

		$authentication = $is_api_key
			? array(
				'method'          => 'api_key',
				'credentials_url' => $credentials_url ? $credentials_url : null,
			)
			: array( 'method' => 'none' );

		$registry_data = array_filter(
			array(
				'name'        => $provider_metadata->getName(),
				'description' => method_exists( $provider_metadata, 'getDescription' ) ? $provider_metadata->getDescription() : null,
			)
		);

		if ( isset( $providers[ $provider_id ] ) ) {
			// Merge non-empty registry data over hardcoded fallbacks.
			$providers[ $provider_id ] = array_merge( $providers[ $provider_id ], $registry_data );
			// Update authentication from the registry.
			$providers[ $provider_id ]['authentication'] = array_merge(
				$providers[ $provider_id ]['authentication'],
				array_filter( $authentication )
			);
		} else {
			$providers[ $provider_id ] = array_merge(
				array(
					'name'           => ucwords( $provider_id ),
					'description'    => '',
					'type'           => 'ai_provider',
					'authentication' => $authentication,
				),
				$registry_data
			);
		}
	}

	$provider_settings = array();
	foreach ( $providers as $provider => $data ) {
		$auth = $data['authentication'];

		if ( 'api_key' === $auth['method'] ) {
			$auth['setting_name'] = "connectors_ai_{$provider}_api_key";
		}

		$provider_settings[ $provider ] = array(
			'name'           => $data['name'],
			'description'    => $data['description'],
			'type'           => $data['type'],
			'authentication' => $auth,
		);
	}
	return $provider_settings;
}

/**
 * Validates connector API keys in the REST response when explicitly requested.
 *
 * Runs on `rest_post_dispatch` for `/wp/v2/settings` requests that include connector
 * fields via `_fields`. For each requested connector field, it validates the unmasked
 * key against the provider and replaces the response value with `invalid_key` if
 * validation fails.
 *
 * @access private
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_REST_Server   $server   The server instance.
 * @param WP_REST_Request  $request  The request object.
 * @return WP_REST_Response The potentially modified response.
 */
function _gutenberg_validate_connector_keys_in_rest( WP_REST_Response $response, WP_REST_Server $server, WP_REST_Request $request ): WP_REST_Response {
	if ( '/wp/v2/settings' !== $request->get_route() ) {
		return $response;
	}

	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return $response;
	}

	$fields = $request->get_param( '_fields' );
	if ( ! $fields ) {
		return $response;
	}

	if ( is_array( $fields ) ) {
		$requested = $fields;
	} else {
		$requested = array_map( 'trim', explode( ',', $fields ) );
	}

	$data = $response->get_data();
	if ( ! is_array( $data ) ) {
		return $response;
	}

	foreach ( _gutenberg_get_connector_settings() as $provider => $provider_data ) {
		$auth = $provider_data['authentication'];
		if ( 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
			continue;
		}

		$setting_name = $auth['setting_name'];
		if ( ! in_array( $setting_name, $requested, true ) ) {
			continue;
		}

		$real_key = _gutenberg_get_real_api_key( $setting_name, '_gutenberg_mask_api_key' );
		if ( '' === $real_key ) {
			continue;
		}

		if ( true !== _gutenberg_is_api_key_valid( $real_key, $provider ) ) {
			$data[ $setting_name ] = 'invalid_key';
		}
	}

	$response->set_data( $data );
	return $response;
}
remove_filter( 'rest_post_dispatch', '_wp_connectors_validate_keys_in_rest', 10 );
add_filter( 'rest_post_dispatch', '_gutenberg_validate_connector_keys_in_rest', 10, 3 );

/**
 * Registers default connector settings and mask/sanitize filters.
 *
 * @access private
 */
function _gutenberg_register_default_connector_settings(): void {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	foreach ( _gutenberg_get_connector_settings() as $provider => $provider_data ) {
		$auth = $provider_data['authentication'];
		if ( 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
			continue;
		}

		$setting_name = $auth['setting_name'];
		register_setting(
			'connectors',
			$setting_name,
			array(
				'type'              => 'string',
				'label'             => sprintf(
					/* translators: %s: AI provider name. */
					__( '%s API Key', 'gutenberg' ),
					$provider_data['name']
				),
				'description'       => sprintf(
					/* translators: %s: AI provider name. */
					__( 'API key for the %s AI provider.', 'gutenberg' ),
					$provider_data['name']
				),
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => static function ( string $value ) use ( $provider ): string {
					$value = sanitize_text_field( $value );
					if ( '' === $value ) {
						return $value;
					}

					$valid = _gutenberg_is_api_key_valid( $value, $provider );
					return true === $valid ? $value : '';
				},
			)
		);
		add_filter( "option_{$setting_name}", '_gutenberg_mask_api_key' );
	}
}
remove_action( 'init', '_wp_register_default_connector_settings' );
add_action( 'init', '_gutenberg_register_default_connector_settings' );

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
		$registry = \WordPress\AiClient\AiClient::defaultRegistry();
		foreach ( _gutenberg_get_connector_settings() as $provider => $provider_data ) {
			if ( 'ai_provider' !== $provider_data['type'] ) {
				continue;
			}

			$auth = $provider_data['authentication'];
			if ( 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
				continue;
			}

			$api_key = _gutenberg_get_real_api_key( $auth['setting_name'], '_gutenberg_mask_api_key' );
			if ( '' === $api_key || ! $registry->hasProvider( $provider ) ) {
				continue;
			}

			$registry->setProviderRequestAuthentication(
				$provider,
				new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $api_key )
			);
		}
	} catch ( Exception $e ) {
		wp_trigger_error( __FUNCTION__, $e->getMessage() );
	}
}
remove_action( 'init', '_wp_connectors_pass_default_keys_to_ai_client' );
add_action( 'init', '_gutenberg_pass_default_connector_keys_to_ai_client' );

/**
 * Exposes connector provider settings to the connectors-wp-admin script module.
 *
 * @access private
 *
 * @param array $data Existing script module data.
 * @return array Script module data with providers added.
 */
function _gutenberg_get_connector_provider_script_module_data( array $data ): array {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return $data;
	}

	$providers = array();
	foreach ( _gutenberg_get_connector_settings() as $provider_id => $provider_data ) {
		$auth     = $provider_data['authentication'];
		$auth_out = array( 'method' => $auth['method'] );

		if ( 'api_key' === $auth['method'] ) {
			$auth_out['settingName']    = $auth['setting_name'] ?? '';
			$auth_out['credentialsUrl'] = $auth['credentials_url'] ?? null;
		}

		$providers[ $provider_id ] = array(
			'name'           => $provider_data['name'],
			'description'    => $provider_data['description'],
			'type'           => $provider_data['type'],
			'authentication' => $auth_out,
		);
	}
	$data['providers'] = $providers;
	return $data;
}
add_filter( 'script_module_data_connectors-wp-admin', '_gutenberg_get_connector_provider_script_module_data' );
