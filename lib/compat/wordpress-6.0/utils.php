<?php
/**
 * Generic helper functions
 *
 * @package WordPress
 * @since 6.0
 */

/**
 * Sorts the keys of an array alphabetically.
 * The array is passed by reference so it doesn't get returned
 * which mimiks the behaviour of ksort.
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
