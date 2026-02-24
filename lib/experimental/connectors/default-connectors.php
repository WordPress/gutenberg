<?php
/**
 * Default connectors backend logic.
 *
 * @package gutenberg
 */

/**
 * Masks an API key, showing only the last 4 characters.
 *
 * @param string $key The API key to mask.
 * @return string The masked key, e.g. "••••••••••••fj39".
 */
function gutenberg_mask_api_key( $key ) {
	if ( strlen( $key ) <= 4 ) {
		return $key;
	}
	return str_repeat( "\u{2022}", min( strlen( $key ) - 4, 16 ) ) . substr( $key, -4 );
}

/**
 * Filters get_option to return a masked API key for a connector setting.
 *
 * @param string $option_name The option name to mask.
 */
function gutenberg_add_api_key_mask_filter( $option_name ) {
	add_filter(
		"option_{$option_name}",
		function ( $value ) {
			if ( empty( $value ) ) {
				return $value;
			}
			return gutenberg_mask_api_key( $value );
		}
	);
}

/**
 * Retrieves the real (unmasked) value of a connector API key.
 *
 * Temporarily removes the masking filter, reads the option, then re-adds it.
 *
 * @param string $option_name The option name for the API key.
 * @return string The real API key value.
 */
function gutenberg_get_real_api_key( $option_name ) {
	// Remove all masking filters on this option.
	remove_all_filters( "option_{$option_name}" );

	$value = get_option( $option_name, '' );

	// Re-add the masking filter.
	gutenberg_add_api_key_mask_filter( $option_name );

	return $value;
}

/**
 * Registers a connector API key setting and adds a masking filter.
 *
 * Base function that can be used by any provider.
 *
 * @param string $option_name The option name for the API key.
 */
function gutenberg_register_connector_api_key_setting( $option_name ) {
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

	gutenberg_add_api_key_mask_filter( $option_name );
}

/**
 * Passes a connector API key to the WP AI client.
 *
 * Base function that can be used by any provider.
 *
 * @param string $option_name The option name for the API key.
 * @param string $provider_id The WP AI client provider ID.
 */
function gutenberg_pass_connector_key_to_ai_client( $option_name, $provider_id ) {
	$api_key = gutenberg_get_real_api_key( $option_name );

	if ( empty( $api_key ) ) {
		return;
	}

	try {
		$registry = \WordPress\AiClient\AiClient::defaultRegistry();

		if ( ! $registry->hasProvider( $provider_id ) ) {
			return;
		}

		$registry->setProviderRequestAuthentication(
			$provider_id,
			new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $api_key )
		);
	} catch ( \Error $e ) {
		// WP AI Client not available.
		return;
	}
}

/**
 * Registers the default connector settings.
 */
function gutenberg_register_default_connector_settings() {
	gutenberg_register_connector_api_key_setting( 'connectors_gemini_api_key' );
	gutenberg_register_connector_api_key_setting( 'connectors_openai_api_key' );
	gutenberg_register_connector_api_key_setting( 'connectors_anthropic_api_key' );
}
add_action( 'init', 'gutenberg_register_default_connector_settings' );

/**
 * Passes the default connector API keys to the WP AI client.
 */
function gutenberg_pass_default_connector_keys_to_ai_client() {
	gutenberg_pass_connector_key_to_ai_client( 'connectors_gemini_api_key', 'google' );
	gutenberg_pass_connector_key_to_ai_client( 'connectors_openai_api_key', 'openai' );
	gutenberg_pass_connector_key_to_ai_client( 'connectors_anthropic_api_key', 'anthropic' );
}
add_action( 'init', 'gutenberg_pass_default_connector_keys_to_ai_client' );
