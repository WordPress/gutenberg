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
class WP_Theme_JSON_Resolver_6_1 extends WP_Theme_JSON_Resolver_6_0 {

	// This is just here so we can get the 6.1 version of the class.
	public static function get_merged_data( $origin = 'custom' ) {
		if ( is_array( $origin ) ) {
			_deprecated_argument( __FUNCTION__, '5.9.0' );
		}

		$result = new WP_Theme_JSON_6_1();
		$result->merge( static::get_core_data() );
		$result->merge( static::get_theme_data() );

		if ( 'custom' === $origin ) {
			$result->merge( static::get_user_data() );
		}

		return $result;
	}
}
