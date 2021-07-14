<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Basic Authentication
 * Description: Basic Authentication handler for the JSON API, used only for testing purposes
 * Author: WordPress API Team
 * Author URI: https://github.com/WP-API
 * Version: 0.1
 * Plugin URI: https://github.com/WP-API/Basic-Auth
 *
 * @package gutenberg-test-basic-auth
 */

function json_basic_auth_handler( $user ) {
	global $wp_json_basic_auth_error;

	$wp_json_basic_auth_error = null;

	// Don't authenticate twice
	if ( ! empty( $user ) ) {
		return $user;
	}

	// Check that we're trying to authenticate
	if ( !isset( $_SERVER['PHP_AUTH_USER'] ) ) {
		return $user;
	}

	$username = $_SERVER['PHP_AUTH_USER'];
	$password = $_SERVER['PHP_AUTH_PW'];

	/**
	 * In multi-site, wp_authenticate_spam_check filter is run on authentication. This filter calls
	 * get_currentuserinfo which in turn calls the determine_current_user filter. This leads to infinite
	 * recursion and a stack overflow unless the current function is removed from the determine_current_user
	 * filter during authentication.
	 */
	remove_filter( 'determine_current_user', 'json_basic_auth_handler', 20 );

	$user = wp_authenticate( $username, $password );

	add_filter( 'determine_current_user', 'json_basic_auth_handler', 20 );

	if ( is_wp_error( $user ) ) {
		$wp_json_basic_auth_error = $user;
		return null;
	}

	$wp_json_basic_auth_error = true;

	return $user->ID;
}
add_filter( 'determine_current_user', 'json_basic_auth_handler', 20 );

function json_basic_auth_error( $error ) {
	// Passthrough other errors
	if ( ! empty( $error ) ) {
		return $error;
	}

	global $wp_json_basic_auth_error;

	return $wp_json_basic_auth_error;
}
add_filter( 'rest_authentication_errors', 'json_basic_auth_error' );
