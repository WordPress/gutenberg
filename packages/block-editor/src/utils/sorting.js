/**
 * Recursive stable sorting comparator function.
 *
 * @param {string|Function} field Field to sort by.
 * @param {Array}           items Items to sort.
 * @param {string}          order Order, 'asc' or 'desc'.
 * @return {Function} Comparison function to be used in a `.sort()`.
 */
const comparator = ( field, items, order ) => {
	return ( a, b ) => {
		let cmpA, cmpB;

		if ( typeof field === 'function' ) {
			cmpA = field( a );
			cmpB = field( b );
		} else {
			cmpA = a[ field ];
			cmpB = b[ field ];
		}

		if ( cmpA > cmpB ) {
			return order === 'asc' ? 1 : -1;
		} else if ( cmpB > cmpA ) {
			return order === 'asc' ? -1 : 1;
		}

		const orderA = items.findIndex( ( item ) => item === a );
		const orderB = items.findIndex( ( item ) => item === b );

		// Stable sort: maintaining original array order
		if ( orderA > orderB ) {
			return 1;
		} else if ( orderB > orderA ) {
			return -1;
		}

		return 0;
	};
};

/**
 * Order items by a certain key.
 * Supports decorator functions that allow complex picking of a comparison field.
 * Sorts in ascending order by default, but supports descending as well.
 * Stable sort - maintains original order of equal items.
 *
 * @param {Array}           items Items to order.
 * @param {string|Function} field Field to order by.
 * @param {string}          order Sorting order, `asc` or `desc`.
 * @return {Array} Sorted items.
 */
export function orderBy( items, field, order = 'asc' ) {
	return items.concat().sort( comparator( field, items, order ) );
}
