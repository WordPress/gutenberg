type Comparable = string | number | undefined;
type SortItem = Record< string, Comparable >;
type SortField< T > = string | ( ( item: T ) => Comparable );

/**
 * Mirrors the `>` operator for `Comparable` values: lexicographic when both
 * are strings, numeric otherwise (an `undefined` operand is never greater).
 *
 * @param a Left-hand value.
 * @param b Right-hand value.
 * @return Whether `a` is greater than `b`.
 */
function isGreater( a: Comparable, b: Comparable ): boolean {
	if ( typeof a === 'string' && typeof b === 'string' ) {
		return a > b;
	}
	return Number( a ) > Number( b );
}

/**
 * Recursive stable sorting comparator function.
 *
 * @param field Field to sort by.
 * @param items Items to sort.
 * @param order Order, 'asc' or 'desc'.
 * @return Comparison function to be used in a `.sort()`.
 */
const comparator = < T extends SortItem >(
	field: SortField< T >,
	items: T[],
	order: string
) => {
	return ( a: T, b: T ) => {
		let cmpA: Comparable, cmpB: Comparable;

		if ( typeof field === 'function' ) {
			cmpA = field( a );
			cmpB = field( b );
		} else {
			cmpA = a[ field ];
			cmpB = b[ field ];
		}

		if ( isGreater( cmpA, cmpB ) ) {
			return order === 'asc' ? 1 : -1;
		} else if ( isGreater( cmpB, cmpA ) ) {
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
 * @param items Items to order.
 * @param field Field to order by.
 * @param order Sorting order, `asc` or `desc`.
 * @return Sorted items.
 */
export function orderBy< T extends SortItem >(
	items: T[],
	field: SortField< T >,
	order = 'asc'
) {
	return items.concat().sort( comparator( field, items, order ) );
}
