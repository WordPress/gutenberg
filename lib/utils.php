<?php
/**
 * General utilities.
 *
 * @package gutenberg
 */

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

	for ( $i = 0; $i < $path_length - 1; ++$i ) {
		$path_element = $path[ $i ];
		if (
			! array_key_exists( $path_element, $array ) ||
			! is_array( $array[ $path_element ] )
		) {
			$array[ $path_element ] = array();
		}
		$array = &$array[ $path_element ]; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.VariableRedeclaration
	}
	$array[ $path[ $i ] ] = $value;
}
