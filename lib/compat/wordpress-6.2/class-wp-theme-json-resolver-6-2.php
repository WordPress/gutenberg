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
class WP_Theme_JSON_Resolver_6_2 extends WP_Theme_JSON_Resolver_6_1 {

	/**
	 * Determines whether the active theme has a theme.json file.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added a check in the parent theme.
	 * @deprecated 6.2.0 Use wp_theme_has_theme_json() instead.
	 *
	 * @return bool
	 */
	public static function theme_has_support() {
		_deprecated_function( __METHOD__, '6.2.0', 'wp_theme_has_theme_json()' );

		return wp_theme_has_theme_json();
	}

}
