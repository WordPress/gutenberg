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

/**
 * This function is trying to replicate what
 * lodash's kebabCase (JS library) does in the client.
 *
 * The reason for that is that we do some processing
 * in both the client and the server (e.g.: we generate
 * preset classes from preset slugs) that needs to
 * behave the same.
 *
 * Due to backward compatibility we need to keep the
 * client's library as it is, hence, we have to
 * make the server behave like the client.
 *
 * @param string $string The string to kebab-case.
 *
 * @return string kebab-cased-string.
 */
function gutenberg_experimental_to_kebab_case( $string ) {
	$regexp = '#'.implode('|', [
		'[a-z]?[A-Z]+',
		'[A-Z]?[a-z]+',
		'\d+',
	]).'#';
	preg_match_all( $regexp, $string, $matches );
	return implode( '-', $matches[0] );
}
