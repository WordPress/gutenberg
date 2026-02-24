<?php
/**
 * Gemini connector backend logic.
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
	// Only run if WP AI client is available (WordPress 6.8+).
	if ( ! class_exists( 'Jeeo\AiClient\AiClient' ) ) {
		return;
	}

	$api_key = get_option( $option_name, '' );

	if ( empty( $api_key ) ) {
		return;
	}

	$registry = \Jeeo\AiClient\AiClient::defaultRegistry();

	if ( ! $registry->hasProvider( $provider_id ) ) {
		return;
	}

	$registry->setProviderRequestAuthentication(
		$provider_id,
		new \Jeeo\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $api_key )
	);
}

/**
 * Registers the Gemini connector setting.
 */
function gutenberg_register_gemini_connector_setting() {
	gutenberg_register_connector_api_key_setting( 'connectors_gemini_api_key' );
}
add_action( 'init', 'gutenberg_register_gemini_connector_setting' );

/**
 * Passes the Gemini API key to the WP AI client.
 */
function gutenberg_pass_gemini_key_to_ai_client() {
	gutenberg_pass_connector_key_to_ai_client( 'connectors_gemini_api_key', 'google' );
}
add_action( 'init', 'gutenberg_pass_gemini_key_to_ai_client', 20 );
