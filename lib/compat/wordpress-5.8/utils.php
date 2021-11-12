<?php
/**
 * General utilities.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_array_set' ) ) {
	/**
	 * Sets an array in depth based on a path of keys.
	 *
	 * It is the PHP equivalent of JavaScript's `lodash.set()` and mirroring it may help other components
	 * retain some symmetry between client and server implementations.
	 *
	 * Example usage:
	 *
	 *     $array = array();
	 *     _wp_array_set( $array, array( 'a', 'b', 'c', 1 ) );
	 *
	 *     $array becomes:
	 *     array(
	 *         'a' => array(
	 *             'b' => array(
	 *                 'c' => 1,
	 *             ),
	 *         ),
	 *     );
	 *
	 * @internal
	 *
	 * @since 5.8.0
	 * @access private
	 *
	 * @param array $array An array that we want to mutate to include a specific value in a path.
	 * @param array $path  An array of keys describing the path that we want to mutate.
	 * @param mixed $value The value that will be set.
	 */
	function _wp_array_set( &$array, $path, $value = null ) {
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
}

if ( ! function_exists( '_wp_to_kebab_case' ) ) {
	/**
	 * This function is trying to replicate what
	 * lodash's kebabCase (JS library) does in the client.
	 *
	 * The reason we need this function is that we do some processing
	 * in both the client and the server (e.g.: we generate
	 * preset classes from preset slugs) that needs to
	 * create the same output.
	 *
	 * We can't remove or update the client's library due to backward compatibility
	 * (some of the output of lodash's kebabCase is saved in the post content).
	 * We have to make the server behave like the client.
	 *
	 * Changes to this function should follow updates in the client
	 * with the same logic.
	 *
	 * @link https://github.com/lodash/lodash/blob/4.17/dist/lodash.js#L14369
	 * @link https://github.com/lodash/lodash/blob/4.17/dist/lodash.js#L278
	 * @link https://github.com/lodash-php/lodash-php/blob/master/src/String/kebabCase.php
	 * @link https://github.com/lodash-php/lodash-php/blob/master/src/internal/unicodeWords.php
	 *
	 * @param string $string The string to kebab-case.
	 *
	 * @return string kebab-cased-string.
	 */
	function _wp_to_kebab_case( $string ) {
		//phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// ignore the camelCase names for variables so the names are the same as lodash
		// so comparing and porting new changes is easier.

		/*
		* Some notable things we've removed compared to the lodash version are:
		*
		* - non-alphanumeric characters: rsAstralRange, rsEmoji, etc
		* - the groups that processed the apostrophe, as it's removed before passing the string to preg_match: rsApos, rsOptContrLower, and rsOptContrUpper
		*
		*/

		/** Used to compose unicode character classes. */
		$rsLowerRange       = 'a-z\\xdf-\\xf6\\xf8-\\xff';
		$rsNonCharRange     = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf';
		$rsPunctuationRange = '\\x{2000}-\\x{206f}';
		$rsSpaceRange       = ' \\t\\x0b\\f\\xa0\\x{feff}\\n\\r\\x{2028}\\x{2029}\\x{1680}\\x{180e}\\x{2000}\\x{2001}\\x{2002}\\x{2003}\\x{2004}\\x{2005}\\x{2006}\\x{2007}\\x{2008}\\x{2009}\\x{200a}\\x{202f}\\x{205f}\\x{3000}';
		$rsUpperRange       = 'A-Z\\xc0-\\xd6\\xd8-\\xde';
		$rsBreakRange       = $rsNonCharRange . $rsPunctuationRange . $rsSpaceRange;

		/** Used to compose unicode capture groups. */
		$rsBreak  = '[' . $rsBreakRange . ']';
		$rsDigits = '\\d+'; // The last lodash version in GitHub uses a single digit here and expands it when in use.
		$rsLower  = '[' . $rsLowerRange . ']';
		$rsMisc   = '[^' . $rsBreakRange . $rsDigits . $rsLowerRange . $rsUpperRange . ']';
		$rsUpper  = '[' . $rsUpperRange . ']';

		/** Used to compose unicode regexes. */
		$rsMiscLower = '(?:' . $rsLower . '|' . $rsMisc . ')';
		$rsMiscUpper = '(?:' . $rsUpper . '|' . $rsMisc . ')';
		$rsOrdLower  = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])';
		$rsOrdUpper  = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])';

		$regexp = '/' . implode(
			'|',
			array(
				$rsUpper . '?' . $rsLower . '+' . '(?=' . implode( '|', array( $rsBreak, $rsUpper, '$' ) ) . ')',
				$rsMiscUpper . '+' . '(?=' . implode( '|', array( $rsBreak, $rsUpper . $rsMiscLower, '$' ) ) . ')',
				$rsUpper . '?' . $rsMiscLower . '+',
				$rsUpper . '+',
				$rsOrdUpper,
				$rsOrdLower,
				$rsDigits,
			)
		) . '/u';

		preg_match_all( $regexp, str_replace( "'", '', $string ), $matches );
		return strtolower( implode( '-', $matches[0] ) );
		//phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	}
}
