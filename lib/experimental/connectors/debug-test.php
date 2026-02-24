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
 * @param string $provider_id The provider ID.
 * @return array Test result.
 */
function gutenberg_test_ai_provider( $provider_id ) {
	try {
		$result = wp_ai_client_prompt( 'Say the word I will pass' )
			->with_text( 'hello' )
			->using_provider( $provider_id )
			->generate_text();
		return array(
			'status'   => 'success',
			'response' => $result,
		);
	} catch ( Exception $e ) {
		return array(
			'status'  => 'error',
			'message' => $e->getMessage(),
		);
	}
}

/**
 * Runs a test prompt against all available AI providers.
 */
function gutenberg_test_ai_providers() {
	// Only run if query param is set and user is admin.
	if ( ! isset( $_GET['gutenberg_test_connectors'] ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$results = array(
		'gemini' => gutenberg_test_ai_provider( 'google' ),
		'openai' => gutenberg_test_ai_provider( 'openai' ),
		'claude' => gutenberg_test_ai_provider( 'anthropic' ),
	);

	header( 'Content-Type: application/json' );
	echo wp_json_encode( $results, JSON_PRETTY_PRINT );
	exit;
}
add_action( 'wp_loaded', 'gutenberg_test_ai_providers', 1000 );
