<?php
/**
 * Preference handling.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/***
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
	 * @param  string           $preference_name Preference name.
	 * @return bool             If the preference name is valid preference.
	 */
	public static function is_valid_preference_name( $preference_name ) {
		return in_array( $preference_name, self::VALID_PREFERENCES );
	}

	/**
	 * Gets a single preference for a user.
	 *
	 * @param  int              $user_id User ID.
	 * @param  string           $preference_name Preference name.
	 * @return mixed            Stored preference value.
	 */
	public static function get_preference( $user_id, $preference_name ) {
		if ( ! self::is_valid_preference_name( $preference_name ) ) {
			return false;
		}
		return get_user_meta( $user_id, 'gutenburg_' . $preference_name );
	}

	/**
	 * Gets all preferences for a user.
	 *
	 * @param  int              $user_id User ID.
	 * @return mixed            Stored preference values indexed by preference name.
	 */
	public static function get_preferences( $user_id ) {
		$preferences = array();
		foreach ( self::VALID_PREFERENCES as $preference_name ) {
			$preferences[ $preference_name ] = get_user_meta( $user_id, 'gutenburg_' . $preference_name );
		}
		return $preferences;
	}

	/**
	 * Sets a single preference for a user.
	 *
	 * @param      int              $user_id User ID.
	 * @param      string           $preference_name Preference name.
	 * @param      mixed            Preference value to store.
	 * @return     bool             If the store was successful.
	 */
	public static function set_preference( $user_id, $preference_name, $value ) {
		if ( ! self::is_valid_preference_name( $preference_name ) ) {
			return false;
		}
		update_user_meta( $user_id, 'gutenburg_' . $preference_name, $value );
		return true;
	}
}
