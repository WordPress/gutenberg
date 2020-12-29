<?php
/**
 * General utilities.
 *
 * @package gutenberg
 */

/**
 * This function allows to easily access a part from a php array.
 * It is equivalent to want lodash get provides for JavaScript and is useful to have something similar
 * in php so functions that do the same thing on the client and sever can have identical code.
 *
 * @param array $array    An array from where we want to retrieve some information from.
 * @param array $path     An array containing the path we want to retrieve.
 * @param array $default  The return value if $array or $path is not expected input type.
 *
 * @return array An array matching the path specified.
 */
function gutenberg_experimental_get( $array, $path, $default = array() ) {
	// Confirm input values are expected type to avoid notice warnings.
	if ( ! is_array( $array ) || ! is_array( $path ) ) {
		return $default;
	}

	$path_length = count( $path );
	for ( $i = 0; $i < $path_length; ++$i ) {
		if ( ! isset( $array[ $path[ $i ] ] ) ) {
			return $default;
		}
		$array = $array[ $path[ $i ] ];
	}
	return $array;
}

/**
 * Sets an array in depth based on a path of keys.
 *
 * It is the PHP equivalent of JavaScript's `lodash.set()` and mirroring it may help other components
 * retain some symmetry between client and server implementations.
 *
 * Example usage:
 *
 *     $array = array();
 *     _wp_array_set( $array, array( 'a', 'b', 'c', 1 );
 *     $array becomes:
 *     array(
 *         'a' => array(
 *             'b' => array(
 *                 'c' => 1,
 *             ),
 *         ),
 *     );
 *
 * @param array $array   An array that we want to mutate to include a specific value in a path.
 * @param array $path    An array of keys describing the path that we want to mutate.
 * @param mixed $value   The value that will be set.
 */
function gutenberg_experimental_set( &$array, $path, $value = null ) {
	// Confirm $array is valid.
	if ( ! is_array( $array ) ) {
		return;
	}

	// Confirm $path is valid.
	if ( ! is_array( $path ) ) {
		return;
	}
	$path_length = count( $path );
	if ( 0 === $path_length ) {
		return;
	}
	foreach ( $path as $path_element ) {
		if (
			! is_string( $path_element ) && ! is_integer( $path_element ) &&
			! is_null( $path_element )
		) {
			return;
		}
	}

	$i;
	for ( $i = 0; $i < $path_length - 1; ++$i ) {
		$path_element = $path[ $i ];
		if (
			! array_key_exists( $path_element, $array ) ||
			! is_array( $array[ $path_element ] )
		) {
			$array[ $path_element ] = array();
		}
		$array = &$array[ $path_element ];
	}
	$array[ $path[ $i ] ] = $value;
}
