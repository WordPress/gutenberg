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
 * @return string The masked key, e.g. "••••••••••••fj39".
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
			return null;
		}

		$registry->setProviderRequestAuthentication(
			$provider_id,
			new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $key )
		);

		return $registry->isProviderConfigured( $provider_id );
	} catch ( \Error $e ) {
		return null;
	}
}

/**
 * Sets the API key authentication for a provider on the WP AI Client registry.
 *
 * @access private
 *
 * @param string $key         The API key.
 * @param string $provider_id The WP AI client provider ID.
 */
function _gutenberg_set_provider_api_key( string $key, string $provider_id ): void {
	try {
		$registry = \WordPress\AiClient\AiClient::defaultRegistry();

		if ( ! $registry->hasProvider( $provider_id ) ) {
			return;
		}

		$registry->setProviderRequestAuthentication(
			$provider_id,
			new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $key )
		);
	} catch ( \Error $e ) {
		// WP AI Client not available.
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
	return $value;
}

// --- Gemini (Google) ---

/**
 * Masks the Gemini API key on read.
 *
 * @access private
 *
 * @param string $value The raw option value.
 * @return string Masked key or empty string.
 */
function _gutenberg_mask_gemini_api_key( string $value ): string {
	if ( '' === $value ) {
		return $value;
	}
	return _gutenberg_mask_api_key( $value );
}

/**
 * Sanitizes and validates the Gemini API key before saving.
 *
 * @access private
 *
 * @param string $value The new value.
 * @return string The sanitized value, or empty string if the key is not valid.
 */
function _gutenberg_sanitize_gemini_api_key( string $value ): string {
	$value = sanitize_text_field( $value );
	if ( '' === $value ) {
		return $value;
	}
	$valid = _gutenberg_is_api_key_valid( $value, 'google' );
	return true === $valid ? $value : '';
}

// --- OpenAI ---

/**
 * Masks the OpenAI API key on read.
 *
 * @access private
 *
 * @param string $value The raw option value.
 * @return string Masked key or empty string.
 */
function _gutenberg_mask_openai_api_key( string $value ): string {
	if ( '' === $value ) {
		return $value;
	}
	return _gutenberg_mask_api_key( $value );
}

/**
 * Sanitizes and validates the OpenAI API key before saving.
 *
 * @access private
 *
 * @param string $value The new value.
 * @return string The sanitized value, or empty string if the key is not valid.
 */
function _gutenberg_sanitize_openai_api_key( string $value ): string {
	$value = sanitize_text_field( $value );
	if ( '' === $value ) {
		return $value;
	}
	$valid = _gutenberg_is_api_key_valid( $value, 'openai' );
	return true === $valid ? $value : '';
}

// --- Anthropic ---

/**
 * Masks the Anthropic API key on read.
 *
 * @access private
 *
 * @param string $value The raw option value.
 * @return string Masked key or empty string.
 */
function _gutenberg_mask_anthropic_api_key( string $value ): string {
	if ( '' === $value ) {
		return $value;
	}
	return _gutenberg_mask_api_key( $value );
}

/**
 * Sanitizes and validates the Anthropic API key before saving.
 *
 * @access private
 *
 * @param string $value The new value.
 * @return string The sanitized value, or empty string if the key is not valid.
 */
function _gutenberg_sanitize_anthropic_api_key( string $value ): string {
	$value = sanitize_text_field( $value );
	if ( '' === $value ) {
		return $value;
	}
	$valid = _gutenberg_is_api_key_valid( $value, 'anthropic' );
	return true === $valid ? $value : '';
}

// --- Connector definitions ---

/**
 * Gets the provider connectors.
 *
 * @access private
 *
 * @return array<string, array{ provider: string, mask: callable, sanitize: callable }> Connectors.
 */
function _gutenberg_get_connectors(): array {
	return array(
		'connectors_gemini_api_key'    => array(
			'provider' => 'google',
			'mask'     => '_gutenberg_mask_gemini_api_key',
			'sanitize' => '_gutenberg_sanitize_gemini_api_key',
		),
		'connectors_openai_api_key'    => array(
			'provider' => 'openai',
			'mask'     => '_gutenberg_mask_openai_api_key',
			'sanitize' => '_gutenberg_sanitize_openai_api_key',
		),
		'connectors_anthropic_api_key' => array(
			'provider' => 'anthropic',
			'mask'     => '_gutenberg_mask_anthropic_api_key',
			'sanitize' => '_gutenberg_sanitize_anthropic_api_key',
		),
	);
}

// --- REST API filtering ---

/**
 * Validates connector API keys in the REST response when explicitly requested.
 *
 * Runs on `rest_post_dispatch` for `/wp/v2/settings` requests that include
 * connector fields via `_fields`. For each requested connector field, reads
 * the real (unmasked) key, validates it against the provider, and replaces
 * the response value with 'invalid_key' if validation fails.
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

	$fields = $request->get_param( '_fields' );
	if ( ! $fields ) {
		return $response;
	}

	$requested  = array_map( 'trim', explode( ',', $fields ) );
	$data       = $response->get_data();
	$connectors = _gutenberg_get_connectors();

	foreach ( $connectors as $option_name => $config ) {
		if ( ! in_array( $option_name, $requested, true ) ) {
			continue;
		}
		$real_key = _gutenberg_get_real_api_key( $option_name, $config['mask'] );
		if ( '' === $real_key ) {
			continue;
		}
		if ( true !== _gutenberg_is_api_key_valid( $real_key, $config['provider'] ) ) {
			$data[ $option_name ] = 'invalid_key';
		}
	}

	$response->set_data( $data );
	return $response;
}
add_filter( 'rest_post_dispatch', '_gutenberg_validate_connector_keys_in_rest', 10, 3 );

// --- Registration ---

/**
 * Registers the default connector settings, mask filters, and validation filters.
 *
 * @access private
 */
function _gutenberg_register_default_connector_settings(): void {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	$connectors = _gutenberg_get_connectors();

	foreach ( $connectors as $option_name => $config ) {
		register_setting(
			'connectors',
			$option_name,
			array(
				'type'              => 'string',
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => $config['sanitize'],
			)
		);
		add_filter( "option_{$option_name}", $config['mask'] );
	}
}
add_action( 'init', '_gutenberg_register_default_connector_settings' );

/**
 * Passes the default connector API keys to the WP AI client.
 *
 * @access private
 */
function _gutenberg_pass_default_connector_keys_to_ai_client(): void {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	$connectors = _gutenberg_get_connectors();

	foreach ( $connectors as $option_name => $config ) {
		$api_key = _gutenberg_get_real_api_key( $option_name, $config['mask'] );
		if ( ! empty( $api_key ) ) {
			_gutenberg_set_provider_api_key( $api_key, $config['provider'] );
		}
	}
}
add_action( 'init', '_gutenberg_pass_default_connector_keys_to_ai_client' );
