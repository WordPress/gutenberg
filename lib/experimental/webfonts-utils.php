<?php
/**
 * Stores utility functions used by the Webfonts API.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_resolve_font_face_uri' ) ) {
	/**
	 * Transforms the source of the font face from `file.:/` into an actual URI.
	 *
	 * @since 6.0.0
	 * @private
	 *
	 * @param array $font_face The font face.
	 * @return array The URI-resolved font face.
	 */
	function _wp_resolve_font_face_uri( array $font_face ) {
		if ( empty( $font_face['src'] ) ) {
			return $font_face;
		}

		$font_face['src'] = (array) $font_face['src'];

		foreach ( $font_face['src'] as $src_key => $url ) {
			// Tweak the URL to be relative to the theme root.
			if ( ! str_starts_with( $url, 'file:./' ) ) {
				continue;
			}
			$font_face['src'][ $src_key ] = get_theme_file_uri( str_replace( 'file:./', '', $url ) );
		}

		return $font_face;
	}
}

/**
 * Finds $webfont_to_find in $webfonts.
 *
 * @since 6.0.0
 * @private
 *
 * @param array[] $webfonts The webfonts array.
 * @param array   $webfont_to_find The webfont to find.
 * @return integer|false The index of $webfont in $webfonts if found. False otherwise.
 */
function _gutenberg_find_webfont( array $webfonts, $webfont_to_find ) {
	if ( empty( $webfonts ) ) {
		return false;
	}

	$is_camel_case = isset( $webfonts[0]['fontFamily'] );

	foreach ( $webfonts as $index => $webfont ) {
		$equality_attrs = $is_camel_case
			? array( 'fontFamily', 'fontStyle', 'fontWeight' )
			: array( 'font-family', 'font-style', 'font-weight' );

		$found = $index;
		foreach ( $equality_attrs as $attr ) {
			// Bail out if the attribute does not exist, or if the values are not equal.
			if (
				empty( $webfont[ $attr ] ) ||
				empty( $webfont_to_find[ $attr ] ) ||
				$webfont[ $attr ] !== $webfont_to_find[ $attr ]
			) {
				$found = false;
				break;
			}
		}
		if ( false !== $found ) {
			return $found;
		}
	}

	return false;
}

if ( ! function_exists( '_wp_array_keys_to_camel_case' ) ) {
	/**
	 * Transforms the keys in the given array to camelCase.
	 *
	 * @since 6.0.0
	 * @private
	 *
	 * @param array $to_transform The array to transform.
	 * @return array Given array with camelCase keys.
	 */
	function _wp_array_keys_to_camel_case( array $to_transform ) {
		$camel_cased_array = array();

		foreach ( $to_transform as $key => $value ) {
			$camel_cased_array[ lcfirst( str_replace( '-', '', ucwords( $key, '-' ) ) ) ] = $value;
		}

		return $camel_cased_array;
	}
}

if ( ! function_exists( '_wp_array_keys_to_kebab_case' ) ) {
	/**
	 * Transforms the keys in the given array to kebab-case.
	 *
	 * @since 6.0.0
	 * @private
	 *
	 * @param array $to_transform The array to be transformed.
	 * @return array Given array with kebab-case keys.
	 */
	function _wp_array_keys_to_kebab_case( array $to_transform ) {
		$kebab_cased_array = array();

		foreach ( $to_transform as $key => $value ) {
			$kebab_cased_array[ _wp_to_kebab_case( $key ) ] = $value;
		}

		return $kebab_cased_array;
	}
}
