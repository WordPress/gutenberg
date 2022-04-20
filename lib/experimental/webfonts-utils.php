<?php
/**
 * Stores utility functions used by the Webfonts API.
 *
 * @package gutenberg
 */

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
