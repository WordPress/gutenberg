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
