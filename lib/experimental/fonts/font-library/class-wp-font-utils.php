<?php
/**
 * Fonts Family Utils class.
 *
 * This file contains utils fot Font Family class.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

if ( ! class_exists( 'WP_Font_Utils' ) ) {

	/**
	 * A class of utilities for working with the Font Library.
	 *
	 * These utilities may change or be removed in the future and are intended for internal use only.
	 *
	 * @since 6.5.0
	 * @access private
	 */
	class WP_Font_Utils {
		/**
		 * Format font family names with surrounding quotes when the name contains a space.
		 *
		 * @since 6.5.0
		 * @access private
		 *
		 * @param string $font_family Font family attribute.
		 * @return string The formatted font family attribute.
		 */
		public static function format_font_family( $font_family ) {
			if ( $font_family ) {
				$font_families         = explode( ',', $font_family );
				$wrapped_font_families = array_map(
					function ( $family ) {
						$trimmed = trim( $family );
						if ( ! empty( $trimmed ) && strpos( $trimmed, ' ' ) !== false && strpos( $trimmed, "'" ) === false && strpos( $trimmed, '"' ) === false ) {
								return '"' . $trimmed . '"';
						}
						return $trimmed;
					},
					$font_families
				);

				if ( count( $wrapped_font_families ) === 1 ) {
					$font_family = $wrapped_font_families[0];
				} else {
					$font_family = implode( ', ', $wrapped_font_families );
				}
			}

			return $font_family;
		}

		/**
		 * Generates a slug from font face properties, e.g. `open sans;normal;400;100%;U+0-10FFFF`
		 *
		 * Used for comparison with other font faces in the same family, to prevent duplicates
		 * that would both match according the CSS font matching spec. Uses only simple case-insensitive
		 * matching for fontFamily and unicodeRange, so does not handle overlapping font-family lists or
		 * unicode ranges.
		 *
		 * @since 6.5.0
		 * @access private
		 *
		 * @link https://drafts.csswg.org/css-fonts/#font-style-matching
		 *
		 * @param array $settings {
		 *     Font face settings.
		 *
		 *     @type string $fontFamily   Font family name.
		 *     @type string $fontStyle    Optional font style, defaults to 'normal'.
		 *     @type string $fontWeight   Optional font weight, defaults to 400.
		 *     @type string $fontStretch  Optional font stretch, defaults to '100%'.
		 *     @type string $unicodeRange Optional unicode range, defaults to 'U+0-10FFFF'.
		 * }
		 * @return string Font face slug.
		 */
		public static function get_font_face_slug( $settings ) {
			$settings = wp_parse_args(
				$settings,
				array(
					'fontFamily'   => '',
					'fontStyle'    => 'normal',
					'fontWeight'   => '400',
					'fontStretch'  => '100%',
					'unicodeRange' => 'U+0-10FFFF',
				)
			);

			// Convert all values to lowercase for comparison.
			// Font family names may use multibyte characters.
			$font_family   = mb_strtolower( $settings['fontFamily'] );
			$font_style    = strtolower( $settings['fontStyle'] );
			$font_weight   = strtolower( $settings['fontWeight'] );
			$font_stretch  = strtolower( $settings['fontStretch'] );
			$unicode_range = strtoupper( $settings['unicodeRange'] );

			// Convert weight keywords to numeric strings.
			$font_weight = str_replace( 'normal', '400', $font_weight );
			$font_weight = str_replace( 'bold', '700', $font_weight );

			// Convert stretch keywords to numeric strings.
			$font_stretch_map = array(
				'ultra-condensed' => '50%',
				'extra-condensed' => '62.5%',
				'condensed'       => '75%',
				'semi-condensed'  => '87.5%',
				'normal'          => '100%',
				'semi-expanded'   => '112.5%',
				'expanded'        => '125%',
				'extra-expanded'  => '150%',
				'ultra-expanded'  => '200%',
			);
			$font_stretch     = str_replace( array_keys( $font_stretch_map ), array_values( $font_stretch_map ), $font_stretch );

			$slug_elements = array( $font_family, $font_style, $font_weight, $font_stretch, $unicode_range );

			$slug_elements = array_map(
				function ( $elem ) {
					// Remove quotes to normalize font-family names, and ';' to use as a separator.
					$elem = trim( str_replace( array( '"', "'", ';' ), '', $elem ) );

					// Normalize comma separated lists by removing whitespace in between items,
					// but keep whitespace within items (e.g. "Open Sans" and "OpenSans" are different fonts).
					// CSS spec for whitespace includes: U+000A LINE FEED, U+0009 CHARACTER TABULATION, or U+0020 SPACE,
					// which by default are all matched by \s in PHP.
					return preg_replace( '/,\s+/', ',', $elem );
				},
				$slug_elements
			);

			return join( ';', $slug_elements );
		}
	}
}
