/**
 * Internal dependencies
 */
import {
	TOGGLE_IS_REQUESTING,
	RECEIVE_ITEMS,
} from './constant';

/**
 * Returns an action object used in signalling whether a request for queried
 * data is in progress.
 *
 * @param {?Object} query        Optional query object.
 * @param {boolean} isRequesting Whether request is in progress.
 *
 * @return {Object} Action object.
 */
export function toggleIsRequesting( query = {}, isRequesting ) {
	return {
		type: TOGGLE_IS_REQUESTING,
		query,
		isRequesting,
	};
}

/**
 * Returns an action object used in signalling that items have been received.
 *
 * @param {Array} items Items received.
 *
 * @return {Object} Action object.
 */
export function receiveItems( items ) {
	return {
		type: RECEIVE_ITEMS,
		items,
	};
}

/**
 * Returns an action object used in signalling that queried data has been
 * received.
 *
 * @param {?Object} query Optional query object.
 * @param {Array}   items Queried items received.
 *
 * @return {Object} Action object.
 */
export function receiveQueriedItems( query = {}, items ) {
	return {
		...receiveItems( items ),
		query,
	};
}
