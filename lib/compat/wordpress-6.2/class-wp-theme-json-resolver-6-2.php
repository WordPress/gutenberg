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
	 * Returns the data merged from multiple origins.
	 *
	 * There are four sources of data (origins) for a site:
	 *
	 * - default => WordPress
	 * - blocks  => each one of the blocks provides data for itself
	 * - theme   => the active theme
	 * - custom  => data provided by the user
	 *
	 * The custom's has higher priority than the theme's, the theme's higher than blocks',
	 * and block's higher than default's.
	 *
	 * Unlike the getters
	 * {@link https://developer.wordpress.org/reference/classes/wp_theme_json_resolver/get_core_data/ get_core_data},
	 * {@link https://developer.wordpress.org/reference/classes/wp_theme_json_resolver/get_theme_data/ get_theme_data},
	 * and {@link https://developer.wordpress.org/reference/classes/wp_theme_json_resolver/get_user_data/ get_user_data},
	 * this method returns data after it has been merged with the previous origins.
	 * This means that if the same piece of data is declared in different origins
	 * (default, blocks, theme, custom), the last origin overrides the previous.
	 *
	 * For example, if the user has set a background color
	 * for the paragraph block, and the theme has done it as well,
	 * the user preference wins.
	 *
	 * @param string $origin Optional. To what level should we merge data:'default', 'blocks', 'theme' or 'custom'.
	 *                       'custom' is used as default value as well as fallback value if the origin is unknown.
	 *
	 * @return WP_Theme_JSON
	 */
	public static function get_merged_data( $origin = 'custom' ) {
		if ( is_array( $origin ) ) {
			_deprecated_argument( __FUNCTION__, '5.9.0' );
		}

		$result = static::get_core_data();
		if ( 'default' === $origin ) {
			$result->set_spacing_sizes();
			return $result;
		}

		$result->merge( static::get_block_data() );
		if ( 'blocks' === $origin ) {
			return $result;
		}

		$result->merge( static::get_theme_data() );
		if ( 'theme' === $origin ) {
			$result->set_spacing_sizes();
			return $result;
		}

		$result->merge( static::get_user_data() );
		$result->set_spacing_sizes();
		return $result;
	}

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
