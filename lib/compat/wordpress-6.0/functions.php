<?php
/**
 * Generic helper functions.
 *
 * @package WordPress
 * @since 6.0.0
 */

if ( ! function_exists( 'wp_recursive_ksort' ) ) {
	/**
	 * Sorts the keys of an array alphabetically.
	 * The array is passed by reference so it doesn't get returned
	 * which mimics the behaviour of ksort.
	 *
	 * @since 6.0.0
	 *
	 * @param array $array The array to sort, passed by reference.
	 */
	function wp_recursive_ksort( &$array ) {
		foreach ( $array as &$value ) {
			if ( is_array( $value ) ) {
				wp_recursive_ksort( $value );
			}
		}
		ksort( $array );
	}
}
