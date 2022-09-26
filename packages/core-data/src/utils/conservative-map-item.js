/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * Given the current and next item entity record, returns the minimally "modified"
 * result of the next item, preferring value references from the original item
 * if equal. If all values match, the original item is returned.
 *
 * @param {Object} item     Original item.
 * @param {Object} nextItem Next item.
 *
 * @return {Object} Minimally modified merged item.
 */
export default function conservativeMapItem( item, nextItem ) {
	// Return next item in its entirety if there is no original item.
	if ( ! item ) {
		return nextItem;
	}

	let hasChanges = false;
	const result = {};
	for ( const key in nextItem ) {
		if ( isEqual( item[ key ], nextItem[ key ] ) ) {
			result[ key ] = item[ key ];
		} else {
			hasChanges = true;
			result[ key ] = nextItem[ key ];
		}
	}

	if ( ! hasChanges ) {
		return item;
	}

	// Only at this point, backfill properties from the original item which
	// weren't explicitly set into the result above. This is an optimization
	// to allow `hasChanges` to return early.
	for ( const key in item ) {
		if ( ! result.hasOwnProperty( key ) ) {
			result[ key ] = item[ key ];
		}
	}

	return result;
}
