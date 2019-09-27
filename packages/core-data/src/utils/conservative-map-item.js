/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * Given the current and next item entity, returns the minimally "modified"
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
	return result;
}
