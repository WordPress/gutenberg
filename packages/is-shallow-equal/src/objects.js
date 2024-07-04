/**
 * Internal dependencies
 */
import isShallowEqualArrays from './arrays';

/**
 * Checks for shallow array equality and returns true if the two values are equal, or false otherwise.
 *
 * @param {any} a
 * @param {any} b
 *
 * @return {boolean} Whether the two values are equal.
 */
function isEqual( a, b ) {
	if ( Array.isArray( a ) && Array.isArray( b ) ) {
		return isShallowEqualArrays( a, b );
	}

	if ( a === b ) {
		return true;
	}

	return false;
}

/**
 * Returns true if the two objects are shallow equal, or false otherwise.
 *
 * @param {import('.').ComparableObject} a First object to compare.
 * @param {import('.').ComparableObject} b Second object to compare.
 *
 * @return {boolean} Whether the two objects are shallow equal.
 */
export default function isShallowEqualObjects( a, b ) {
	if ( a === b ) {
		return true;
	}

	const aKeys = Object.keys( a );
	const bKeys = Object.keys( b );

	if ( aKeys.length !== bKeys.length ) {
		return false;
	}

	let i = 0;

	while ( i < aKeys.length ) {
		const key = aKeys[ i ];
		const aValue = a[ key ];

		if (
			// In iterating only the keys of the first object after verifying
			// equal lengths, account for the case that an explicit `undefined`
			// value in the first is implicitly undefined in the second.
			//
			// Example: isShallowEqualObjects( { a: undefined }, { b: 5 } )
			( aValue === undefined && ! b.hasOwnProperty( key ) ) ||
			! isEqual( aValue, b[ key ] )
		) {
			return false;
		}

		i++;
	}

	return true;
}
