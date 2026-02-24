<?php
/**
 * Default connectors backend logic.
 *
 * @package gutenberg
 */

/**
 * Registers a connector API key setting.
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
	$api_key = get_option( $option_name, '' );

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
