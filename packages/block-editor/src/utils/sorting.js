/**
 * Recursive stable sorting comparator function.
 *
 * @param {string|Function} field Field to sort by.
 * @param {string}          order Order, 'asc' or 'desc'.
 * @return {Function} Comparison function to be used in a `.sort()`.
 */
const comparator = ( field, order ) => {
	return ( a, b ) => {
		let cmpA, cmpB;

		if ( typeof field === 'function' ) {
			cmpA = field( a );
			cmpB = field( b );
		} else {
			cmpA = a[ field ];
			cmpB = b[ field ];
		}

		let result = 0;
		if ( cmpA > cmpB ) {
			result = 1;
		} else if ( cmpB > cmpA ) {
			result = -1;
		}

		return order === 'asc' ? result : -result;
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
	return items.concat().sort( comparator( field, order ) );
}
