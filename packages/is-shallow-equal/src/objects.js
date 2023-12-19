/**
 * Returns true if the two objects are shallow equal, or false otherwise.
 *
 * @param {import('.').ComparableObject} a First object to compare.
 * @param {import('.').ComparableObject} b Second object to compare.
 *
 * @return {boolean} Whether the two objects are shallow equal.
 */
export default function isShallowEqualObjects( a, b ) {
	const aKeys = Object.keys( a );
	const bKeys = Object.keys( b );

	if ( aKeys.length !== bKeys.length ) {
		return false;
	}

	for ( let i = 0, len = aKeys.length; i < len; i++ ) {
		const key = aKeys[ i ];

		// In iterating only the keys of the first object after verifying
		// equal lengths, account for the case that an explicit `undefined`
		// value in the first is implicitly undefined in the second.
		//
		// Example: isShallowEqualObjects( { a: undefined, b: 5 }, { b: 5 } )
		if ( ! b.hasOwnProperty( key ) || a[ key ] !== b[ key ] ) {
			return false;
		}
	}

	return true;
}
