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
 * Checks whether an API key is valid for a given provider.
 *
 * @param string $key         The API key to check.
 * @param string $provider_id The WP AI client provider ID.
 * @return bool|null True if valid, false if invalid, null if unable to determine.
 */
function gutenberg_is_api_key_valid( $key, $provider_id ) {
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
 * @param string $key         The API key.
 * @param string $provider_id The WP AI client provider ID.
 */
function gutenberg_set_provider_api_key( $key, $provider_id ) {
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
 * @param string $option_name    The option name for the API key.
 * @param string $mask_callback  The mask filter function name.
 * @return string The real API key value.
 */
function gutenberg_get_real_api_key( $option_name, $mask_callback ) {
	remove_filter( "option_{$option_name}", $mask_callback );
	$value = get_option( $option_name, '' );
	add_filter( "option_{$option_name}", $mask_callback );
	return $value;
}

// --- Gemini (Google) ---

/**
 * Masks and validates the Gemini API key on read.
 *
 * @param string $value The raw option value.
 * @return string Masked key, 'invalid_key', or empty string.
 */
function gutenberg_mask_gemini_api_key( $value ) {
	if ( empty( $value ) ) {
		return $value;
	}
	if ( false === gutenberg_is_api_key_valid( $value, 'google' ) ) {
		return 'invalid_key';
	}
	return gutenberg_mask_api_key( $value );
}

/**
 * Validates the Gemini API key before saving.
 *
 * @param string $value     The new value.
 * @param string $old_value The previous value.
 * @return string The value to persist.
 */
function gutenberg_validate_gemini_api_key_on_save( $value, $old_value ) {
	if ( empty( $value ) ) {
		return $value;
	}
	$valid = gutenberg_is_api_key_valid( $value, 'google' );
	return false === $valid ? $old_value : $value;
}

// --- OpenAI ---

/**
 * Masks and validates the OpenAI API key on read.
 *
 * @param string $value The raw option value.
 * @return string Masked key, 'invalid_key', or empty string.
 */
function gutenberg_mask_openai_api_key( $value ) {
	if ( empty( $value ) ) {
		return $value;
	}
	if ( false === gutenberg_is_api_key_valid( $value, 'openai' ) ) {
		return 'invalid_key';
	}
	return gutenberg_mask_api_key( $value );
}

/**
 * Validates the OpenAI API key before saving.
 *
 * @param string $value     The new value.
 * @param string $old_value The previous value.
 * @return string The value to persist.
 */
function gutenberg_validate_openai_api_key_on_save( $value, $old_value ) {
	if ( empty( $value ) ) {
		return $value;
	}
	$valid = gutenberg_is_api_key_valid( $value, 'openai' );
	return false === $valid ? $old_value : $value;
}

// --- Anthropic ---

/**
 * Masks and validates the Anthropic API key on read.
 *
 * @param string $value The raw option value.
 * @return string Masked key, 'invalid_key', or empty string.
 */
function gutenberg_mask_anthropic_api_key( $value ) {
	if ( empty( $value ) ) {
		return $value;
	}
	if ( false === gutenberg_is_api_key_valid( $value, 'anthropic' ) ) {
		return 'invalid_key';
	}
	return gutenberg_mask_api_key( $value );
}

/**
 * Validates the Anthropic API key before saving.
 *
 * @param string $value     The new value.
 * @param string $old_value The previous value.
 * @return string The value to persist.
 */
function gutenberg_validate_anthropic_api_key_on_save( $value, $old_value ) {
	if ( empty( $value ) ) {
		return $value;
	}
	$valid = gutenberg_is_api_key_valid( $value, 'anthropic' );
	return false === $valid ? $old_value : $value;
}

// --- Registration ---

/**
 * Registers the default connector settings, mask filters, and validation filters.
 */
function gutenberg_register_default_connector_settings() {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	$connectors = array(
		'connectors_gemini_api_key'    => array(
			'mask'     => 'gutenberg_mask_gemini_api_key',
			'validate' => 'gutenberg_validate_gemini_api_key_on_save',
		),
		'connectors_openai_api_key'    => array(
			'mask'     => 'gutenberg_mask_openai_api_key',
			'validate' => 'gutenberg_validate_openai_api_key_on_save',
		),
		'connectors_anthropic_api_key' => array(
			'mask'     => 'gutenberg_mask_anthropic_api_key',
			'validate' => 'gutenberg_validate_anthropic_api_key_on_save',
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
add_action( 'init', 'gutenberg_register_default_connector_settings' );

/**
 * Passes the default connector API keys to the WP AI client.
 */
function gutenberg_pass_default_connector_keys_to_ai_client() {
	if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
		return;
	}

	$connectors = array(
		'connectors_gemini_api_key'    => array( 'google', 'gutenberg_mask_gemini_api_key' ),
		'connectors_openai_api_key'    => array( 'openai', 'gutenberg_mask_openai_api_key' ),
		'connectors_anthropic_api_key' => array( 'anthropic', 'gutenberg_mask_anthropic_api_key' ),
	);

	foreach ( $connectors as $option_name => $config ) {
		$api_key = gutenberg_get_real_api_key( $option_name, $config[1] );
		if ( ! empty( $api_key ) ) {
			gutenberg_set_provider_api_key( $api_key, $config[0] );
		}
	}
}
add_action( 'init', 'gutenberg_pass_default_connector_keys_to_ai_client' );
