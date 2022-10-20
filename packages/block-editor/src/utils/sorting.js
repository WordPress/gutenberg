/**
 * Recursive sorting criteria function.
 *
 * @param {string|Function|Array} criteria Field(s) to sort by.
 * @return {Function} Comparison function to be used in a `.sort()`.
 */
const sortBy = ( criteria ) => {
	return ( a, b ) => {
		let cmpA, cmpB;

		if ( typeof criteria === 'function' ) {
			cmpA = criteria( a );
			cmpB = criteria( b );
		} else {
			cmpA = a[ criteria ];
			cmpB = b[ criteria ];
		}

		if ( cmpA > cmpB ) {
			return 1;
		} else if ( cmpB > cmpA ) {
			return -1;
		}

		return 0;
	};
};

/**
 * Order items by a certain key.
 * Supports decorator functions that allow complex picking of a comparison field.
 * Sorts in ascending order by default, but supports descending as well.
 *
 * @param {Array}           items    Items to order.
 * @param {string|Function} criteria Field to order by.
 * @param {string}          order    Sorting order, `asc` or `desc`.
 * @return {Array} Sorted items.
 */
export function orderBy( items, criteria, order = 'asc' ) {
	const result = items.concat().sort( sortBy( criteria ) );

	if ( order === 'desc' ) {
		return result.reverse();
	}
	return result;
}
