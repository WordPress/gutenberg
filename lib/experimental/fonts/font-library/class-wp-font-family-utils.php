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

if ( class_exists( 'WP_Font_Family_Utils' ) ) {
	return;
}

/**
 * A class of utilities for working with the Font Library.
 *
 * @since 6.5.0
 */
class WP_Font_Family_Utils {

	/**
	 * Generates a filename for a font face asset.
	 *
	 * Creates a filename for a font face asset using font family, style, weight and
	 * extension information.
	 *
	 * @since 6.5.0
	 *
	 * @param string $font_slug The font slug to use in the filename.
	 * @param array  $font_face The font face array containing 'fontFamily', 'fontStyle', and
	 *                          'fontWeight' attributes.
	 * @param string $url       The URL of the font face asset, used to derive the file extension.
	 * @param string $suffix    Optional. The suffix added to the resulting filename. Default empty string.
	 * @return string The generated filename for the font face asset.
	 */
	public static function get_filename_from_font_face( $font_slug, $font_face, $url, $suffix = '' ) {
		$extension = pathinfo( $url, PATHINFO_EXTENSION );
		$filename  = "{$font_slug}_{$font_face['fontStyle']}_{$font_face['fontWeight']}";
		if ( '' !== $suffix ) {
			$filename .= "_{$suffix}";
		}

		return sanitize_file_name( "{$filename}.{$extension}" );
	}

	/**
	 * Merges two fonts and their font faces.
	 *
	 * @since 6.5.0
	 *
	 * @param array $font1 The first font to merge.
	 * @param array $font2 The second font to merge.
	 * @return array|WP_Error The merged font or WP_Error if the fonts have different slugs.
	 */
	public static function merge_fonts_data( $font1, $font2 ) {
		if ( $font1['slug'] !== $font2['slug'] ) {
			return new WP_Error(
				'fonts_must_have_same_slug',
				__( 'Fonts must have the same slug to be merged.', 'gutenberg' )
			);
		}

		$font_faces_1      = isset( $font1['fontFace'] ) ? $font1['fontFace'] : array();
		$font_faces_2      = isset( $font2['fontFace'] ) ? $font2['fontFace'] : array();
		$merged_font_faces = array_merge( $font_faces_1, $font_faces_2 );

		$serialized_faces        = array_map( 'serialize', $merged_font_faces );
		$unique_serialized_faces = array_unique( $serialized_faces );
		$unique_faces            = array_map( 'unserialize', $unique_serialized_faces );

		$merged_font             = array_merge( $font1, $font2 );
		$merged_font['fontFace'] = array_values( $unique_faces );

		return $merged_font;
	}

	/**
	 * Format font family to make it valid CSS.
	 *
	 * @since 6.5.0
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
