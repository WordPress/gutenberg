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
 * @param array $array  An array from where we want to retrieve some information from.
 * @param array $path   An array containing the path we want to retrieve.
 *
 * @return array Containing a set of css rules.
 */
function gutenberg_experimental_get( $array, $path ) {
	// Confirm an array is passed in to avoid notice warnings.
	if ( ! is_array( $array ) ) {
		return array();
	}

	$path_length = count( $path );
	for ( $i = 0; $i < $path_length; ++$i ) {
		if ( empty( $array[ $path[ $i ] ] ) ) {
			return null;
		}
		$array = $array[ $path[ $i ] ];
	}
	return $array;
}
