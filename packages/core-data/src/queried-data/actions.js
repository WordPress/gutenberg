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
		items,
	};
}
/**
 * Returns an action object used in signalling that an item has been received.
 *
 * @param {Array} item Item received.
 *
 * @return {Object} Action object.
 */
export function receiveItem( item ) {
	return {
		type: 'RECEIVE_ITEM',
		item,
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

/**
 * Returns an action object used in signalling that queried data has been
 * received.
 *
 * @param {Object}   item Queried item received.
 * @param {?Object} query Optional query object.
 *
 * @return {Object} Action object.
 */
export function receiveQueriedItem( item, query = {} ) {
	return {
		...receiveItem( item ),
		query,
	};
}
