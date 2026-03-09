<?php
/**
 * Default connectors backend logic.
 *
 * @package gutenberg
 */

/**
 * Determines the source of an API key for a given provider.
 *
 * Checks in order: environment variable, PHP constant, database.
 * Uses the same naming convention as the WP AI Client ProviderRegistry.
 *
 * @access private
 *
 * @param string $provider_id The provider ID (e.g., 'openai', 'anthropic', 'google').
 * @return string The key source: 'env', 'constant', 'database', or 'none'.
 */
function _gutenberg_get_api_key_source( string $provider_id ): string {
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
	$setting_name = "connectors_ai_{$provider_id}_api_key";
	$db_value     = get_option( $setting_name, '' );
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
 * Resolves an AI provider logo file path to a URL.
 *
 * The AI Client library returns absolute file paths (not URLs) for logo files
 * since it is not WordPress-specific. This function converts a path within
 * the plugins or must-use plugins directory to the corresponding URL.
 *
 * @access private
 * @since 7.0.0
 *
 * @param string $path Absolute file path to the logo. Must be within
 *                     WP_PLUGIN_DIR or WPMU_PLUGIN_DIR; triggers
 *                     _doing_it_wrong() otherwise.
 * @return string|null The logo URL, or null if the path is empty or
 *                     outside the supported directories.
 */
function _gutenberg_resolve_ai_provider_logo_url( string $path ): ?string {
	if ( ! $path ) {
		return null;
	}

	$path = wp_normalize_path( $path );

	if ( ! file_exists( $path ) ) {
		return null;
	}

	$mu_plugin_dir = wp_normalize_path( WPMU_PLUGIN_DIR );
	if ( str_starts_with( $path, $mu_plugin_dir . '/' ) ) {
		return plugins_url( substr( $path, strlen( $mu_plugin_dir ) ), WPMU_PLUGIN_DIR . '/.' );
	}

	$plugin_dir = wp_normalize_path( WP_PLUGIN_DIR );
	if ( str_starts_with( $path, $plugin_dir . '/' ) ) {
		return plugins_url( substr( $path, strlen( $plugin_dir ) ) );
	}

	_doing_it_wrong(
		__FUNCTION__,
		__( 'Provider logo path must be located within the plugins or must-use plugins directory.', 'gutenberg' ),
		'7.0.0'
	);

	return null;
}

/**
 * Gets the registered connector settings.
 *
 * @access private
 *
 * @return array {
 *     Connector settings keyed by connector ID.
 *
 *     @type array ...$0 {
 *         Data for a single connector.
 *
 *         @type string $name           The connector's display name.
 *         @type string $description    The connector's description.
 *         @type string $type           The connector type. Currently, only 'ai_provider' is supported.
 *         @type array  $plugin         Optional. Plugin data for install/activate UI.
 *             @type string $slug       The WordPress.org plugin slug.
 *         }
 *         @type string $logo_url       Optional. URL to the connector's logo image.
 *         @type array  $authentication {
 *             Authentication configuration. When method is 'api_key', includes
 *             credentials_url and setting_name. When 'none', only method is present.
 *
 *             @type string      $method          The authentication method: 'api_key' or 'none'.
 *             @type string|null $credentials_url Optional. URL where users can obtain API credentials.
 *             @type string      $setting_name    Optional. The setting name for the API key.
 *         }
 *     }
 * }
 */
function _gutenberg_get_connector_settings(): array {
	$connectors = array(
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
	);

	$registry = \WordPress\AiClient\AiClient::defaultRegistry();

	foreach ( $registry->getRegisteredProviderIds() as $connector_id ) {
		$provider_class = $registry->getProviderClassName( $connector_id );
		$metadata       = $provider_class::metadata();

		$auth_method = $metadata->getAuthenticationMethod();
		$is_api_key  = null !== $auth_method && $auth_method->isApiKey();

		if ( $is_api_key ) {
			$credentials_url = $metadata->getCredentialsUrl();
			$authentication  = array(
				'method'          => 'api_key',
				'credentials_url' => $credentials_url ? $credentials_url : null,
			);
		} else {
			$authentication = array( 'method' => 'none' );
		}

		$name        = $metadata->getName();
		$description = method_exists( $metadata, 'getDescription' ) ? $metadata->getDescription() : null;
		$logo_url    = method_exists( $metadata, 'getLogoPath' ) && $metadata->getLogoPath()
			? _gutenberg_resolve_ai_provider_logo_url( $metadata->getLogoPath() )
			: null;

		if ( isset( $connectors[ $connector_id ] ) ) {
			// Override fields with non-empty registry values.
			if ( $name ) {
				$connectors[ $connector_id ]['name'] = $name;
			}
			if ( $description ) {
				$connectors[ $connector_id ]['description'] = $description;
			}
			if ( $logo_url ) {
				$connectors[ $connector_id ]['logo_url'] = $logo_url;
			}
			// Always update auth method; keep existing credentials_url as fallback.
			$connectors[ $connector_id ]['authentication']['method'] = $authentication['method'];
			if ( ! empty( $authentication['credentials_url'] ) ) {
				$connectors[ $connector_id ]['authentication']['credentials_url'] = $authentication['credentials_url'];
			}
		} else {
			$connectors[ $connector_id ] = array(
				'name'           => $name ? $name : ucwords( $connector_id ),
				'description'    => $description ? $description : '',
				'logo_url'       => $logo_url,
				'type'           => 'ai_provider',
				'authentication' => $authentication,
			);
		}
	}

	// Add setting_name for connectors that use API key authentication.
	foreach ( $connectors as $connector_id => $connector ) {
		if ( 'api_key' === $connector['authentication']['method'] ) {
			$connectors[ $connector_id ]['authentication']['setting_name'] = "connectors_ai_{$connector_id}_api_key";
		}
	}

	// Add plugin installation and activation status.
	// Build a slug-to-file map following the same pattern as WP_Plugin_Dependencies::get_plugin_dirnames().
	if ( ! function_exists( 'get_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	$plugin_files_by_slug = array();
	foreach ( array_keys( get_plugins() ) as $plugin_file ) {
		$slug                          = str_contains( $plugin_file, '/' ) ? dirname( $plugin_file ) : str_replace( '.php', '', $plugin_file );
		$plugin_files_by_slug[ $slug ] = $plugin_file;
	}

	foreach ( $connectors as $connector_id => $connector ) {
		if ( empty( $connector['plugin']['slug'] ) ) {
			continue;
		}

		$plugin_slug = $connector['plugin']['slug'];
		$plugin_file = $plugin_files_by_slug[ $plugin_slug ] ?? null;

		$is_installed = null !== $plugin_file;
		$is_activated = $is_installed && is_plugin_active( $plugin_file );

		$connectors[ $connector_id ]['plugin']['is_installed'] = $is_installed;
		$connectors[ $connector_id ]['plugin']['is_activated'] = $is_activated;
	}

	return $connectors;
}

remove_filter( 'rest_post_dispatch', '_wp_connectors_validate_keys_in_rest', 10 );

/**
 * Registers default connector settings and mask/sanitize filters.
 *
 * @access private
 */
function _gutenberg_register_default_connector_settings(): void {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	foreach ( _gutenberg_get_connector_settings() as $connector_id => $connector_data ) {
		$auth = $connector_data['authentication'];
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
					$connector_data['name']
				),
				'description'       => sprintf(
					/* translators: %s: AI provider name. */
					__( 'API key for the %s AI provider.', 'gutenberg' ),
					$connector_data['name']
				),
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => static function ( string $value ) use ( $connector_id ): string {
					$value = sanitize_text_field( $value );
					if ( '' === $value ) {
						return $value;
					}

					$valid = _gutenberg_is_ai_api_key_valid( $value, $connector_id );
					return true === $valid ? $value : '';
				},
			)
		);
		add_filter( "option_{$setting_name}", '_gutenberg_mask_api_key' );
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
		$registry = \WordPress\AiClient\AiClient::defaultRegistry();
		foreach ( _gutenberg_get_connector_settings() as $connector_id => $connector_data ) {
			if ( 'ai_provider' !== $connector_data['type'] ) {
				continue;
			}

			$auth = $connector_data['authentication'];
			if ( 'api_key' !== $auth['method'] || empty( $auth['setting_name'] ) ) {
				continue;
			}

			// Skip if the key is already provided via env var or constant.
			$key_source = _gutenberg_get_api_key_source( $connector_id );
			if ( 'env' === $key_source || 'constant' === $key_source ) {
				continue;
			}

			$api_key = _gutenberg_get_real_api_key( $auth['setting_name'], '_gutenberg_mask_api_key' );
			if ( '' === $api_key || ! $registry->hasProvider( $connector_id ) ) {
				continue;
			}

			$registry->setProviderRequestAuthentication(
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

	$registry   = \WordPress\AiClient\AiClient::defaultRegistry();
	$connectors = array();
	foreach ( _gutenberg_get_connector_settings() as $connector_id => $connector_data ) {
		$auth     = $connector_data['authentication'];
		$auth_out = array( 'method' => $auth['method'] );

		if ( 'api_key' === $auth['method'] ) {
			$auth_out['settingName']    = $auth['setting_name'] ?? '';
			$auth_out['credentialsUrl'] = $auth['credentials_url'] ?? null;
			$auth_out['keySource']      = _gutenberg_get_api_key_source( $connector_id );
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

		if ( ! empty( $connector_data['plugin'] ) ) {
			$connector_out['plugin'] = array(
				'slug'        => $connector_data['plugin']['slug'],
				'isInstalled' => $connector_data['plugin']['is_installed'] ?? false,
				'isActivated' => $connector_data['plugin']['is_activated'] ?? false,
			);
		}

		$connectors[ $connector_id ] = $connector_out;
	}
	$data['connectors'] = $connectors;
	return $data;
}
remove_filter( 'script_module_data_options-connectors-wp-admin', '_wp_connectors_get_connector_script_module_data' );
add_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_get_connector_script_module_data' );
