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
function gutenberg_add_api_key_mask_filter( $option_name, $provider_id = '' ) {
	add_filter(
		"option_{$option_name}",
		function ( $value ) use ( $provider_id ) {
			if ( empty( $value ) ) {
				return $value;
			}

			if ( $provider_id ) {
				try {
					$registry = \WordPress\AiClient\AiClient::defaultRegistry();

					if ( ! $registry->hasProvider( $provider_id ) ) {
						return '';
					}

					$registry->setProviderRequestAuthentication(
						$provider_id,
						new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $value )
					);

					if ( ! $registry->isProviderConfigured( $provider_id ) ) {
						return '';
					}
				} catch ( \Error $e ) {
					// WP AI Client not available — skip validation, return masked.
				}
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
function gutenberg_get_real_api_key( $option_name, $provider_id = '' ) {
	// Remove all masking filters on this option.
	remove_all_filters( "option_{$option_name}" );

	$value = get_option( $option_name, '' );

	// Re-add the masking filter.
	gutenberg_add_api_key_mask_filter( $option_name, $provider_id );

	return $value;
}

/**
 * Registers a connector API key setting and adds masking and validation filters.
 *
 * Base function that can be used by any provider.
 *
 * @param string $option_name The option name for the API key.
 * @param string $provider_id Optional. The WP AI client provider ID for validation.
 */
function gutenberg_register_connector_api_key_setting( $option_name, $provider_id = '' ) {
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

	gutenberg_add_api_key_mask_filter( $option_name, $provider_id );

	if ( $provider_id ) {
		gutenberg_add_api_key_validation_filter( $option_name, $provider_id );
	}
}

/**
 * Adds a pre_update_option filter that validates an API key against the WP AI Client
 * before allowing it to be persisted.
 *
 * If the key is invalid (the provider cannot be configured with it), the filter
 * returns the old value, effectively rejecting the update. The client detects
 * the unchanged response and surfaces an error.
 *
 * @param string $option_name The option name for the API key.
 * @param string $provider_id The WP AI client provider ID.
 */
function gutenberg_add_api_key_validation_filter( $option_name, $provider_id ) {
	add_filter(
		"pre_update_option_{$option_name}",
		function ( $value, $old_value ) use ( $provider_id ) {
			// Always allow clearing the key.
			if ( empty( $value ) ) {
				return $value;
			}

			try {
				$registry = \WordPress\AiClient\AiClient::defaultRegistry();

				if ( ! $registry->hasProvider( $provider_id ) ) {
					return $old_value;
				}

				$registry->setProviderRequestAuthentication(
					$provider_id,
					new \WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication( $value )
				);

				if ( ! $registry->isProviderConfigured( $provider_id ) ) {
					return $old_value;
				}
			} catch ( \Error $e ) {
				// WP AI Client not available — allow update.
				return $value;
			}

			return $value;
		},
		10,
		2
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
	$api_key = gutenberg_get_real_api_key( $option_name, $provider_id );

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
	gutenberg_register_connector_api_key_setting( 'connectors_gemini_api_key', 'google' );
	gutenberg_register_connector_api_key_setting( 'connectors_openai_api_key', 'openai' );
	gutenberg_register_connector_api_key_setting( 'connectors_anthropic_api_key', 'anthropic' );
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
