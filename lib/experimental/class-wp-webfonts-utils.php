<?php
/**
 * Webfont API's utility helpers.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      X.X.X
 */

if ( class_exists( 'WP_Webfonts_Utils' ) ) {
	return;
}

/**
 * Utility helpers for the Webfonts API.
 *
 * @since X.X.X
 */
class WP_Webfonts_Utils {

	/**
	 * Converts the given font family into a handle.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family Font family to convert into a handle.
	 * @return string|null The font family handle on success. Else, null.
	 */
	public static function convert_font_family_into_handle( $font_family ) {
		if ( ! is_string( $font_family ) || empty( $font_family ) ) {
			return null;
		}

		return sanitize_title( $font_family );
	}
}
