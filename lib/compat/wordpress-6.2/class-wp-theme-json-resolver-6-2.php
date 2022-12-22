<?php
/**
 * WP_Theme_JSON_Resolver_6_1 class
 *
 * @package gutenberg
 */

/**
 * Class that abstracts the processing of the different data sources
 * for site-level config and offers an API to work with them.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @access private
 */
class WP_Theme_JSON_Resolver_6_2 extends WP_Theme_JSON_Resolver_Base {

	/**
	 * Returns the user's origin config.
	 *
	 * @since 6.2 Added check for the WP_Theme_JSON_Gutenberg class to prevent $user
	 * values set in core fron overriding the new custom css values added to VALID_STYLES.
	 * This does not need to be backported to core as the new VALID_STYLES[css] value will
	 * be added to core with 6.2.
	 *
	 * @return WP_Theme_JSON_Gutenberg Entity that holds styles for user data.
	 */
	public static function get_user_data() {
		if ( null !== static::$user && static::$user instanceof WP_Theme_JSON_Gutenberg ) {
			return static::$user;
		}

		$config   = array();
		$user_cpt = static::get_user_data_from_wp_global_styles( wp_get_theme() );

		if ( array_key_exists( 'post_content', $user_cpt ) ) {
			$decoded_data = json_decode( $user_cpt['post_content'], true );

			$json_decoding_error = json_last_error();
			if ( JSON_ERROR_NONE !== $json_decoding_error ) {
				trigger_error( 'Error when decoding a theme.json schema for user data. ' . json_last_error_msg() );
				/**
				 * Filters the data provided by the user for global styles & settings.
				 *
				 * @param WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data.
				 */
				$theme_json = apply_filters( 'wp_theme_json_data_user', new WP_Theme_JSON_Data_Gutenberg( $config, 'custom' ) );
				$config     = $theme_json->get_data();
				return new WP_Theme_JSON_Gutenberg( $config, 'custom' );
			}

			// Very important to verify if the flag isGlobalStylesUserThemeJSON is true.
			// If is not true the content was not escaped and is not safe.
			if (
				is_array( $decoded_data ) &&
				isset( $decoded_data['isGlobalStylesUserThemeJSON'] ) &&
				$decoded_data['isGlobalStylesUserThemeJSON']
			) {
				unset( $decoded_data['isGlobalStylesUserThemeJSON'] );
				$config = $decoded_data;
			}
		}

		/**
		 * Filters the data provided by the user for global styles & settings.
		 *
		 * @param WP_Theme_JSON_Data_Gutenberg Class to access and update the underlying data.
		 */
		$theme_json = apply_filters( 'wp_theme_json_data_user', new WP_Theme_JSON_Data_Gutenberg( $config, 'custom' ) );
		$config     = $theme_json->get_data();

		static::$user = new WP_Theme_JSON_Gutenberg( $config, 'custom' );

		return static::$user;
	}
}
