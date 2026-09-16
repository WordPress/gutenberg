<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Hide User REST Routes
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-hide-user-rest-routes
 */

/**
 * Removes the main Users REST routes for requests carrying the test cookie.
 * Application Password routes remain registered, matching sites that hide
 * public user profiles while keeping application authentication available.
 *
 * @param array $endpoints Registered REST endpoints.
 * @return array Filtered REST endpoints.
 */
function gutenberg_test_hide_user_rest_routes( $endpoints ) {
	$hide_user_routes = isset( $_COOKIE['gutenberg_test_hide_user_rest_routes'] )
		? sanitize_text_field( wp_unslash( $_COOKIE['gutenberg_test_hide_user_rest_routes'] ) )
		: '';

	if ( '1' !== $hide_user_routes ) {
		return $endpoints;
	}

	foreach ( array_keys( $endpoints ) as $route ) {
		if (
			str_starts_with( $route, '/wp/v2/users' ) &&
			! str_contains( $route, '/application-passwords' )
		) {
			unset( $endpoints[ $route ] );
		}
	}

	return $endpoints;
}
add_filter( 'rest_endpoints', 'gutenberg_test_hide_user_rest_routes' );
