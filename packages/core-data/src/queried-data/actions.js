/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Returns an action object used in signalling that items have been received.
 *
 * @param {Array}   items Items received.
 * @param {?Object} edits Optional edits to reset.
 *
 * @return {Object} Action object.
 */
export function receiveItems( items, edits ) {
	return {
		type: 'RECEIVE_ITEMS',
		items: castArray( items ),
		persistedEdits: edits,
	};
}

/**
 * Returns an action object used in signalling that entity records have been
 * deleted and they need to be removed from entities state.
 *
 * @param {string}              kind            Kind of the removed entities.
 * @param {string}              name            Name of the removed entities.
 * @param {Array|number|string} records         Record IDs of the removed entities.
 * @param {boolean}             invalidateCache Controls whether we want to invalidate the cache.
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
 * @param {?Object} edits Optional edits to reset.
 *
 * @return {Object} Action object.
 */
export function receiveQueriedItems( items, query = {}, edits ) {
	return {
		...receiveItems( items, edits ),
		query,
	};
}
