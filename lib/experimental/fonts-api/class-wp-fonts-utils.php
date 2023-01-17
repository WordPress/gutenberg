<?php
/**
 * Font API's utility helpers.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( class_exists( 'WP_Fonts_Utils' ) ) {
	return;
}

/**
 * Utility helpers for the Fonts API.
 *
 * @since X.X.X
 */
class WP_Fonts_Utils {

	/**
	 * Converts the given font family into a handle.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family Font family to convert into a handle.
	 * @return string|null The font family handle on success. Else, null.
	 */
	public static function convert_font_family_into_handle( $font_family ) {
		if ( ! self::is_defined( $font_family ) ) {
			return null;
		}

		// If the font-family is a comma-separated list (example: "Inter, sans-serif" ), use just the first font.
		if ( str_contains( $font_family, ',' ) ) {
			$font_family = explode( ',', $font_family )[0];
		}

		return sanitize_title( $font_family );
	}

	/**
	 * Converts the given variation and its font-family into a handle.
	 *
	 * @since X.X.X
	 *
	 * @param string $font_family The font family's handle for this variation.
	 * @param array  $variation   An array of variation properties.
	 * @return string|null The variation handle.
	 */
	public static function convert_variation_into_handle( $font_family, array $variation ) {
		$handle = '';
		foreach ( array( 'font-weight', 'font-style' ) as $property ) {
			if ( ! array_key_exists( $property, $variation ) || ! static::is_defined( $variation[ $property ] ) ) {
				continue;
			}

			$handle .= ' ' . $variation[ $property ];
		}

		if ( '' === $handle ) {
			trigger_error( 'Variant handle could not be determined as font-weight and/or font-style are require' );
			return null;
		}

		return sanitize_title( $font_family . $handle );
	}

	/**
	 * Gets the font family from the variation.
	 *
	 * @since X.X.X
	 *
	 * @param array $variation An array of variation properties to search.
	 * @return string|null The font family if defined. Else, null.
	 */
	public static function get_font_family_from_variation( array $variation ) {
		return static::search_for_font_family( $variation );
	}

	/**
	 * Checks if the given input is defined, i.e. meaning is a non-empty string.
	 *
	 * @since X.X.X
	 *
	 * @param string $input The input to check.
	 * @return bool True when non-empty string. Else false.
	 */
	public static function is_defined( $input ) {
		return ( is_string( $input ) && ! empty( $input ) );
	}

	/**
	 * Searches the variation array to extract the font family.
	 *
	 * @since X.X.X
	 *
	 * @param array $haystack An array of variation properties to search.
	 * @return string|null The font family when found. Else, null.
	 */
	private static function search_for_font_family( array $haystack ) {
		if ( array_key_exists( 'fontFamily', $haystack ) ) {
			$key = 'fontFamily';
		} elseif ( array_key_exists( 'font-family', $haystack ) ) {
			$key = 'font-family';
		} else {
			trigger_error( 'Font family not found.' );
			return null;
		}

		if ( static::is_defined( $haystack[ $key ] ) ) {
			// If the font-family is a comma-separated list (example: "Inter, sans-serif" ), use just the first font.
			if ( strpos( $haystack[ $key ], ',' ) !== false ) {
				return explode( ',', $haystack[ $key ] )[0];
			}
			return $haystack[ $key ];
		}

		trigger_error( 'Font family not defined in the variation.' );
		return null;
	}
}
