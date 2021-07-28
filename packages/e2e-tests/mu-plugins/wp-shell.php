<?php
/**
 * Plugin Name: Gutenberg Test Plugin, WP Shell
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Test-only REST API to enable remotely executing WordPress commands.
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-wp-shell
 */

/**
 * Evaluate commands from requests.
 *
 * @param WP_REST_Request $request The request.
 */
function evaluate_wp_shell( $request ) {
	$commands = $request['commands'];

	try {
		// phpcs:ignore
		$result = eval( $commands );
	} catch ( Exception $error ) {
		return new WP_Error(
			'shell_error',
			$error->getMessage(),
			array( 'status' => 500 )
		);
	} catch ( ParseError $error ) { // phpcs:ignore
		return new WP_Error(
			'shell_parse_error',
			$error->getMessage(),
			array( 'status' => 500 )
		);
	}

	return array(
		'commands' => $commands,
		'result'   => $result,
	);
}

/**
 * Register WP Shell REST API.
 */
function register_wp_shell_api() {
	register_rest_route(
		'wp-shell',
		'/eval',
		array(
			'methods'             => 'POST',
			'callback'            => 'evaluate_wp_shell',
			'permission_callback' => '__return_true',
		)
	);
}

add_action( 'rest_api_init', 'register_wp_shell_api' );
