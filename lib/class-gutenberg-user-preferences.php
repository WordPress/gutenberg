<?php
/**
 * Preference handling.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * User preference management.
 */
class Gutenberg_User_Preferences {
	const VALID_PREFERENCES = array(
		'block_usage',
		'layout_config',
	);

	/**
	 * Validates that a preference name is valid, as part of a REST API request.
	 *
	 * @param  string $preference_name Preference name.
	 * @return bool   If the preference name is valid preference.
	 */
	public static function is_valid_preference_name( $preference_name ) {
		return in_array( $preference_name, self::VALID_PREFERENCES );
	}

	/**
	 * Validates that all preference names in the request are valid.
	 *
	 * @param  String          $param Preference name.
	 * @param  WP_REST_Request $request The REST request.
	 * @param  String          $key The parameter key for the value being validated.
	 * @return Bool            If all keys are valid preference names.
	 */
	public static function validate_preferences( $param, $request, $key ) {
		foreach ( $param as $preference_name => $value ) {
			if ( ! self::is_valid_preference_name( $preference_name ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Checks that the user has the needd permissions to store and read preferences.
	 *
	 * @return bool
	 */
	public static function check_permissions() {
		$user_id = get_current_user_id();
		return user_can( $user_id, 'edit_posts' );
	}

	/**
	 * Gets all preferences for a user.
	 *
	 * @param  WP_REST_Request $request The REST request.
	 * @return mixed           Stored preference values indexed by preference name.
	 */
	public static function get_preferences( $request ) {
		$user_id = get_current_user_id();
		$preferences = array();
		foreach ( self::VALID_PREFERENCES as $preference_name ) {
			$preferences[ $preference_name ] = get_user_meta( $user_id, 'gutenberg_' . $preference_name );
		}
		return $preferences;
	}

	/**
	 * Sets preferences for a user.
	 *
	 * Expects an array of preferences to store, indexed by the preference name.
	 *
	 * @param  WP_REST_Request $request The REST request.
	 * @return bool            If the store was successful.
	 */
	public static function set_preferences( $request ) {
		$params = $request->get_params();
		$user_id = get_current_user_id();

		foreach ( $params['preferences'] as $preference_name => $value ) {
			if ( ! self::is_valid_preference_name( $preference_name ) ) {
				return false;
			}
		}

		foreach ( $params['preferences'] as $preference_name => $value ) {
			update_user_meta( $user_id, 'gutenberg_' . $preference_name, $value );
		}

		return true;
	}

	/**
	 * Registers preferences API routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route( 'gutenberg/v1', '/user-preferences', array(
			array(
				'methods'  => WP_REST_Server::READABLE,
				'callback' => 'Gutenberg_User_Preferences::get_preferences',
				'permission_callback' => 'Gutenberg_User_Preferences::check_permissions',
			),
			array(
				'methods'  => WP_REST_Server::EDITABLE,
				'callback' => 'Gutenberg_User_Preferences::set_preferences',
				'permission_callback' => 'Gutenberg_User_Preferences::check_permissions',
				'args'     => array(
					'preferences' => array(
						'required'          => true,
						'validate_callback' => 'Gutenberg_User_Preferences::validate_preferences',
					),
				),
			),
		) );
	}
}
