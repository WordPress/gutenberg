<?php
/**
 * WordPress 6.5 compatibility functions.
 *
 * @package WordPress
 */

if ( ! function_exists( 'array_is_list' ) ) {
	/**
	 * Polyfill for `array_is_list()` function added in PHP 8.1.
	 *
	 * Determines if the given array is a list.
	 *
	 * An array is considered a list if its keys consist of consecutive numbers from 0 to count($array)-1.
	 *
	 * @see https://github.com/symfony/polyfill-php81/tree/main
	 *
	 * @since 6.5.0
	 *
	 * @param array<mixed> $arr The array being evaluated.
	 * @return bool True if array is a list, false otherwise.
	 */
	function array_is_list( $arr ) {
		if ( ( array() === $arr ) || ( array_values( $arr ) === $arr ) ) {
			return true;
		}

		$next_key = -1;

		foreach ( $arr as $k => $v ) {
			if ( ++$next_key !== $k ) {
				return false;
			}
		}

		return true;
	}
}
