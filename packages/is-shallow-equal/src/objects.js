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
			aValue !== b[ key ]
		) {
			return false;
		}

		i++;
	}

	return true;
}
