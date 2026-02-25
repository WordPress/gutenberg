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
 * @param string $option_name    The option name for the API key.
 * @param string $mask_callback  The mask filter function name.
 * @return string The real API key value.
 */
function _gutenberg_get_real_api_key( string $option_name, string $mask_callback ): string {
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
	if ( empty( $value ) ) {
		return $value;
	}
	return _gutenberg_mask_api_key( $value );
}

/**
 * Validates the Gemini API key before saving.
 *
 * @access private
 *
 * @param string $value     The new value.
 * @param string $old_value The previous value.
 * @return string The value to persist.
 */
function _gutenberg_validate_gemini_api_key_on_save( string $value, string $old_value ): string {
	if ( '' === $value ) {
		return $value;
	}
	$valid = _gutenberg_is_api_key_valid( $value, 'google' );
	return false === $valid ? $old_value : $value;
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
 * Validates the OpenAI API key before saving.
 *
 * @access private
 *
 * @param string $value     The new value.
 * @param string $old_value The previous value.
 * @return string The value to persist.
 */
function _gutenberg_validate_openai_api_key_on_save( string $value, string $old_value ): string {
	if ( empty( $value ) ) {
		return $value;
	}
	$valid = _gutenberg_is_api_key_valid( $value, 'openai' );
	return false === $valid ? $old_value : $value;
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
 * Validates the Anthropic API key before saving.
 *
 * @access private
 *
 * @param string $value     The new value.
 * @param string $old_value The previous value.
 * @return string The value to persist.
 */
function _gutenberg_validate_anthropic_api_key_on_save( string $value, string $old_value ): string {
	if ( '' === $value ) {
		return $value;
	}
	$valid = _gutenberg_is_api_key_valid( $value, 'anthropic' );
	return false === $valid ? $old_value : $value;
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
	$connectors = array(
		'connectors_gemini_api_key'    => array( 'google', '_gutenberg_mask_gemini_api_key' ),
		'connectors_openai_api_key'    => array( 'openai', '_gutenberg_mask_openai_api_key' ),
		'connectors_anthropic_api_key' => array( 'anthropic', '_gutenberg_mask_anthropic_api_key' ),
	);

	foreach ( $connectors as $option_name => $config ) {
		if ( ! in_array( $option_name, $requested, true ) ) {
			continue;
		}
		$real_key = _gutenberg_get_real_api_key( $option_name, $config[1] );
		if ( empty( $real_key ) ) {
			continue;
		}
		if ( true !== _gutenberg_is_api_key_valid( $real_key, $config[0] ) ) {
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

	$connectors = array(
		'connectors_gemini_api_key'    => array(
			'mask'     => '_gutenberg_mask_gemini_api_key',
			'validate' => '_gutenberg_validate_gemini_api_key_on_save',
		),
		'connectors_openai_api_key'    => array(
			'mask'     => '_gutenberg_mask_openai_api_key',
			'validate' => '_gutenberg_validate_openai_api_key_on_save',
		),
		'connectors_anthropic_api_key' => array(
			'mask'     => '_gutenberg_mask_anthropic_api_key',
			'validate' => '_gutenberg_validate_anthropic_api_key_on_save',
		),
	);

	foreach ( $connectors as $option_name => $callbacks ) {
		register_setting(
			'connectors',
			$option_name,
			array(
				'type'              => 'string',
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
			)
		);
		add_filter( "option_{$option_name}", $callbacks['mask'] );
		add_filter( "pre_update_option_{$option_name}", $callbacks['validate'], 10, 2 );
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

	$connectors = array(
		'connectors_gemini_api_key'    => array( 'google', '_gutenberg_mask_gemini_api_key' ),
		'connectors_openai_api_key'    => array( 'openai', '_gutenberg_mask_openai_api_key' ),
		'connectors_anthropic_api_key' => array( 'anthropic', '_gutenberg_mask_anthropic_api_key' ),
	);

	foreach ( $connectors as $option_name => $config ) {
		$api_key = _gutenberg_get_real_api_key( $option_name, $config[1] );
		if ( ! empty( $api_key ) ) {
			_gutenberg_set_provider_api_key( $api_key, $config[0] );
		}
	}
}
add_action( 'init', '_gutenberg_pass_default_connector_keys_to_ai_client' );
