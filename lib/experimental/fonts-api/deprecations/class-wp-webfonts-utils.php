<?php
/**
 * Webfont API's utility helpers.
 *
 * BACKPORT NOTE: Do not backport this file to Core.
 * This file is now part of the API's Backwards-Compatibility (BC) layer.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( class_exists( 'WP_Webfonts_Utils' ) ) {
	return;
}

/**
 * Utility helpers for the Webfonts API.
 *
 * @since X.X.X
 * @deprecated GB 15.1 Use WP_Fonts_Utils instead.
 */
class WP_Webfonts_Utils {

	/**
	 * Converts the given font family into a handle.
	 *
	 * @since X.X.X
	 * @deprecated 15.1 Use WP_Fonts_Utils::convert_font_family_into_handle() instead.
	 *
	 * @param string $font_family Font family to convert into a handle.
	 * @return string|null The font family handle on success. Else, null.
	 */
	public static function convert_font_family_into_handle( $font_family ) {
		_deprecated_function( __METHOD__, 'GB 15.1', 'WP_Fonts_Utils::convert_font_family_into_handle()' );

		return WP_Fonts_Utils::convert_font_family_into_handle( $font_family );
	}

	/**
	 * Converts the given variation and its font-family into a handle.
	 *
	 * @since X.X.X
	 * @deprecated 15.1 Use WP_Fonts_Utils::convert_variation_into_handle() instead.
	 *
	 * @param string $font_family The font family's handle for this variation.
	 * @param array  $variation   An array of variation properties.
	 * @return string|null The variation handle.
	 */
	public static function convert_variation_into_handle( $font_family, array $variation ) {
		_deprecated_function( __METHOD__, 'GB 15.1', 'WP_Fonts_Utils::convert_variation_into_handle()' );

		return WP_Fonts_Utils::convert_variation_into_handle( $variation );
	}

	/**
	 * Gets the font family from the variation.
	 *
	 * @since X.X.X
	 * @deprecated 15.1 Use WP_Fonts_Utils::get_font_family_from_variation() instead.
	 *
	 * @param array $variation An array of variation properties to search.
	 * @return string|null The font family if defined. Else, null.
	 */
	public static function get_font_family_from_variation( array $variation ) {
		_deprecated_function( __METHOD__, 'GB 15.1', 'WP_Fonts_Utils::get_font_family_from_variation()' );

		return WP_Fonts_Utils::get_font_family_from_variation( $variation );
	}

	/**
	 * Checks if the given input is defined, i.e. meaning is a non-empty string.
	 *
	 * @since X.X.X
	 * @deprecated 15.1 Use WP_Fonts_Utils::is_defined() instead.
	 *
	 * @param string $input The input to check.
	 * @return bool True when non-empty string. Else false.
	 */
	public static function is_defined( $input ) {
		_deprecated_function( __METHOD__, 'GB 15.1', 'WP_Fonts_Utils::is_defined()' );

		return WP_Fonts_Utils::is_defined( $input );
	}
}
