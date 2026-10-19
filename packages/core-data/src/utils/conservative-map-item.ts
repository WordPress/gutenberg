import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * Given the current and next item entity record, returns the minimally "modified"
 * result of the next item, preferring value references from the original item
 * if equal. If all values match, the original item is returned.
 *
 * @param item     Original item.
 * @param nextItem Next item.
 *
 * @return Minimally modified merged item.
 */
export default function conservativeMapItem<
	I extends Record< string, unknown >,
	N extends Record< string, unknown >,
>( item: I | undefined, nextItem: N ): I & N {
	// Return next item in its entirety if there is no original item.
	if ( ! item ) {
		// With no original item, the next item is the whole result.
		return nextItem as I & N;
	}

	let hasChanges = false;
	const result: Record< string, unknown > = {};
	for ( const key in nextItem ) {
		if ( fastDeepEqual( item[ key ], nextItem[ key ] ) ) {
			result[ key ] = item[ key ];
		} else {
			hasChanges = true;
			result[ key ] = nextItem[ key ];
		}
	}

	if ( ! hasChanges ) {
		// Unchanged, so the original item has every value of the next one.
		return item as I & N;
	}

	// Only at this point, backfill properties from the original item which
	// weren't explicitly set into the result above. This is an optimization
	// to allow `hasChanges` to return early.
	for ( const key in item ) {
		if ( ! result.hasOwnProperty( key ) ) {
			result[ key ] = item[ key ];
		}
	}

	// Holds every key of both items, with the values of the next item.
	return result as I & N;
}
