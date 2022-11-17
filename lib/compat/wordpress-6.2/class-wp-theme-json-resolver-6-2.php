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

	/**
	 * Private method to clean the cached data after an upgrade.
	 *
	 * It is hooked into the `upgrader_process_complete` action.
	 *
	 * @since 6.2.0
	 * @see default-filters.php
	 *
	 * @param WP_Upgrader $upgrader WP_Upgrader instance.
	 * @param array       $options  Array of bulk item update data.
	 */
	public static function _clean_cached_data_upon_upgrading( $upgrader, $options ) {
		if ( 'update' !== $options['action'] ) {
			return;
		}

		if (
			'core' === $options['type'] ||
			'plugin' === $options['type'] ||
			// Clean cache only if the active theme was updated.
			( 'theme' === $options['type'] && ( isset( $options['themes'][ get_stylesheet() ] ) || isset( $options['themes'][ get_template() ] ) ) )
		) {
			static::clean_cached_data();
		}
	}

}
