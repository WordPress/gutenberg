<?php
/**
 * API Endpoints.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Validates that a preference name is valid, as part of a REST API request.
 *
 * @param  string           $preference_name Preference name.
 * @param  WP_REST_Request  $request The REST request.
 * @param  string           $request The parameter key for the value being validated.
 * @return bool             If the preference name is valid.
 */
function gutenberg_validate_preference_name( $preference_name, $request, $key ) {
	return Gutenberg_User_Preferences::is_valid_preference_name( $preference_name );
}

/**
 * Callback for getting a specific user preference.
 *
 * @param  WP_REST_Request  $request The REST request.
 * @return mixed            The value of the preference.
 */
function gutenburg_get_user_preference( $request ) {
	$params = $request->get_url_params();
	return Gutenberg_User_Preferences::get_preference( get_current_user_id(), $params['preference'] );
}

/**
 * Callback for getting all preferences for a user.
 *
 * @param  WP_REST_Request  $request The REST request.
 * @return array            Associative array of user preferences.
 */
function gutenburg_get_user_preferences( $request ) {
	return Gutenberg_User_Preferences::get_preferences( get_current_user_id() );
}

/**
 * Callback for setting a user preference.
 *
 * @param  WP_REST_Request  $request The REST request.
 * @return bool             If the preference was set successfully.
 */
function gutenburg_set_user_preference( $request ) {
	$params = $request->get_params();
	return Gutenberg_User_Preferences::set_preference( get_current_user_id(), $params['preference'], $params['value'] );
}

/**
 * Callback for registering gutenberg API routes.
 *
 * @return null
 */
function gutenburg_register_routes() {
	register_rest_route( 'gutenburg/v1', '/user-preferences', array(
		'methods'  => WP_REST_Server::READABLE,
		'callback' => 'gutenburg_get_user_preferences',
	) );
	register_rest_route( 'gutenburg/v1', '/user-preferences/(?P<preference>[a-z_]+)', array(
		'methods'  => WP_REST_Server::READABLE,
		'callback' => 'gutenburg_get_user_preference',
		'args'     => array(
			'preference' => array(
				'validate_callback' => 'gutenberg_validate_preference_name',
			),
		),
	) );
	register_rest_route( 'gutenburg/v1', '/user-preferences/(?P<preference>[a-z_]+)', array(
		'methods'  => WP_REST_Server::EDITABLE,
		'callback' => 'gutenburg_set_user_preference',
		'args'     => array(
			'value' => array(
				'required' => true,
			),
			'preference' => array(
				'validate_callback' => 'gutenberg_validate_preference_name',
			),
		),
	) );
}

add_action( 'rest_api_init', 'gutenburg_register_routes' );
