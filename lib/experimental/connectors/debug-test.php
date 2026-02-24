<?php
/**
 * Debug test for AI providers.
 *
 * Trigger with: ?gutenberg_test_connectors=1 (as admin)
 *
 * @package gutenberg
 */

/**
 * Tests a single AI provider.
 *
 * @param object $registry The provider registry.
 * @param string $provider_id The provider ID.
 * @return array Test result.
 */
function gutenberg_test_ai_provider( $registry, $provider_id ) {
	$result = array(
		'is_registered' => $registry->hasProvider( $provider_id ),
		'is_configured' => $registry->isProviderConfigured( $provider_id ),
	);

	try {
		$response = wp_ai_client_prompt( 'Say the word I will pass' )
			->with_text( 'hello' )
			->using_provider( $provider_id )
			->generate_text();
		$result['prompt_test'] = array(
			'status'   => 'success',
			'response' => $response,
		);
	} catch ( Exception $e ) {
		$result['prompt_test'] = array(
			'status'  => 'error',
			'message' => $e->getMessage(),
		);
	}

	return $result;
}

/**
 * Runs a test prompt against all available AI providers.
 */
function gutenberg_test_ai_providers() {
	// Only run if query param is set and user is admin.
	if ( ! isset( $_GET['gutenberg_test_connectors'] ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	try {
		$registry = \WordPress\AiClient\AiClient::defaultRegistry();
	} catch ( \Error $e ) {
		header( 'Content-Type: application/json' );
		echo wp_json_encode( array( 'error' => 'WP AI Client not available: ' . $e->getMessage() ) );
		exit;
	}

	$results = array(
		'gemini' => gutenberg_test_ai_provider( $registry, 'google' ),
		'openai' => gutenberg_test_ai_provider( $registry, 'openai' ),
		'claude' => gutenberg_test_ai_provider( $registry, 'anthropic' ),
	);

	header( 'Content-Type: application/json' );
	echo wp_json_encode( $results, JSON_PRETTY_PRINT );
	exit;
}
add_action( 'wp_loaded', 'gutenberg_test_ai_providers', 1000 );
