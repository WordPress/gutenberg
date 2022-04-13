<?php
/**
 * Stores utility functions used by the Webfonts API.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_array_keys_to_kebab_case' ) ) {
	/**
	 * Transforms the keys of the array to kebab-case.
	 *
	 * @param array $array The array to be tranformed.
	 *
	 * @return array The kebab-cased array.
	 */
	function _wp_array_keys_to_kebab_case( $array ) {
		$kebab_cased_array = array();

		foreach ( $array as $key => $value ) {
			$kebab_cased_array[ _wp_to_kebab_case( $key ) ] = $value;
		}

		return $kebab_cased_array;
	}
}

/**
 * Transforms the source of the font face from `file.:/` into an actual URI.
 *
 * @param array $font_face The font face.
 *
 * @return array The URI-resolved font face.
 */
function gutenberg_resolve_font_face_uri( $font_face ) {
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

/**
 * Compares two webfonts.
 *
 * @param array   $a The first webfont.
 * @param array   $b The second webfont.
 * @param boolean $is_camel_case If the font attributes are in camel case or kebab case. Defaults to camel case.
 *
 * @return boolean True if they're equal, false otherwise.
 */
function gutenberg_is_webfont_equal( $a, $b, $is_camel_case = true ) {
	$equality_attrs = $is_camel_case ? array(
		'fontFamily',
		'fontStyle',
		'fontWeight',
	) : array(
		'font-family',
		'font-style',
		'font-weight',
	);

	foreach ( $equality_attrs as $attr ) {
		if ( $a[ $attr ] !== $b[ $attr ] ) {
			return false;
		}
	}

	return true;
}

/**
 * Finds $webfont_to_find in $webfonts.
 *
 * @param array[] $webfonts The webfonts array.
 * @param array   $webfont_to_find The webfont to find.
 *
 * @return integer|false The index of $webfont in $webfonts if found. False otherwise.
 */
function gutenberg_find_webfont( $webfonts, $webfont_to_find ) {
	if ( ! count( $webfonts ) ) {
		return false;
	}

	$is_camel_case = isset( $webfonts[0]['fontFamily'] );

	foreach ( $webfonts as $index => $webfont ) {
		if ( gutenberg_is_webfont_equal( $webfont, $webfont_to_find, $is_camel_case ) ) {
			return $index;
		}
	}

	return false;
}

if ( ! function_exists( '_wp_array_keys_to_camel_case' ) ) {
	/**
	 * Transforms the keys of the array from kebab-case to camel-case.
	 *
	 * @param array $array The kebab-cased array.
	 *
	 * @return array The camel-cased array.
	 */
	function _wp_array_keys_to_camel_case( $array ) {
		$camel_cased_array = array();

		foreach ( $array as $key => $value ) {
			$camel_cased_array[ lcfirst( str_replace( '-', '', ucwords( $key, '-' ) ) ) ] = $value;
		}

		return $camel_cased_array;
	}
}
