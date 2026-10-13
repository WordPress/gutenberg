<?php
/**
 * Plugin Name: Gutenberg Test Autosave Failures
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-autosave-failures
 */

/**
 * Makes autosave requests fail in the way named by the
 * `gutenberg_test_autosave_failure` cookie.
 *
 * @param mixed           $result  Response to replace the requested version with.
 * @param WP_REST_Server  $server  Server instance.
 * @param WP_REST_Request $request Request used to generate the response.
 * @return mixed
 */
function gutenberg_test_autosave_failure( $result, $server, $request ) {
	if (
		'POST' !== $request->get_method() ||
		! str_ends_with( $request->get_route(), '/autosaves' ) ||
		empty( $_COOKIE['gutenberg_test_autosave_failure'] )
	) {
		return $result;
	}

	global $wpdb;

	switch ( $_COOKIE['gutenberg_test_autosave_failure'] ) {
		case 'fatal-error':
			ini_set( 'display_errors', '0' );
			gutenberg_test_autosave_undefined_function();
			break;

		case 'fatal-error-displayed':
			ini_set( 'display_errors', '1' );
			gutenberg_test_autosave_undefined_function();
			break;

		case 'database-connection-lost':
			$wpdb->query( 'KILL CONNECTION_ID()' );
			$wpdb->dbhost            = '127.0.0.1:1';
			$wpdb->reconnect_retries = 1;
			break;

		case 'database-write':
			add_filter(
				'query',
				static function ( $query ) use ( $wpdb ) {
					if ( str_starts_with( $query, "UPDATE `{$wpdb->posts}`" ) ) {
						return "UPDATE `{$wpdb->posts}_missing` SET ID = 0";
					}
					return $query;
				}
			);
			break;

		case 'permission':
			add_filter(
				'map_meta_cap',
				static function ( $caps, $cap ) {
					return 'edit_post' === $cap ? array( 'do_not_allow' ) : $caps;
				},
				10,
				2
			);
			break;

		case 'plain-message':
			return new WP_Error( 'test_error', 'Something went wrong on the server.', array( 'status' => 500 ) );

		case 'link-in-message':
			return new WP_Error( 'test_error', 'Blocked. <a href="https://example.com">Learn more</a>.', array( 'status' => 403 ) );

		case 'no-message':
			status_header( 500 );
			header( 'Content-Type: application/json' );
			echo '{}';
			exit;

		case 'zero':
			status_header( 500 );
			header( 'Content-Type: application/json' );
			echo '0';
			exit;

		case 'bad-gateway':
			status_header( 502 );
			header( 'Content-Type: text/html' );
			echo '<html><body><h1>502 Bad Gateway</h1></body></html>';
			exit;

		case 'dropped-connection':
			posix_kill( getmypid(), 9 );
			break;
	}

	return $result;
}
add_filter( 'rest_pre_dispatch', 'gutenberg_test_autosave_failure', 10, 3 );
