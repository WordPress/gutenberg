/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Returns an action object used in signalling that items have been received.
 *
 * @param {Array} items Items received.
 *
 * @return {Object} Action object.
 */
export function receiveItems( items ) {
	return {
		type: 'RECEIVE_ITEMS',
		items: castArray( items ),
	};
}

/**
 * Returns an action object used in signalling that entity records have been
 * deleted and they need to be removed from entities state.
 *
 * @param {string}       kind             Kind of the removed entities.
 * @param {string}       name             Name of the removed entities.
 * @param {Array|number} records          Record IDs of the removed entities.
 * @param {boolean}      invalidateCache  Controls whether we want to invalidate the cache.
 * @return {Object} Action object.
 */
export function removeItems( kind, name, records, invalidateCache = false ) {
	return {
		type: 'REMOVE_ITEMS',
		itemIds: castArray( records ),
		kind,
		name,
		invalidateCache,
	};
}

/**
 * Returns an action object used in signalling that queried data has been
 * received.
 *
 * @param {Array}   items Queried items received.
 * @param {?Object} query Optional query object.
 *
 * @return {Object} Action object.
 */
export function receiveQueriedItems( items, query = {} ) {
	return {
		...receiveItems( items ),
		query,
	};
}
